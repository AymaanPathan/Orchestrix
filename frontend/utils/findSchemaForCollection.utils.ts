export function findSchema(
  collection: string,
  schemas: Record<string, string[]>
) {
  if (!collection) return null;

  const key = collection.toLowerCase();

  // Exact match
  if (schemas[key]) return schemas[key];

  // Fuzzy match: singular/plural
  const match = Object.entries(schemas).find(
    ([k]) =>
      k.toLowerCase() === key ||
      k.toLowerCase() === key + "s" ||
      k.toLowerCase() + "s" === key
  );

  return match ? match[1] : null;
}
