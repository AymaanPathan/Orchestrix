/* eslint-disable @typescript-eslint/no-explicit-any */

import { validateOnConnect } from "../validation/onConnectValidator";
import { NodeDefinitions } from "./NodeDefinitions";

export function autoMapNode(node: any, connectedInputs: any[], dbSchemas: any) {
  const def = NodeDefinitions[node.type];
  if (!def?.autoMap) return node;

  return {
    ...node,
    data: {
      ...node.data,
      fields: def.autoMap({ node, connectedInputs, dbSchemas }),
    },
  };
}

export function handleOnConnect(
  newEdge: any,
  rfInstance: any,
  nodes: any[],
  edges: any[],
  dbSchemas: any
) {
  if (!rfInstance) return { nodes, edges };

  // --- NEW VALIDATION ---
  const validation = validateOnConnect(newEdge, nodes, edges);
  if (!validation.ok) {
    alert("❌ " + validation.message);
    return { nodes, edges }; // do NOT add edge
  }

  // Safe to add edge now
  const updatedEdges = [...edges, newEdge];

  const liveNodes = rfInstance.getNodes();
  const source = liveNodes.find((n) => n.id === newEdge.source);
  const target = liveNodes.find((n) => n.id === newEdge.target);

  const dbNode = [source, target].find((n: any) =>
    ["dbInsert", "dbFind", "dbUpdate", "dbDelete"].includes(n?.type)
  );

  if (!dbNode) return { nodes, edges: updatedEdges };

  // Auto-map to templates
  const connectedInputs = updatedEdges
    .filter((e) => e.target === dbNode.id)
    .map((e) => liveNodes.find((n) => n.id === e.source))
    .filter((n) => n?.type === "input");

  const updatedNode = autoMapNode(dbNode, connectedInputs, dbSchemas);

  const updatedNodes = nodes.map((n) => (n.id === dbNode.id ? updatedNode : n));

  return { nodes: updatedNodes, edges: updatedEdges };
}
