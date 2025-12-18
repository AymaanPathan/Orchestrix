/**
 * Resolve a single variable path like "input.email" or "result.name"
 */
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

/**
 * Resolve template variables in strings, arrays, and objects
 * Handles:
 * 1. Full dot notation: "input.email" -> actual value
 * 2. Template expressions: "{{input.email}}" -> actual value
 * 3. Partial templates: "Hello {{input.name}}" -> "Hello John"
 * 4. Multiple templates: "Hi {{input.name}}, your order {{order.id}}" -> "Hi John, your order 123"
 */
export function resolveObject(vars: any, value: any): any {
  // STRING
  if (typeof value === "string") {
    // ✅ CASE 1: Check if string contains {{}} template expressions
    if (value.includes("{{")) {
      // Replace all {{variable.path}} with actual values
      return value.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
        const trimmedPath = varPath.trim();
        const resolved = resolvePath(vars, trimmedPath);

        // If resolution failed, return the original template
        return resolved !== undefined ? String(resolved) : match;
      });
    }

    // ✅ CASE 2: Handle direct dot notation (backward compatibility)
    // This handles cases like "input.email" (without {{}})
    const resolved = resolvePath(vars, value);

    // Only return resolved value if it's not undefined
    // This preserves literal strings that aren't variable paths
    if (resolved !== undefined) {
      return resolved;
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

/**
 * Helper function to resolve a variable path
 * Examples:
 * - "input.email" with vars.input.email = "test@example.com" -> "test@example.com"
 * - "result.name" with vars.result.name = "John" -> "John"
 * - "user.profile.age" with vars.user.profile.age = 25 -> 25
 */
function resolvePath(vars: Record<string, any>, path: string): any {
  const parts = path.split(".");
  const [root, ...restPath] = parts;

  // Check if root exists in vars
  if (!(root in vars)) {
    return undefined;
  }

  // If no path after root, return the root value
  if (restPath.length === 0) {
    return vars[root];
  }

  // Navigate the path
  let current = vars[root];
  for (const key of restPath) {
    if (current == null) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}
