import mongoose from "mongoose";
import userModel from "../models/user.model";
import publishedApiModel from "../models/publishedApi.model";
import workflowModel from "../models/workflow.model";
import CollectionDataModel from "../models/CollectionData.model";
import CollectionDefinitionsModel from "../models/CollectionDefinitions.model";
let isConnected = false;

export async function connectMongo() {
  if (isConnected) return;

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI!);
  isConnected = true;
  await userModel.init();
  await publishedApiModel.init();
  await workflowModel.init();
  await CollectionDataModel.init();
  await CollectionDefinitionsModel.init();
  console.log("✅ MongoDB Connected");
}
