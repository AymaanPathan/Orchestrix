import { ApiRouteConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo.js";
import { maskUri } from "../lib/maskUri.js";
import { decrypt } from "../lib/crypto.js";

interface IUserDbConnection {
  ownerId: string;
  encryptedUri: string;
  label: string;
  status: string;
  connectedAt?: Date;
}

export const config: ApiRouteConfig = {
  name: "getUserDbStatus",
  type: "api",
  path: "/user/db/status",
  method: "GET",
  emits: [],
  flows: ["WorkflowBuilder"],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  await connectMongo();

  const ownerId = req.queryParams?.ownerId as string;

  if (!ownerId) {
    return { status: 400, body: { error: "ownerId required" } };
  }

  const UserDbConnection = getUserDbModel();
  const record = await UserDbConnection.findOne({ ownerId }).lean();

  if (!record) {
    return {
      status: 200,
      body: { connected: false },
    };
  }

  let uriMasked = "(unavailable)";
  try {
    const decryptedUri = decrypt(record.encryptedUri);
    uriMasked = maskUri(decryptedUri);
  } catch {
    // URI was stored without encryption key — clear stale record
    await UserDbConnection.deleteOne({ ownerId });
    return { status: 200, body: { connected: false } };
  }

  return {
    status: 200,
    body: {
      connected: true,
      label: record.label,
      uriMasked,
      connectedAt: record.connectedAt,
      status: record.status,
    },
  };
};

function getUserDbModel() {
  if (mongoose.connection.models["UserDbConnection"]) {
    return mongoose.connection.models[
      "UserDbConnection"
    ] as mongoose.Model<IUserDbConnection>;
  }
  const schema = new mongoose.Schema<IUserDbConnection>(
    {
      ownerId: { type: String, required: true, unique: true },
      encryptedUri: { type: String, required: true },
      label: { type: String, default: "My Database" },
      status: { type: String, default: "connected" },
      connectedAt: { type: Date },
    },
    { timestamps: true },
  );
  return mongoose.connection.model<IUserDbConnection>(
    "UserDbConnection",
    schema,
  );
}
