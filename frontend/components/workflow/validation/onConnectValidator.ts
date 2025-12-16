import { detectCycle, findNode, getInboundCount } from "./base";

export function validateOnConnect(newEdge: any, nodes: any[], edges: any[]) {
  const source = findNode(nodes, newEdge.source);
  const target = findNode(nodes, newEdge.target);

  if (!source || !target) {
    return { ok: false, message: "Invalid nodes." };
  }

  // ❌ cannot connect INTO input
  if (target.type === "input") {
    return { ok: false, message: "Cannot connect INTO an Input node." };
  }

  // ❌ self-loop
  if (source.id === target.id) {
    return { ok: false, message: "Node cannot connect to itself." };
  }

  // ❌ cycle check
  const hypotheticalEdges = [...edges, newEdge];
  if (detectCycle(nodes, hypotheticalEdges)) {
    return { ok: false, message: "Connection creates a cycle." };
  }

  // ❗ Only 1 inbound for log node
  if (target.type === "log") {
    const inbound = getInboundCount(target.id, edges);
    if (inbound >= 1) {
      return { ok: false, message: "Log node accepts only one input." };
    }
  }

  // ✔ ALLOWED CASES
  return { ok: true, message: "" };
}
