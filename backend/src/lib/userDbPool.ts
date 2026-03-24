/**
 * userDbPool.ts
 *
 * Manages a per-owner pool of Mongoose connections to user-provided databases.
 * Connections are cached in memory and reused across requests.
 * Stale connections are detected and recreated automatically.
 */

import mongoose from "mongoose";
import { decrypt } from "./crypto.js";

// In-memory pool: ownerId → active Connection
const pool = new Map<string, mongoose.Connection>();

/**
 * Returns a live Mongoose connection for the given owner.
 * Looks up their stored URI from our internal DB, decrypts it,
 * then connects (or returns the cached connection).
 */
export async function getUserConnection(
  ownerId: string,
): Promise<mongoose.Connection> {
  // Return cached if still open
  const existing = pool.get(ownerId);
  if (existing && existing.readyState === 1 /* connected */) {
    return existing;
  }

  // Load encrypted URI from our internal DB
  const record = await getUserDbRecord(ownerId);
  if (!record) {
    throw new Error(`No database connection found for owner: ${ownerId}`);
  }

  const uri = decrypt(record.encryptedUri);

  // Create a new connection
  const conn = await mongoose
    .createConnection(uri, {
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 7000,
      maxPoolSize: 5,
    })
    .asPromise();

  // Store in pool
  pool.set(ownerId, conn);

  // Cleanup on disconnect
  conn.on("disconnected", () => {
    pool.delete(ownerId);
  });
  conn.on("error", () => {
    pool.delete(ownerId);
  });

  return conn;
}

/**
 * Closes and removes a user's connection from the pool.
 * Call this when a user disconnects their DB.
 */
export async function removeUserConnection(ownerId: string): Promise<void> {
  const conn = pool.get(ownerId);
  if (conn) {
    await conn.close();
    pool.delete(ownerId);
  }
}

// ── Internal helper ───────────────────────────────────────────────────────────

async function getUserDbRecord(ownerId: string) {
  const UserDbConnection = getUserDbModel();
  return UserDbConnection.findOne({ ownerId } as any).lean();
}

function getUserDbModel() {
  if (mongoose.connection.models["UserDbConnection"]) {
    return mongoose.connection.models["UserDbConnection"];
  }
  const schema = new mongoose.Schema({
    ownerId: { type: String, required: true, unique: true },
    encryptedUri: { type: String, required: true },
    label: String,
    status: String,
    connectedAt: Date,
  });
  return mongoose.connection.model("UserDbConnection", schema);
}
