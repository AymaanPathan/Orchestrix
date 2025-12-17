import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true }, // string, number, boolean, etc.
    required: { type: Boolean, default: false }, // optional
    default: { type: mongoose.Schema.Types.Mixed, default: undefined }, // allows any type
  },
  { _id: false }
);

const CollectionDefinitionSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  collectionName: { type: String, required: true },
  fields: {
    type: [FieldSchema],
    required: true,
  },
});

export default mongoose.models.CollectionDefinition ||
  mongoose.model("CollectionDefinition", CollectionDefinitionSchema);
