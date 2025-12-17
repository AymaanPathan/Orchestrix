import mongoose from "mongoose";

const DynamicDataSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  collectionName: { type: String, required: true },
  data: { type: Object, required: true },
});

export default mongoose.models.DynamicData ||
  mongoose.model("DynamicData", DynamicDataSchema);
