export function buildForExecute(nodes: any[], edges: any[]) {
  validateNoCycles(nodes, edges);

  const sorted = topologicalSort(nodes, edges);

  // INPUT VARIABLES (from Input node)
  const inputVars: string[] = [];
  const input: Record<string, any> = {};

  nodes.forEach((n) => {
    if (n.type === "input") {
      const vars = n.data?.fields?.variables || [];
      vars.forEach((v: any) => {
        inputVars.push(v.name);
        input[v.name] = v.default ?? "";
      });
    }
  });

  const steps: any[] = [];
  let counter = 1;

  // BUILD ACTUAL STEPS
  for (const node of sorted) {
    if (node.type === "input") continue;

    const raw = node.data?.fields || {};
    const transformed = transformTemplates(raw, inputVars);

    const step: any = {
      id: `step${counter++}`,
      type: node.type,
      pass: node.data?.pass,
      ...transformed,
    };

    // INPUT VALIDATION NODE SUPPORT
    if (node.type === "inputValidation") {
      step.rules = raw.rules || [];

      step.rules = step.rules.map((r: any) => ({
        ...r,
        field:
          typeof r.field === "string"
            ? transformTemplates(r.field, inputVars)
            : r.field,
      }));
    }
    if (node.type === "emailSend") {
      const f = node.data?.fields || {};
      steps.push({
        id: `step${counter++}`,
        type: "emailSend",
        to: transformTemplates(f.to, inputVars),
        subject: transformTemplates(f.subject, inputVars),
        body: transformTemplates(f.body, inputVars),
        output: f.outputVar || "emailResult",
        pass: node.data?.pass,
      });
      continue;
    }

    steps.push(step);
  }

  return { steps, input };
}

// ============================================
// HELPERS (all in one file)
// ============================================

function validateNoCycles(nodes: any[], edges: any[]) {
  const adj = new Map<string, string[]>();
  const indeg = new Map<string, number>();

  nodes.forEach((n) => {
    adj.set(n.id, []);
    indeg.set(n.id, 0);
  });

  edges.forEach((e) => {
    if (!adj.has(e.source) || !adj.has(e.target)) return;
    adj.get(e.source)!.push(e.target);
    indeg.set(e.target, (indeg.get(e.target) || 0) + 1);
  });

  const q: string[] = [];
  for (const [id, d] of indeg.entries()) {
    if (d === 0) q.push(id);
  }

  const visited: string[] = [];
  while (q.length) {
    const id = q.shift()!;
    visited.push(id);
    for (const nei of adj.get(id) || []) {
      indeg.set(nei, (indeg.get(nei) || 0) - 1);
      if (indeg.get(nei) === 0) q.push(nei);
    }
  }

  if (visited.length !== nodes.length) {
    throw new Error("Cycle detected in workflow graph");
  }
}

function topologicalSort(nodes: any[], edges: any[]) {
  const adj = new Map<string, string[]>();
  const indeg = new Map<string, number>();

  nodes.forEach((n) => {
    adj.set(n.id, []);
    indeg.set(n.id, 0);
  });

  edges.forEach((e) => {
    if (!adj.has(e.source) || !adj.has(e.target)) return;
    adj.get(e.source)!.push(e.target);
    indeg.set(e.target, (indeg.get(e.target) || 0) + 1);
  });

  const q: string[] = [];
  for (const [id, d] of indeg.entries()) {
    if (d === 0) q.push(id);
  }

  const orderedIds: string[] = [];
  while (q.length) {
    const id = q.shift()!;
    orderedIds.push(id);
    for (const nei of adj.get(id) || []) {
      indeg.set(nei, (indeg.get(nei) || 0) - 1);
      if (indeg.get(nei) === 0) q.push(nei);
    }
  }

  const idToNode = new Map(nodes.map((n) => [n.id, n]));
  return orderedIds.map((id) => idToNode.get(id)).filter(Boolean);
}

function transformTemplates(obj: any, inputVars: string[]): any {
  // Recursively transform {{ variable }} → input.variable or variable
  if (Array.isArray(obj)) {
    return obj.map((item) => transformTemplates(item, inputVars));
  }

  if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      result[key] = transformTemplates(obj[key], inputVars);
    }
    return result;
  }

  if (typeof obj === "string") {
    // Check if it's a template: {{ something }}
    const match = obj.match(/^{{\s*(.*?)\s*}}$/);
    if (match) {
      const varPath = match[1].trim(); // e.g., "name" or "foundAgain._id"
      const rootVar = varPath.split(".")[0]; // e.g., "name" or "foundAgain"

      // If root is an input variable, add "input." prefix
      if (inputVars.includes(rootVar)) {
        return `input.${varPath}`;
      }

      // Otherwise, return as-is (it's an output var from previous step)
      return varPath;
    }
  }

  return obj;
}
