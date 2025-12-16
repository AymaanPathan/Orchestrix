/* eslint-disable @typescript-eslint/no-explicit-any */

import { NodeDefinitions } from "../nodes/NodeDefinitions";
export function buildForSave(nodes, edges) {
  const steps = [];

  for (const n of nodes) {
    const def = NodeDefinitions[n.type];
    if (!def) continue;

    const step = def.toStep(n, n.id);

    // Keep pass flag
    if (n.data?.pass !== undefined) {
      step.pass = n.data.pass;
    }

    steps.push(step);
  }

  return {
    workflowId: "workflow_" + Date.now(),
    ownerId: "user_" + Date.now(),
    steps,
  };
}
