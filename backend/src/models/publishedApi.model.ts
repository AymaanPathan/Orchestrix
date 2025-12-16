import mongoose from "mongoose";

const PublishApiSchema = new mongoose.Schema(
  {
    // Full executable path
    path: {
      type: String,
      required: true,
      unique: true,
    },

    // Workflow identity
    workflowId: {
      type: String,
      required: true,
      index: true,
    },

    // User visible name
    name: {
      type: String,
      required: true,
    },

    // URL-safe name
    slug: {
      type: String,
      required: true,
    },

    // Who owns this API
    ownerId: {
      type: String,
      required: true,
      index: true,
    },

    method: {
      type: String,
      default: "POST",
    },
  },
  {
    timestamps: true, // replaces manual createdAt
  }
);

export default mongoose.models.PublishedApi ||
  mongoose.model("PublishedApi", PublishApiSchema);
