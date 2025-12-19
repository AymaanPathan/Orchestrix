import mongoose from "mongoose";

export function getModel(collectionName: string) {
  if (!collectionName) {
    throw new Error("Collection name missing");
  }

  // 1️⃣ Try direct model name first (fast path)
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }

  // 2️⃣ Find model by collection name
  const model = Object.values(mongoose.models).find(
    (m) => m.collection?.name === collectionName
  );

  if (!model) {
    throw new Error(
      `Model not found for collection "${collectionName}". Available collections: ${Object.values(
        mongoose.models
      )
        .map((m) => m.collection?.name)
        .join(", ")}`
    );
  }

  return model;
}
