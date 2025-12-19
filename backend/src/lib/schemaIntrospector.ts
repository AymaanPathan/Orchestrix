import mongoose from "mongoose";

function extractFromMongoose(schema: mongoose.Schema) {
  const fields: Record<string, string> = {};

  schema.eachPath((path, type) => {
    if (
      path === "_id" ||
      path === "__v" ||
      path.startsWith("__") ||
      path === "createdAt" ||
      path === "updatedAt"
    )
      return;

    fields[path] = type.instance;
  });

  delete fields.__v; // 🛡 absolute safeguard

  return fields;
}


function extractFromDocuments(docs: any[]) {
  const fields: Record<string, string> = {};

  for (const doc of docs) {
    Object.entries(doc).forEach(([key, value]) => {
      if (key === "_id" || key === "__v") return;
      if (!fields[key]) {
        fields[key] = typeof value;
      }
    });
  }

  return fields;
}

export async function introspectDatabase() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("DB not connected");

  const collections = await db.listCollections().toArray();
  const schemas: Record<string, any> = {};

  for (const col of collections) {
    const name = col.name;

    // 1️⃣ If mongoose model exists → best source
    const model = mongoose.models[name];
    if (model?.schema) {
      schemas[name] = extractFromMongoose(model.schema);
      continue;
    }

    // 2️⃣ Fallback → sample documents
    const docs = await db.collection(name).find({}).limit(20).toArray();
    schemas[name] = extractFromDocuments(docs);
  }

  return schemas;
}
