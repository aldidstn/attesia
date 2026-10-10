import { explorer } from "@/lib/chain";
import { readProfile } from "@/lib/onchain";
import Link from "next/link";
import { ReputationPanel } from "@/components/reputation-panel";
import { ProvenanceGraph } from "@/components/provenance-graph";
import { graphProjection, profileProjection } from "@/lib/phase3-data";
import { readPublicJson } from "@/lib/public-metadata";
export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; let profile: Awaited<ReturnType<typeof readProfile>> | null = null; try { profile = await readProfile(id as `0x${string}`); } catch {}
  if (!profile) return <div className="page narrow"><section className="panel form-panel"><span className="badge" data-tone="danger">Unavailable</span><h1>Profile could not be read</h1><p className="muted">Check the record ID or Monad Testnet RPC.</p></section></div>;
  const [metadata, projection] = await Promise.all([readPublicJson(profile.metadataURI, profile.metadataDigest), profileProjection(id).catch(() => null)]); const graph = projection ? await graphProjection(id, projection) : null;
  return <div className="page profile-page"><section className="panel profile-hero"><div><span className="badge" data-tone="active">{profile.isAgent ? "ERC-8004 agent" : "Onchain profile"}</span><h1 className="section-title">{String(metadata?.displayName ?? (profile.isAgent ? `Agent #${profile.agentId}` : "Contributor profile"))}</h1><p className="lede">{String(metadata?.bio ?? "Public contribution identity on Monad Testnet.")}</p></div><div className="cluster"><Link className="pill pill-secondary" href={`/verify?type=profile&id=${id}`}>Verify metadata</Link>{profile.isAgent && <Link className="pill pill-primary" href={`/agents/${profile.agentId}`}>Inspect agent</Link>}</div></section>
  {!metadata && <p className="panel form-panel" role="status">Metadata unavailable or digest mismatch. Profile text is withheld until integrity can be verified.</p>}
  <section className="panel form-panel"><dl className="review-list"><div><dt>Profile ID</dt><dd className="data">{id}</dd></div><div><dt>Owner</dt><dd><a className="data" href={explorer.address(profile.owner)}>{profile.owner}</a></dd></div><div><dt>Metadata digest</dt><dd>{profile.metadataDigest}</dd></div><div><dt>Chain</dt><dd>Monad Testnet · 10143</dd></div></dl></section>
  {projection ? <><ReputationPanel reputation={projection.reputation} sourceBlock={projection.checkpoint?.latestBlock} />{graph && <ProvenanceGraph nodes={graph.nodes} edges={graph.edges} />}</> : <section className="panel form-panel"><span className="badge" data-tone="pending">Indexer unavailable</span><p>Onchain identity remains readable. Reputation and graph return when the Envio projection catches up.</p></section>}</div>;
}
