import mongoose from "mongoose";
import userModel from "../models/user.model";
import publishedApiModel from "../models/publishedApi.model";
import workflowModel from "../models/workflow.model";
import CollectionDataModel from "../models/CollectionData.model";
import CollectionDefinitionsModel from "../models/CollectionDefinitions.model";
import { introspectDatabase } from "./schemaIntrospector";

let isConnected = false;

export async function connectMongo() {
  // ✅ Fast path
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  // 1️⃣ Connect FIRST
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  // 2️⃣ Ensure DB object exists
  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection established but db not ready");
  }

  // 3️⃣ Init models (important for mongoose.models)
  await Promise.all([
    userModel.init(),
    publishedApiModel.init(),
    workflowModel.init(),
    CollectionDataModel.init(),
    CollectionDefinitionsModel.init(),
  ]);

  // 4️⃣ NOW introspect database (SAFE)
  const schemas = await introspectDatabase();

  for (const [collectionName, fields] of Object.entries(schemas)) {
    await CollectionDefinitionsModel.updateOne(
      { collectionName },
      {
        $set: {
          fields,
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  isConnected = true;
  console.log("✅ MongoDB Connected & Schemas Synced");
}
