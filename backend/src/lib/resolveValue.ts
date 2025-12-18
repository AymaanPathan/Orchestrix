export function resolveValue(vars: Record<string, any>, value: any): any {
  if (typeof value !== "string") return value;

  // input.name
  if (value in vars) return vars[value];

  // foundData.name
  if (value.includes(".")) {
    const [root, ...path] = value.split(".");
    let current = vars[root];
    for (const key of path) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current;
  }

  return value;
}

export function resolveObject(vars: any, value: any): any {
  // ✅ STRING → resolve variable path
  if (typeof value === "string") {
    if (value.startsWith("input.") || value.includes(".")) {
      return value.split(".").reduce((acc, key) => acc?.[key], vars);
    }
    return value;
  }

  // ✅ ARRAY
  if (Array.isArray(value)) {
    return value.map((v) => resolveObject(vars, v));
  }

  // ✅ OBJECT (but NOT string)
  if (value && typeof value === "object") {
    const out: any = {};
    for (const k in value) {
      out[k] = resolveObject(vars, value[k]);
    }
    return out;
  }

  return value;
}
