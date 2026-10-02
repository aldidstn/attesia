"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { categories, type CategorySignal } from "@/lib/reputation";

export function ReputationPanel({ reputation, sourceBlock }: { reputation: { algorithmVersion: string; computedAt: string; categories: Record<(typeof categories)[number], CategorySignal> }; sourceBlock?: string | null }) {
  const [opened, setOpened] = useState(false);
  return <section className="stack" aria-labelledby="reputation-title">
    <div className="section-heading"><div><p className="eyebrow">Transparent signals</p><h2 id="reputation-title" className="section-title">Reputation by outcome</h2></div><span className="badge">{reputation.algorithmVersion}</span></div>
    <div className="reputation-grid">{categories.map((name) => { const signal = reputation.categories[name]; return <article className="panel reputation-card" key={name}><p className="eyebrow">{name}</p><strong className="signal-number data">{signal.activeExternal}</strong><span className="muted">active external claims</span><dl className="signal-list"><div><dt>Reviewers</dt><dd>{signal.uniqueAttesters}</dd></div><div><dt>Evidence</dt><dd>{Math.round(signal.evidenceCoverage * 100)}%</dd></div><div><dt>Disputed</dt><dd>{signal.disputed}</dd></div><div><dt>Self</dt><dd>{signal.self}</dd></div></dl></article>; })}</div>
    <details className="panel explanation" onToggle={(event) => { if (event.currentTarget.open && !opened) { setOpened(true); track("score_explanation_opened", { algorithmVersion: reputation.algorithmVersion }); } }}><summary>How these signals work</summary><p>Every active external claim counts once in its category. Self-claims remain visible with zero external weight. Active disputed claims still count and appear as a separate subset. Revoked, superseded, and expired claims remain historical but leave active counts.</p><p className="muted">Evidence coverage is the share of active external claims with a public evidence URI and digest. Source block: <span className="data">{sourceBlock ?? "unavailable"}</span>.</p></details>
  </section>;
}
