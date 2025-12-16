export function topoSort(nodes: any[], edges: any[]) {
  // build adjacency + indegree
  const adj = new Map<string, string[]>();
  const indeg = new Map<string, number>();

  nodes.forEach((n) => {
    adj.set(n.id, []);
    indeg.set(n.id, 0);
  });

  edges.forEach((e) => {
    // guard: ensure nodes exist
    if (!adj.has(e.source) || !adj.has(e.target)) return;
    adj.get(e.source)!.push(e.target);
    indeg.set(e.target, (indeg.get(e.target) || 0) + 1);
  });

  // Kahn's algorithm
  const q: string[] = [];
  for (const [id, d] of indeg.entries()) if (d === 0) q.push(id);

  const orderedIds: string[] = [];
  while (q.length) {
    const id = q.shift()!;
    orderedIds.push(id);
    for (const nei of adj.get(id) || []) {
      indeg.set(nei, (indeg.get(nei) || 0) - 1);
      if (indeg.get(nei) === 0) q.push(nei);
    }
  }

  // if not all visited, there is a cycle
  if (orderedIds.length !== nodes.length) {
    throw new Error("Cycle detected in workflow graph");
  }

  // Map ids to node objects, but exclude input nodes from ordered steps
  const idToNode = new Map(nodes.map((n) => [n.id, n]));
  return orderedIds.map((id) => idToNode.get(id)).filter(Boolean);
}

export function getExecutionOrder(nodes: any[], edges: any[]) {
  // TopoSort already throws for cycles
  const sorted = topoSort(nodes, edges);

  // Filter out input nodes OR keep them (your choice)
  return sorted.filter((n) => n.type !== "input");
}
