import mongoose from "mongoose";
import "./models/user.model";

export function bootstrapModels() {
  return mongoose.models;
}
