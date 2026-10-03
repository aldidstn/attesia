"use client";
import { useState } from "react";

type Node = { id: string; kind: string; label: string }; type Edge = { source: string; target: string; relationship: "claimed" | "attested"; lifecycle?: string };
export function ProvenanceGraph({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const [expanded, setExpanded] = useState(false); const visible = nodes.slice(0, expanded ? 100 : 18); const ids = new Set(visible.map((node) => node.id)); const shownEdges = edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
  const position = new Map(visible.map((node, index) => [node.id, { x: 70 + index % 6 * 130, y: 55 + Math.floor(index / 6) * 100 }]));
  return <section className="panel graph-panel" aria-labelledby="graph-title"><div className="section-heading"><div><p className="eyebrow">Claimed + attested</p><h2 id="graph-title" className="section-title">Provenance graph</h2></div>{nodes.length > 18 && <button className="pill pill-quiet" onClick={() => setExpanded(!expanded)}>{expanded ? "Show cluster" : `Expand ${Math.min(nodes.length, 100)} nodes`}</button>}</div>
    <div className="graph-scroll" tabIndex={0} role="group" aria-label="Provenance relationships"><svg viewBox={`0 0 850 ${Math.max(230, Math.ceil(visible.length / 6) * 100 + 40)}`} aria-hidden="true">{shownEdges.map((edge, index) => { const from = position.get(edge.source)!; const to = position.get(edge.target)!; return <line key={`${edge.source}-${edge.target}-${index}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={`${edge.relationship} ${edge.lifecycle ?? ""}`} />; })}{visible.map((node) => { const p = position.get(node.id)!; return <g key={node.id} transform={`translate(${p.x} ${p.y})`}><circle r="25" className={node.kind} /><text y="42" textAnchor="middle">{node.label}</text></g>; })}</svg></div>
    <ul className="graph-key"><li><span className="claimed-key" /> Claimed relationship</li><li><span className="attested-key" /> Attested relationship</li><li><span className="revoked-key" /> Historical lifecycle</li></ul>
    <details className="node-list"><summary>Accessible relationship list</summary><ul>{shownEdges.map((edge, index) => <li key={index}><b>{edge.relationship}</b>: {edge.source.slice(0, 12)} → {edge.target.slice(0, 12)} {edge.lifecycle && `(${edge.lifecycle})`}</li>)}</ul></details>
  </section>;
}
