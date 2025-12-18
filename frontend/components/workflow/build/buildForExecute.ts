export function buildForExecute(nodes: any[], edges: any[]) {
  validateNoCycles(nodes, edges);

  const sorted = topologicalSort(nodes, edges);

  // --------------------------------------------------
  // INPUT VARIABLES (from Input node)
  // --------------------------------------------------
  const inputVars: string[] = [];
  const input: Record<string, any> = {};

  nodes.forEach((n) => {
    if (n.type === "input") {
      const vars = n.data?.fields?.variables || [];
      vars.forEach((v: any) => {
        if (!v?.name) return;
        inputVars.push(v.name);
        input[v.name] = v.default ?? "";
      });
    }
  });

  // --------------------------------------------------
  // BUILD STEPS
  // --------------------------------------------------
  const steps: any[] = [];
  let counter = 1;

  for (const node of sorted) {
    const raw = node.data?.fields || {};
    const transformed = transformTemplates(raw, inputVars);

    const stepId = `step${counter++}`;

    // --------------------------------------------------
    // INPUT NODE
    // --------------------------------------------------
    if (node.type === "input") {
      steps.push({
        id: stepId,
        type: "input",
        data: {
          variables: raw.variables || [],
        },
        pass: node.data?.pass,
      });
      continue;
    }

    // --------------------------------------------------
    // INPUT VALIDATION
    // --------------------------------------------------
    if (node.type === "inputValidation") {
      steps.push({
        id: stepId,
        type: "inputValidation",
        rules: (raw.rules || []).map((r: any) => ({
          ...r,
          field:
            typeof r.field === "string"
              ? r.field.replace(/^{{\s*|\s*}}$/g, "").startsWith("input.")
                ? r.field.replace(/^{{\s*|\s*}}$/g, "")
                : `input.${r.field.replace(/^{{\s*|\s*}}$/g, "")}`
              : r.field,
        })),
        output: raw.outputVar || "validated",
        pass: node.data?.pass,
      });
      continue;
    }

    // --------------------------------------------------
    // EMAIL SEND
    // --------------------------------------------------
    if (node.type === "emailSend") {
      if (!raw.to || !raw.subject || !raw.body) {
        console.warn("Skipping emailSend step due to missing fields");
        continue;
      }

      steps.push({
        id: stepId,
        type: "emailSend",
        to: transformed.to,
        subject: transformed.subject,
        body: transformed.body,
        output: raw.outputVar || "emailResult",
        pass: node.data?.pass,
      });

      continue;
    }

    // --------------------------------------------------
    // DB INSERT
    // --------------------------------------------------
    if (node.type === "dbInsert") {
      const { collection, output, ...rest } = transformed;

      steps.push({
        id: stepId,
        type: "dbInsert",
        collection,
        data: rest,
        output: output || "created",
        pass: node.data?.pass,
      });

      continue;
    }

    // --------------------------------------------------
    // DB UPDATE
    // --------------------------------------------------
    if (node.type === "dbUpdate") {
      steps.push({
        id: stepId,
        type: "dbUpdate",
        collection: transformed.collection,
        filter: transformed.filter || {},
        data: transformed.data || {},
        output: transformed.output || "updated",
        pass: node.data?.pass,
      });
      continue;
    }

    // --------------------------------------------------
    // DB FIND
    // --------------------------------------------------
    if (node.type === "dbFind") {
      steps.push({
        id: stepId,
        type: "dbFind",
        collection: transformed.collection,
        filters: transformed.filters || {},
        findType: transformed.findType || "findOne",
        output: raw.outputVar || "foundData",
        pass: node.data?.pass,
      });

      continue; // 🚨 REQUIRED
    }
  }

  console.log("🧠 STEPS SENT TO ENGINE:", steps);

  return {
    steps,
    vars: {
      input,
    },
  };
}

/* =========================================================
   HELPERS
========================================================= */

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
  if (Array.isArray(obj)) {
    return obj.map((v) => transformTemplates(v, inputVars));
  }

  if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      result[key] = transformTemplates(obj[key], inputVars);
    }
    return result;
  }

  if (typeof obj === "string") {
    // ⚠️ ONLY transform FULL {{var}} expressions
    const full = obj.match(/^{{\s*([^}]+)\s*}}$/);
    if (!full) return obj;

    const varPath = full[1].trim();
    const root = varPath.split(".")[0];

    if (inputVars.includes(root)) {
      return `input.${varPath}`;
    }

    return varPath;
  }

  return obj;
}
