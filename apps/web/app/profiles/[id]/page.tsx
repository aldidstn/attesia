import { explorer } from "@/lib/chain";
import { readProfile } from "@/lib/onchain";
export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; let profile: Awaited<ReturnType<typeof readProfile>> | null = null; try { profile = await readProfile(id as `0x${string}`); } catch {}
  if (!profile) return <div className="page narrow"><section className="panel form-panel"><span className="badge" data-tone="danger">Unavailable</span><h1>Profile could not be read</h1><p className="muted">Check the record ID or Monad Testnet RPC.</p></section></div>;
  return <div className="page narrow"><section className="panel form-panel"><span className="badge" data-tone="active">Onchain profile</span><h1 className="section-title">Contributor profile</h1><dl className="review-list composer-fields"><div><dt>Profile ID</dt><dd className="data">{id}</dd></div><div><dt>Owner</dt><dd><a className="data" href={explorer.address(profile.owner)}>{profile.owner}</a></dd></div><div><dt>Metadata URI</dt><dd>{profile.metadataURI}</dd></div><div><dt>Metadata digest</dt><dd>{profile.metadataDigest}</dd></div><div><dt>Chain</dt><dd>Monad Testnet · 10143</dd></div></dl><a className="pill pill-secondary" href={`/verify?type=profile&id=${id}`}>Verify metadata</a></section></div>;
}
