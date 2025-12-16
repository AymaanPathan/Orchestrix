// workflow/validators/base.ts
/* Generic reusable graph helpers */

export function buildAdjList(nodes: any[], edges: any[]) {
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

  return { adj, indeg };
}

export function detectCycle(nodes: any[], edges: any[]) {
  const { adj, indeg } = buildAdjList(nodes, edges);

  const q: string[] = [];
  indeg.forEach((v, k) => {
    if (v === 0) q.push(k);
  });

  const visited: string[] = [];
  while (q.length) {
    const id = q.shift()!;
    visited.push(id);

    adj.get(id)!.forEach((next) => {
      indeg.set(next, indeg.get(next)! - 1);
      if (indeg.get(next) === 0) q.push(next);
    });
  }

  return visited.length !== nodes.length; // true = cycle exists
}

export function getInboundCount(nodeId: string, edges: any[]) {
  return edges.filter((e) => e.target === nodeId).length;
}

export function getOutboundCount(nodeId: string, edges: any[]) {
  return edges.filter((e) => e.source === nodeId).length;
}

export function getInputNodes(nodes: any[]) {
  return nodes.filter((n) => n.type === "input");
}

export function findNode(nodes: any[], id: string) {
  return nodes.find((n) => n.id === id);
}
