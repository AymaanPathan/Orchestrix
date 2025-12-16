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
   CLEAN OUTPUT VARIABLE RESOLVER (no duplicates)
-------------------------------------------------------- */
function resolveOutputVars(node: any, dbSchemas: Record<string, string[]>) {
  if (!node) return [];

  const fields = node.data?.fields || {};
  const outVar = fields.outputVar;

  if (node.type === "input") {
    return (fields.variables || []).map((v: any) => v.name);
  }

  if (node.type === "dbFind") {
    const schema = findSchema(fields.collection, dbSchemas);
    if (!schema) return [outVar];

    return [outVar, ...schema.map((f) => `${outVar}.${f}`)];
  }

  if (node.type === "dbInsert") return ["createdRecord"];
  if (node.type === "dbUpdate") return ["updatedRecord"];
  if (node.type === "dbDelete") return ["deletedRecord"];

  return [];
}

/* --------------------------------------------------------
   BUILD GRAPH META (WITH STATIC SHAPES)
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
  const staticShapes: Record<string, any> = {}; // ⭐ REQUIRED FIX ⭐

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
    ⭐ CREATE STATIC OUTPUT SHAPES FOR ALL NODES
  -------------------------------------------------------- */
  if (nodeConfigs) {
    nodes.forEach((node) => {
      const cfg = nodeConfigs[node.type];
      if (!cfg?.getOutputShape || !cfg?.outputVar) return;

      const outVar = node.data?.fields?.outputVar || cfg.outputVarDefault;

      const shape = cfg.getOutputShape(node.data?.fields || {});
      if (shape) {
        staticShapes[outVar] = shape; // ⭐ store shape
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

      if (pNode.type === "authMiddleware") return; // skip passing

      if (!pass || pass === "full") {
        // full object → pass all vars + all subfields
        pOutputVars.forEach((v: string) =>
          availableVars.push({
            var: v,
            fromNode: pNode.id,
            fromLabel: pNode.data?.label || pNode.type,
            display: `${pNode.data?.label || pNode.type} → ${v}`,
          })
        );
      } else {
        // pass specific selected var
        availableVars.push({
          var: pass,
          fromNode: pNode.id,
          fromLabel: pNode.data?.label || pNode.type,
          display: `${pNode.data?.label || pNode.type} → ${pass}`,
        });

        // ⭐ IMPORTANT FIX:
        // Even if pass = foundData.email, we still want to expose all subfields
        const base = pass.split(".")[0]; // example → "foundData"
        const pNodeFullVars = resolveOutputVars(pNode, dbSchemas);

        pNodeFullVars
          .filter((v) => v.startsWith(base + ".")) // only sub-fields
          .forEach((v) =>
            availableVars.push({
              var: v,
              fromNode: pNode.id,
              fromLabel: pNode.data?.label || pNode.type,
              display: `${pNode.data?.label || pNode.type} → ${v}`,
            })
          );
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
    staticShapes, // ⭐ FIXED
    runtimeShapes: {},
    meta,
  };
}
