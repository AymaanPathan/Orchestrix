// workflow/validators/fullWorkflowValidator.ts
import { detectCycle, getInboundCount, getInputNodes } from "./base";

export function validateFullWorkflow(nodes: any[], edges: any[]) {
  // ❌ Must have ONE input node
  const inputNodes = getInputNodes(nodes);
  if (inputNodes.length === 0)
    return { ok: false, message: "Workflow must have one Input node." };
  if (inputNodes.length > 1)
    return { ok: false, message: "Multiple Input nodes not allowed." };

  // ❌ Cycle check
  if (detectCycle(nodes, edges)) {
    return { ok: false, message: "Workflow contains cycles." };
  }

  // ❌ Every node (except input) must have inbound
  for (const n of nodes) {
    if (n.type === "input") continue;
    const inbound = getInboundCount(n.id, edges);
    if (inbound === 0) {
      return { ok: false, message: `Node "${n.data.label}" has no input.` };
    }
  }

  return { ok: true };
}
