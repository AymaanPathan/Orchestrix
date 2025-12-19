import mongoose, { Schema } from "mongoose";

const CollectionDefinitionSchema = new Schema({
  collectionName: { type: String, unique: true },
  fields: {
    type: Map,
    of: String,
  },
  source: {
    type: String,
    enum: ["mongoose", "sampled"],
  },
  lastSyncedAt: Date,
});

export default mongoose.model(
  "CollectionDefinitions",
  CollectionDefinitionSchema
);
