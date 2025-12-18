export function resolveTemplate(template: any, vars: Record<string, any>) {
  if (typeof template !== "string") return template;

  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, expr) => {
    const path = expr.trim().split(".");
    let value: any = vars;

    for (const key of path) {
      if (value == null) return "";

      // 🔥 FIX: unwrap mongoose documents DURING traversal
      if (value && typeof value === "object" && "_doc" in value) {
        value = value._doc;
      }

      value = value[key];
    }

    return value ?? "";
  });
}

export function resolveObjectTemplates(obj: any, vars: any): any {
  if (!obj) return obj;

  if (typeof obj === "string") return resolveTemplate(obj, vars);

  if (Array.isArray(obj)) {
    return obj.map((x) => resolveObjectTemplates(x, vars));
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = resolveObjectTemplates(obj[key], vars);
    }
    return result;
  }

  return obj;
}
