import { buildForExecute } from "./buildForExecute";

export function buildForSave(nodes: any[], edges: any[]) {
  // 🔥 Build EXACT runtime steps
  const { steps } = buildForExecute(nodes, edges);

  return {
    workflowId: "workflow_" + Date.now(),
    ownerId: "user_" + Date.now(),
    steps, // ✅ runtime-compatible steps
  };
}
