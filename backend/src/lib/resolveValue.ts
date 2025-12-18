export function resolveValue(vars: Record<string, any>, value: any): any {
  if (typeof value !== "string") return value;

  const [root, ...path] = value.split(".");

  if (root in vars && path.length > 0) {
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
  // STRING
  if (typeof value === "string") {
    // Only resolve if first segment exists in vars
    const [root, ...path] = value.split(".");

    if (root in vars && path.length > 0) {
      let current = vars[root];
      for (const key of path) {
        if (current == null) return undefined;
        current = current[key];
      }
      return current;
    }

    return value; // literal string
  }

  // ARRAY
  if (Array.isArray(value)) {
    return value.map((v) => resolveObject(vars, v));
  }

  // OBJECT
  if (value && typeof value === "object") {
    const out: any = {};
    for (const k in value) {
      out[k] = resolveObject(vars, value[k]);
    }
    return out;
  }

  return value;
}
