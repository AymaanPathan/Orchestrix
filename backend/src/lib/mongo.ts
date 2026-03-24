import mongoose from "mongoose";
import userModel from "../models/user.model";
import publishedApiModel from "../models/publishedApi.model";
import workflowModel from "../models/workflow.model";
import CollectionDataModel from "../models/CollectionData.model";
import CollectionDefinitionsModel from "../models/CollectionDefinitions.model";
import { introspectDatabase } from "./schemaIntrospector";

let isConnected = false;
let schemasSeeded = false;

export async function connectMongo() {
  if (isConnected && mongoose.connection.readyState === 1) return;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {
      serverSelectionTimeoutMS: 3000,
      maxPoolSize: 5,
    });
  }

  if (!mongoose.connection.db) throw new Error("DB not ready");

  await Promise.all([
    userModel.init(),
    publishedApiModel.init(),
    workflowModel.init(),
    CollectionDataModel.init(),
    CollectionDefinitionsModel.init(),
  ]);

  // Only introspect + seed schemas once per process lifetime
  if (!schemasSeeded) {
    const schemas = await introspectDatabase();
    for (const [collectionName, fields] of Object.entries(schemas)) {
      await CollectionDefinitionsModel.updateOne(
        { collectionName },
        { $set: { fields, lastSyncedAt: new Date() } },
        { upsert: true },
      );
    }
    schemasSeeded = true;
  }

  isConnected = true;
}
