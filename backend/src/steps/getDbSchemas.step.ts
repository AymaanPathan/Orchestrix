// src/steps/getDbSchemas.step.ts
import { ApiRouteConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
import CollectionDefinitionsModel from "../models/CollectionDefinitions.model";

export const config: ApiRouteConfig = {
  name: "getDbSchemas",
  type: "api",
  path: "/db/schemas",
  method: "GET",
  emits: [],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  await connectMongo();
  const { logger } = ctx;

  const collections = await CollectionDefinitionsModel.find({}).lean();

  const schemas = collections.reduce<Record<string, string[]>>((acc, col) => {
    if (!col.collectionName) return acc; // ✅ guard

    acc[col.collectionName] = Object.keys(col.fields || {});
    return acc;
  }, {});

  logger.info("📦 DB schemas fetched", {
    collections: Object.keys(schemas),
  });

  return {
    status: 200,
    body: {
      ok: true,
      schemas,
    },
  };
};
