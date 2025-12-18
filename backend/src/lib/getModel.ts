import mongoose from "mongoose";

export function getModel(step: any) {
  const key = step.model || step.collection;
  const Model = mongoose.connection.models[key];
  if (!Model) throw new Error(`Model not found: ${key}`);
  return Model;
}
