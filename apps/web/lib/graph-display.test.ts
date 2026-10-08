import { expect, it } from "vitest";
import { clusterGraph } from "./graph-display";
it("clusters 150 nodes while preserving relationship and lifecycle distinctions", () => {
  const nodes = Array.from({ length: 150 }, (_, i) => ({ id: String(i), kind: i < 100 ? "contribution" : "attester", label: String(i) }));
  const edges = [
    { source: "100", target: "0", relationship: "attested" as const, lifecycle: "active" },
    { source: "101", target: "1", relationship: "attested" as const, lifecycle: "active" },
    { source: "102", target: "2", relationship: "attested" as const, lifecycle: "revoked" },
    { source: "0", target: "1", relationship: "claimed" as const },
  ];
  const result = clusterGraph(nodes, edges);
  expect(result.nodes).toHaveLength(2);
  expect(result.nodes.map(n => n.label)).toEqual(["attester (50)", "contribution (100)"]);
  expect(result.edges).toHaveLength(3);
  expect(result.edges.find(e => e.lifecycle === "active")?.count).toBe(2);
  expect(result.edges.find(e => e.lifecycle === "revoked")?.count).toBe(1);
  expect(clusterGraph([...nodes].reverse(), edges)).toEqual(result);
});

it("exposes large-graph controls and lifecycle counts in accessible HTML", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { ProvenanceGraph } = await import("../components/provenance-graph");
  const nodes = Array.from({ length: 150 }, (_, i) => ({ id: String(i), kind: i < 100 ? "contribution" : "attester", label: String(i) }));
  const html = renderToStaticMarkup(createElement(ProvenanceGraph, { nodes, edges: [{ source: "100", target: "0", relationship: "attested", lifecycle: "revoked" }] }));
  expect(html).toContain("Explore 150 nodes");
  expect(html).toContain("Grouped 150 nodes");
  expect(html).toContain("Accessible relationship list");
  expect(html).toContain("revoked");
  expect(html).toContain('tabindex="0"');
});
