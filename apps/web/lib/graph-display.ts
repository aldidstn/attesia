export type GraphNode = { id: string; kind: string; label: string };
export type GraphEdge = { source: string; target: string; relationship: "claimed" | "attested"; lifecycle?: string; count?: number };

export function clusterGraph(nodes: GraphNode[], edges: GraphEdge[]) {
  const kinds = new Map(nodes.map(node => [node.id, node.kind]));
  const counts = new Map<string, number>();
  for (const node of nodes) counts.set(node.kind, (counts.get(node.kind) ?? 0) + 1);
  const grouped = new Map<string, GraphEdge>();
  for (const edge of edges) {
    const source = kinds.get(edge.source), target = kinds.get(edge.target);
    if (!source || !target) continue;
    const key = JSON.stringify([source, target, edge.relationship, edge.lifecycle]);
    const old = grouped.get(key);
    grouped.set(key, { ...edge, source, target, count: (old?.count ?? 0) + 1 });
  }
  return { nodes: [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([kind, count]) => ({ id: kind, kind, label: `${kind} (${count})` })), edges: [...grouped.values()] };
}
