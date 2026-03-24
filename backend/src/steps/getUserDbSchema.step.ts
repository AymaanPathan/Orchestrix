import { ApiRouteConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo.js";
import { getUserConnection } from "../lib/userDbPool.js";

export const config: ApiRouteConfig = {
  name: "getUserDbSchemas",
  type: "api",
  path: "/user/db/schemas",
  method: "GET",
  emits: [],
  flows: ["WorkflowBuilder"],
};

/**
 * Introspects the user's own MongoDB and returns collections + field names.
 * Uses a connection pool so we don't re-connect on every request.
 */
export const handler: StepHandler<typeof config> = async (req, ctx) => {
  const { logger } = ctx;
  await connectMongo(); // internal DB

  const ownerId = req.queryParams?.ownerId as string;
  if (!ownerId) {
    return { status: 400, body: { error: "ownerId required" } };
  }

  let userConn: mongoose.Connection;
  try {
    userConn = await getUserConnection(ownerId);
  } catch (err: any) {
    return {
      status: 422,
      body: {
        error: "Could not connect to your database",
        detail: err.message,
      },
    };
  }

  // List collections, sample one doc per collection for field inference
  const db = userConn.db!;
  const collections = await db.listCollections().toArray();

  const schemas: Record<string, string[]> = {};

  await Promise.all(
    collections.map(async (col) => {
      const name = col.name;
      // Skip system collections
      if (name.startsWith("system.")) return;

      const sample = await db.collection(name).findOne({});
      if (sample) {
        // Filter out mongo internals
        schemas[name] = Object.keys(sample).filter((k) => k !== "__v");
      } else {
        schemas[name] = [];
      }
    }),
  );

  logger.info("User DB schemas fetched", {
    ownerId,
    collections: Object.keys(schemas),
  });

  return {
    status: 200,
    body: { ok: true, schemas },
  };
};
