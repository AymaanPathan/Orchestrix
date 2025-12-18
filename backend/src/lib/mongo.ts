import mongoose from "mongoose";
import userModel from "../models/user.model";
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
  console.log("✅ MongoDB Connected");
}
