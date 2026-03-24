/**
 * userDbPool.ts
 * Maintains a pool of mongoose connections to users' own databases.
 * Connections are cached by ownerId — no reconnect on every request.
 */
import mongoose from "mongoose";
import { connectMongo } from "./mongo";
import { decrypt } from "./crypto";

const pool = new Map<string, mongoose.Connection>();
const MAX_POOL = 5;

interface IUserDbRecord {
  ownerId: string;
  encryptedUri: string;
  label: string;
  status: string;
}

function getUserDbModel() {
  if (mongoose.connection.models["UserDbConnection"]) {
    return mongoose.connection.models[
      "UserDbConnection"
    ] as mongoose.Model<IUserDbRecord>;
  }
  const schema = new mongoose.Schema<IUserDbRecord>(
    {
      ownerId: { type: String, required: true, unique: true },
      encryptedUri: { type: String, required: true },
      label: { type: String, default: "My Database" },
      status: { type: String, default: "connected" },
    },
    { timestamps: true },
  );
  return mongoose.connection.model<IUserDbRecord>("UserDbConnection", schema);
}

export async function getUserConnection(
  ownerId: string,
): Promise<mongoose.Connection> {
  const cached = pool.get(ownerId);
  if (cached && cached.readyState === 1) return cached;

  // Evict oldest entry if at capacity
  if (pool.size >= MAX_POOL) {
    const oldestEntry = pool.entries().next();
    if (!oldestEntry.done) {
      const [oldestKey, oldestConn] = oldestEntry.value;
      try {
        await oldestConn.close();
      } catch {}
      pool.delete(oldestKey);
    }
  }

  await connectMongo();
  const record = await getUserDbModel().findOne({ ownerId }).lean();
  if (!record) throw new Error(`No database connected for owner "${ownerId}".`);

  let uri: string;
  try {
    uri = decrypt(record.encryptedUri);
  } catch {
    uri = record.encryptedUri;
  }

  const conn = await mongoose
    .createConnection(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 30_000, // ADD: don't hold idle sockets
      maxPoolSize: 3, // ADD: small pool per user conn
      family: 4,
    })
    .asPromise();

  pool.set(ownerId, conn);
  conn.on("disconnected", () => pool.delete(ownerId));
  conn.on("error", () => pool.delete(ownerId));
  return conn;
}

export async function evictUserConnection(ownerId: string): Promise<void> {
  const conn = pool.get(ownerId);
  if (conn) {
    try {
      await conn.close();
    } catch {
      /* ignore */
    }
    pool.delete(ownerId);
  }
}
