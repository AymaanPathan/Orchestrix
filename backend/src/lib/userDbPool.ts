/**
 * userDbPool.ts
 * Maintains a pool of mongoose connections to users' own databases.
 * Connections are cached by ownerId — no reconnect on every request.
 */
import mongoose from "mongoose";
import { connectMongo } from "./mongo";
import { decrypt } from "./crypto";

const pool = new Map<string, mongoose.Connection>();

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

  await connectMongo();
  const record = await getUserDbModel().findOne({ ownerId }).lean();

  if (!record) {
    throw new Error(
      `No database connected for owner "${ownerId}". Please connect your database first.`,
    );
  }

  let uri: string;
  try {
    uri = decrypt(record.encryptedUri);
  } catch {
    uri = record.encryptedUri; // plain-text fallback
  }

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error(
      "Stored database URI is corrupt. Please reconnect your database.",
    );
  }

  const conn = await mongoose
    .createConnection(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
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
