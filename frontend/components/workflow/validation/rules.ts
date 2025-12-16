// workflow/validation/rules.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { GraphMeta } from "./buildGraph";

/**
 * RuleResult - returned by each validation rule
 */
export type RuleResult = {
  valid: boolean;
  message?: string;
  details?: any;
};

/**
 * 1) Exactly one input node allowed
 */
export function ruleSingleInputNode(meta: GraphMeta): RuleResult {
  const count = meta.inputNodeIds.length;
  if (count === 0) {
    return {
      valid: false,
      message: "No input node found. Add a single Input node.",
    };
  }
  if (count > 1) {
    return {
      valid: false,
      message: `Multiple input nodes found (${count}). Only one Input node is supported.`,
    };
  }
  return { valid: true };
}

/**
 * 2) Input node must have zero inbound edges
 */
export function ruleInputNoInbound(meta: GraphMeta): RuleResult {
  const inputId = meta.inputNodeIds[0];
  const incoming = meta.incomingMap.get(inputId) || [];
  if (incoming.length > 0) {
    return {
      valid: false,
      message: `Input node (${inputId}) must not have incoming connections.`,
    };
  }
  return { valid: true };
}

/**
 * 3) Every non-input node must have >= 1 inbound edge (unless allowed to be orphan)
 */
export function ruleNonInputHaveInbound(meta: GraphMeta): RuleResult {
  for (const nodeId of meta.nodeIds) {
    const node = meta.nodeMap.get(nodeId);
    if (!node) continue;
    if (node.type === "input") continue;
    const incoming = meta.incomingMap.get(nodeId) || [];
    if (incoming.length === 0) {
      return {
        valid: false,
        message: `Node '${node.data?.label || node.id}' (${
          node.type
        }) has no incoming edge.`,
      };
    }
  }
  return { valid: true };
}

/**
 * 4) No orphan nodes (all nodes must be reachable from the input)
 */
export function ruleNoOrphans(meta: GraphMeta): RuleResult {
  const start = meta.inputNodeIds[0];
  // BFS/DFS
  const visited = new Set<string>();
  const stack = [start];

  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const outs = meta.outgoingMap.get(id) || [];
    for (const t of outs) {
      if (!visited.has(t)) stack.push(t);
    }
  }

  // any node not visited is orphan
  const orphans: string[] = [];
  for (const id of meta.nodeIds) {
    if (!visited.has(id)) orphans.push(id);
  }

  if (orphans.length > 0) {
    return {
      valid: false,
      message: `Orphan/unreachable nodes detected: ${orphans.join(", ")}`,
      details: { orphans },
    };
  }
  return { valid: true };
}

/**
 * 5) No cycles allowed — Kahn's algorithm
 */
export function ruleNoCycles(meta: GraphMeta): RuleResult {
  // build indegree map
  const indeg = new Map<string, number>();
  for (const id of meta.nodeIds) indeg.set(id, 0);
  for (const [tId, sources] of meta.incomingMap.entries()) {
    indeg.set(tId, (indeg.get(tId) || 0) + sources.length);
  }

  // Kahn
  const q: string[] = [];
  for (const [id, d] of indeg.entries()) if (d === 0) q.push(id);

  const visitedOrder: string[] = [];
  while (q.length) {
    const id = q.shift()!;
    visitedOrder.push(id);
    const outs = meta.outgoingMap.get(id) || [];
    for (const to of outs) {
      indeg.set(to, (indeg.get(to) || 0) - 1);
      if (indeg.get(to) === 0) q.push(to);
    }
  }

  if (visitedOrder.length !== meta.nodeIds.length) {
    // nodes involved in cycle = nodes not visited
    const inCycle = meta.nodeIds.filter((id) => !visitedOrder.includes(id));
    return {
      valid: false,
      message: `Cycle detected. Nodes in cycle: ${inCycle.join(", ")}`,
      details: { inCycle },
    };
  }

  return { valid: true };
}

/**
 * 6) Allowed connection types (basic)
 * - target cannot be an input node
 * - prevent self-loop (node -> same node)
 */
export function ruleAllowedConnections(meta: GraphMeta): RuleResult {
  for (const [targetId, sources] of meta.incomingMap.entries()) {
    const targetNode = meta.nodeMap.get(targetId);
    if (!targetNode) continue;
    if (targetNode.type === "input" && sources.length > 0) {
      return {
        valid: false,
        message: `Input node (${targetId}) cannot be a target of connections.`,
      };
    }
    for (const src of sources) {
      if (src === targetId) {
        return {
          valid: false,
          message: `Self-loop detected on node ${targetId}.`,
        };
      }
    }
  }
  return { valid: true };
}
