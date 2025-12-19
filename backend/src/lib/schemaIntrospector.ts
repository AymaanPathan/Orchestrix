import mongoose from "mongoose";

function extractFromMongoose(schema: mongoose.Schema) {
  const fields: Record<string, string> = {};

  schema.eachPath((path, type) => {
    // 🚫 Mongo / Mongoose forbidden keys
    if (
      path === "_id" ||
      path === "__v" ||
      path === "createdAt" ||
      path === "updatedAt" ||
      path.startsWith("$") ||
      path.includes(".")
    ) {
      return;
    }

    fields[path] = type.instance;
  });

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

    // 1️⃣ Prefer mongoose schema ALWAYS (even if empty)
    const model = Object.values(mongoose.models).find(
      (m: any) => m.collection?.name === name
    );

    if (model?.schema) {
      schemas[name] = extractFromMongoose(model.schema);
      continue;
    }

    // 2️⃣ Only fallback if NO schema exists at all
    const docs = await db.collection(name).find({}).limit(20).toArray();
    schemas[name] = extractFromDocuments(docs);
  }

  return schemas;
}
