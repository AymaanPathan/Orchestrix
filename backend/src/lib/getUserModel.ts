import mongoose from "mongoose";
import { getUserConnection } from "./userDbPool.js";

export async function getUserModel(
  ownerId: string,
  collection: string,
): Promise<mongoose.Model<any>> {
  const userConn = await getUserConnection(ownerId);

  if (userConn.models[collection]) {
    return userConn.models[collection];
  }

  return userConn.model(
    collection,
    new mongoose.Schema({}, { strict: false, timestamps: true }),
    collection,
  );
}
