import { ApiRouteConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";
import { evictUserConnection } from "../lib/userDbPool";

export const config: ApiRouteConfig = {
  name: "disconnectUserDb",
  type: "api",
  path: "/user/db/disconnect",
  method: "POST",
  emits: [],
  flows: ["WorkflowBuilder"],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  await connectMongo();
  const { ownerId } = req.body as { ownerId: string };

  if (!ownerId) {
    return { status: 400, body: { error: "ownerId required" } };
  }

  // Remove the DB record
  const UserDbConnection = getUserDbModel();
  await UserDbConnection.deleteOne({ ownerId });

  // Close and evict the pooled connection so the next connect is fresh
  await evictUserConnection(ownerId);

  return { status: 200, body: { ok: true } };
};

function getUserDbModel() {
  if (mongoose.connection.models["UserDbConnection"]) {
    return mongoose.connection.models["UserDbConnection"];
  }
  const schema = new mongoose.Schema({
    ownerId: { type: String, required: true, unique: true },
    encryptedUri: { type: String, required: true },
    label: { type: String },
    status: { type: String },
    connectedAt: { type: Date },
  });
  return mongoose.connection.model("UserDbConnection", schema);
}
