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
    // Check if string contains {{}} template expressions
    if (value.includes("{{")) {
      // Replace all {{variable.path}} with actual values
      return value.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
        const trimmedPath = varPath.trim();
        const [root, ...pathParts] = trimmedPath.split(".");

        // Check if root exists in vars
        if (root in vars) {
          let current = vars[root];

          // Navigate the path
          for (const key of pathParts) {
            if (current == null) {
              // If path doesn't exist, return the original template
              return match;
            }
            current = current[key];
          }

          // Return the resolved value or the original if undefined
          return current !== undefined ? current : match;
        }

        // If root doesn't exist in vars, return original template
        return match;
      });
    }

    // Handle direct dot notation (backward compatibility)
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
