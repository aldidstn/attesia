import Link from "next/link";
import { enrichedFeedProjection, filterFeedItems } from "@/lib/phase3-data";
import { categoryName } from "@/lib/reputation";

async function loadFeed() {
  try {
    return await enrichedFeedProjection(100);
  } catch { return null; }
}

export async function PublicFeed({ filters }: { filters: Record<string, string | undefined> }) {
  const loaded = await loadFeed(); if (!loaded) return <section id="feed" className="panel form-panel"><span className="badge" data-tone="pending">Feed syncing</span><h2>Indexer temporarily unavailable</h2><p>Publishing and direct onchain verification remain available.</p></section>;
  const projection = loaded; const visible = filterFeedItems(projection.items, filters, BigInt(projection.at));
  return <section id="feed" className="feed-section"><div className="section-heading"><div><p className="eyebrow">Public discovery</p><h2 className="section-title">Contribution feed</h2></div><span className="badge">Block {projection.checkpoint?.latestBlock ?? "syncing"}</span></div>
      <form className="panel feed-filters"><label><span>Type</span><input className="input" name="type" defaultValue={filters.type} placeholder="code, research…" /></label><label><span>Community</span><input className="input" name="community" defaultValue={filters.community} /></label><label><span>Skill</span><input className="input" name="skill" defaultValue={filters.skill} /></label><label><span>Status</span><select className="input" name="status" defaultValue={filters.status ?? ""}><option value="">All</option><option value="active">Attested</option><option value="unattested">Unattested</option><option value="disputed">Disputed</option></select></label><label><span>Creator</span><select className="input" name="actor" defaultValue={filters.actor ?? ""}><option value="">Human + agent</option><option value="human">Human</option><option value="agent">Agent</option></select></label><button className="pill pill-secondary">Filter</button></form>
      <div className="feed-list">{visible.length ? visible.map((item) => { const metadata = item.metadata ?? {}; const categories = [...new Set(item.attestations.map((claim) => categoryName(claim.claimType)).filter(Boolean))]; return <article className="panel feed-card" key={item.id}><div><div className="cluster"><span className="badge">{String(metadata.type ?? "contribution")}</span>{item.creator?.isAgent && <span className="badge" data-tone="active">Agent</span>}{item.mutualAttestationCluster && <span className="badge" data-tone="pending">Mutual cluster</span>}</div><h3>{String(metadata.title ?? `Contribution ${item.id.slice(0, 10)}`)}</h3><p>{String(metadata.summary ?? "Public evidence record on Monad Testnet.")}</p><div className="cluster">{categories.map((category) => <span className="badge" key={category}>{category}</span>)}</div></div><aside><strong className="signal-number data">{item.activeExternal}</strong><span>active external</span><span>{item.uniqueAttesters} reviewers</span><span>{Math.round(item.evidenceCoverage * 100)}% evidence</span><Link className="pill pill-primary" href={`/contributions/${item.id}`}>Inspect</Link></aside></article>; }) : <div className="panel empty-feed"><h3>No matching contributions</h3><p>Try fewer filters or publish the first matching record.</p></div>}</div>
      <p className="muted feed-note">Rank order: active verified outcomes, evidence coverage, attester diversity, then bounded freshness. Workspace relevance is neutral until Phase 4.</p>
    </section>;
}
