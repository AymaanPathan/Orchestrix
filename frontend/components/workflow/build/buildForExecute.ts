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
  // COLLECT ALL OUTPUT VARIABLES FROM ALL NODES
  // --------------------------------------------------
  const allOutputVars: string[] = [];

  nodes.forEach((n) => {
    const fields = n.data?.fields || {};

    // Collect output variables from each node type
    if (n.type === "dbInsert" && fields.outputVar) {
      allOutputVars.push(fields.outputVar);
    } else if (n.type === "dbFind" && fields.outputVar) {
      allOutputVars.push(fields.outputVar);
    } else if (n.type === "dbUpdate" && fields.outputVar) {
      allOutputVars.push(fields.outputVar);
    } else if (n.type === "dbDelete" && fields.outputVar) {
      allOutputVars.push(fields.outputVar);
    } else if (n.type === "emailSend" && fields.outputVar) {
      allOutputVars.push(fields.outputVar);
    } else if (n.type === "inputValidation" && fields.outputVar) {
      allOutputVars.push(fields.outputVar);
    } else if (n.type === "userLogin" && fields.outputVar) {
      allOutputVars.push(fields.outputVar);
    }
  });

  // --------------------------------------------------
  // BUILD STEPS
  // --------------------------------------------------
  const steps: any[] = [];
  let counter = 1;

  for (const node of sorted) {
    const raw = node.data?.fields || {};
    const transformed = transformTemplates(raw, inputVars, allOutputVars);

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
        rules: transformed.rules || [],
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

      continue;
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

/**
 * Transform template variables in strings
 * Handles:
 * 1. Full templates: "{{email}}" -> "input.email"
 * 2. Partial templates: "hello {{email}}" -> "hello {{input.email}}"
 * 3. Output variables: "{{createdRecord}}" -> "created" (maps to actual output var)
 * 4. Nested paths: "{{createdRecord.email}}" -> "created.email"
 */
function transformTemplates(
  obj: any,
  inputVars: string[],
  outputVars: string[]
): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => transformTemplates(v, inputVars, outputVars));
  }

  if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      result[key] = transformTemplates(obj[key], inputVars, outputVars);
    }
    return result;
  }

  if (typeof obj === "string") {
    // Check if it's a FULL template expression (entire string is {{var}})
    const fullMatch = obj.match(/^{{\s*([^}]+)\s*}}$/);
    if (fullMatch) {
      const varPath = fullMatch[1].trim();
      return resolveVariablePath(varPath, inputVars, outputVars);
    }

    // Handle PARTIAL templates (e.g., "hello {{email}} world")
    const transformed = obj.replace(/{{\s*([^}]+)\s*}}/g, (match, varPath) => {
      const resolved = resolveVariablePath(
        varPath.trim(),
        inputVars,
        outputVars
      );
      return `{{${resolved}}}`;
    });

    return transformed;
  }

  return obj;
}

/**
 * Resolves a variable path to its actual runtime path
 * Examples:
 * - "email" (input var) -> "input.email"
 * - "createdRecord.email" -> "created.email" (if createdRecord is output var)
 * - "foundData.name" -> "foundData.name" (direct path)
 */
function resolveVariablePath(
  varPath: string,
  inputVars: string[],
  outputVars: string[]
): string {
  const parts = varPath.split(".");
  const root = parts[0];

  // Check if it's an input variable
  if (inputVars.includes(root)) {
    return `input.${varPath}`;
  }

  // Check if root matches an output variable (like "createdRecord", "foundData")
  // These are UI-facing names that may differ from backend variable names
  if (outputVars.includes(root)) {
    // Map common UI output vars to backend vars
    const outputVarMap: Record<string, string> = {
      createdRecord: "created",
      updatedRecord: "updated",
      deletedRecord: "deleted",
      foundData: "foundData",
      emailResult: "emailResult",
      validated: "validated",
      loginResult: "loginResult",
    };

    const backendVar = outputVarMap[root] || root;

    // If there are nested properties, append them
    if (parts.length > 1) {
      return `${backendVar}.${parts.slice(1).join(".")}`;
    }

    return backendVar;
  }

  // Return as-is if no transformation needed
  return varPath;
}
