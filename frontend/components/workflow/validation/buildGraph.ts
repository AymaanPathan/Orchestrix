/* eslint-disable @typescript-eslint/no-explicit-any */

import { findSchema } from "@/utils/findSchemaForCollection.utils";

export type NodeMeta = {
  id: string;
  type: string;
  parents: string[];
  children: string[];
  inboundEdges: any[];
  outboundEdges: any[];
  outputVars: string[];
  availableVars: {
    var: string;
    fromNode: string;
    fromLabel: string;
    display: string;
  }[];
  isBackend: boolean;
  isInput: boolean;
};

export type GraphMeta = {
  nodeMap: Map<string, any>;
  incomingMap: Map<string, string[]>;
  outgoingMap: Map<string, string[]>;
  inputNodeIds: string[];
  nodeIds: string[];
  staticShapes: Record<string, any>;
  runtimeShapes: Record<string, any>;

  meta: Record<string, NodeMeta>;
};

/* --------------------------------------------------------
   RESOLVE OUTPUT VARIABLES WITH NESTED FIELDS
-------------------------------------------------------- */
function resolveOutputVars(node: any, dbSchemas: Record<string, string[]>) {
  if (!node) return [];

  const fields = node.data?.fields || {};
  const outVar = fields.outputVar;

  // INPUT NODE: return all variable names
  if (node.type === "input") {
    return (fields.variables || []).map((v: any) => v.name);
  }

  // DB FIND: return base var + all nested schema fields
  if (node.type === "dbFind") {
    const schema = findSchema(fields.collection, dbSchemas);
    if (!schema || !outVar) return [outVar];

    return [outVar, ...schema.map((f) => `${outVar}.${f}`)];
  }

  // DB INSERT: return createdRecord + nested schema fields
  if (node.type === "dbInsert") {
    const outputVarName = outVar || "createdRecord";
    const schema = findSchema(fields.collection, dbSchemas);

    if (!schema) return [outputVarName];

    return [outputVarName, ...schema.map((f) => `${outputVarName}.${f}`)];
  }

  // DB UPDATE: return updatedRecord + nested schema fields
  if (node.type === "dbUpdate") {
    const outputVarName = outVar || "updatedRecord";
    const schema = findSchema(fields.collection, dbSchemas);

    if (!schema) return [outputVarName];

    return [outputVarName, ...schema.map((f) => `${outputVarName}.${f}`)];
  }

  // DB DELETE: return deletedRecord + nested schema fields
  if (node.type === "dbDelete") {
    const outputVarName = outVar || "deletedRecord";
    const schema = findSchema(fields.collection, dbSchemas);

    if (!schema) return [outputVarName];

    return [outputVarName, ...schema.map((f) => `${outputVarName}.${f}`)];
  }

  // EMAIL SEND: simple output
  if (node.type === "emailSend") {
    return [outVar || "emailResult"];
  }

  // INPUT VALIDATION: simple output
  if (node.type === "inputValidation") {
    const rules = node.data?.fields?.rules || [];

    const fields = rules
      .map((r: any) =>
        typeof r.field === "string" ? r.field.replace(/^{{|}}$/g, "") : null
      )
      .filter(Boolean);

    return [
      outVar || "validated",
      ...fields, // 🔥 name, email, etc
    ];
  }

  // USER LOGIN: return loginResult with nested fields
  if (node.type === "userLogin") {
    const outputVarName = outVar || "loginResult";
    return [
      outputVarName,
      `${outputVarName}.ok`,
      `${outputVarName}.userId`,
      `${outputVarName}.email`,
      `${outputVarName}.name`,
    ];
  }

  return [];
}

/* --------------------------------------------------------
   BUILD GRAPH META (WITH PROPER VARIABLE PASSING)
-------------------------------------------------------- */
export function buildGraphMeta(
  nodes: any[],
  edges: any[],
  dbSchemas: Record<string, string[]>,
  nodeConfigs?: any
): GraphMeta {
  const nodeMap = new Map<string, any>();
  const incomingMap = new Map<string, string[]>();
  const outgoingMap = new Map<string, string[]>();
  const inputNodeIds: string[] = [];
  const staticShapes: Record<string, any> = {};

  nodes.forEach((n) => {
    nodeMap.set(n.id, n);
    incomingMap.set(n.id, []);
    outgoingMap.set(n.id, []);
    if (n.type === "input") inputNodeIds.push(n.id);
  });

  edges.forEach((e) => {
    if (!nodeMap.has(e.source) || !nodeMap.has(e.target)) return;
    outgoingMap.get(e.source)!.push(e.target);
    incomingMap.get(e.target)!.push(e.source);
  });

  /* --------------------------------------------------------
    CREATE STATIC OUTPUT SHAPES FOR ALL NODES
  -------------------------------------------------------- */
  if (nodeConfigs) {
    nodes.forEach((node) => {
      const cfg = nodeConfigs[node.type];
      if (!cfg?.getOutputShape || !cfg?.outputVar) return;

      const outVar = node.data?.fields?.outputVar || cfg.outputVarDefault;

      const shape = cfg.getOutputShape(node.data?.fields || {});
      if (shape) {
        staticShapes[outVar] = shape;
      }
    });
  }

  /* --------------------------------------------------------
    BUILD META FOR EVERY NODE
  -------------------------------------------------------- */
  const meta: Record<string, NodeMeta> = {};

  nodes.forEach((node) => {
    const parents = incomingMap.get(node.id)!;

    const availableVars: any[] = [];

    parents.forEach((pId) => {
      const pNode = nodeMap.get(pId);
      const pOutputVars = resolveOutputVars(pNode, dbSchemas);
      const pass = pNode.data?.pass;

      // Skip auth middleware nodes
      if (pNode.type === "authMiddleware") return;

      if (!pass || pass === "full") {
        // FULL PASS: expose all variables including nested fields
        pOutputVars.forEach((v: string) => {
          availableVars.push({
            var: v,
            fromNode: pNode.id,
            fromLabel: pNode.data?.label || pNode.type,
            display: `${pNode.data?.label || pNode.type} → ${v}`,
          });
        });
      } else {
        // SPECIFIC PASS: user selected a specific variable

        // Add the specific selected variable
        availableVars.push({
          var: pass,
          fromNode: pNode.id,
          fromLabel: pNode.data?.label || pNode.type,
          display: `${pNode.data?.label || pNode.type} → ${pass}`,
        });

        // Extract the base variable name (e.g., "foundData" from "foundData.email")
        const baseVar = pass.split(".")[0];

        // If the pass is just the base variable (e.g., "foundData"),
        // also expose all its nested fields
        if (pass === baseVar) {
          pOutputVars
            .filter((v) => v.startsWith(baseVar + "."))
            .forEach((v) => {
              availableVars.push({
                var: v,
                fromNode: pNode.id,
                fromLabel: pNode.data?.label || pNode.type,
                display: `${pNode.data?.label || pNode.type} → ${v}`,
              });
            });
        }
      }
    });

    meta[node.id] = {
      id: node.id,
      type: node.type,
      parents,
      children: outgoingMap.get(node.id)!,
      inboundEdges: edges.filter((e) => e.target === node.id),
      outboundEdges: edges.filter((e) => e.source === node.id),
      outputVars: resolveOutputVars(node, dbSchemas),
      availableVars,
      isBackend: ["dbFind", "dbInsert", "dbUpdate", "dbDelete"].includes(
        node.type
      ),
      isInput: node.type === "input",
    };
  });

  return {
    nodeMap,
    incomingMap,
    outgoingMap,
    inputNodeIds,
    nodeIds: nodes.map((n) => n.id),
    staticShapes,
    runtimeShapes: {},
    meta,
  };
}
