export function resolveTemplate(str: string, vars: any): any {
  if (typeof str !== "string") return str;

  return str.replace(/{{\s*(.*?)\s*}}/g, (_, key) => {
    key = key.trim();

    // --- 1. Direct match: {{email}} -> vars.email ---
    if (vars[key] !== undefined) return vars[key];

    // --- 2. Input fallback: {{email}} -> vars["input.email"] ---
    if (vars[`input.${key}`] !== undefined) return vars[`input.${key}`];

    // --- 3. Nested lookup: {{foundUser.email}} ---
    const parts = key.split(".");
    let cur = vars;
    for (const p of parts) {
      if (cur == null) return "";
      cur = cur[p];
    }
    return cur ?? "";
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
