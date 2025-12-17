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

export function resolveObject(
  vars: Record<string, any>,
  obj: Record<string, any>
) {
  const out: any = {};
  for (const k in obj) {
    out[k] = resolveValue(vars, obj[k]);
  }
  return out;
}
