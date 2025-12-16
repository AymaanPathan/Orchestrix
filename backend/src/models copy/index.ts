import mongoose from "mongoose";

import "./user.model";

export function loadModels() {
  return mongoose.models;
}
