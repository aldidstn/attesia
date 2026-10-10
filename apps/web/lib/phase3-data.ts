import { indexerCheckpoint, indexerQuery } from "./indexer";
import { REPUTATION_VERSION, buildReputation, rankFeed, type ReputationClaim } from "./reputation";
import { readPublicJson } from "./public-metadata";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { disputes } from "@/db/schema";

export type IndexedAttestation = {
  id: string; issuer: string; claimType: string; result: number; evidenceDigest: string; evidenceURI: string;
  issuedAt: string; validUntil: string; supersededBy?: string | null; revokedAt?: string | null;
  selfAtIssuance: boolean; disputed: boolean;
};
export type IndexedContribution = {
  id: string; creatorProfileId: string; artifactDigest: string; metadataDigest: string; metadataURI: string;
  parentId?: string | null; registeredBy: string; createdAt: string; archivedAt?: string | null;
  attestations: IndexedAttestation[];
};

const asClaim = (claim: IndexedAttestation, contributionId: string): ReputationClaim => ({
  ...claim, contributionId, issuedAt: BigInt(claim.issuedAt), validUntil: BigInt(claim.validUntil),
  revokedAt: claim.revokedAt ? BigInt(claim.revokedAt) : null,
});

async function openDisputeIds(contributionIds: string[]) {
  if (!process.env.DATABASE_URL && !process.env.storage_DATABASE_URL || !contributionIds.length) return new Set<string>();
  const rows = await db().select({ attestationId: disputes.attestationId }).from(disputes).where(and(inArray(disputes.contributionId, contributionIds), eq(disputes.resolved, false))).catch(() => []);
  return new Set(rows.flatMap((row) => row.attestationId ? [row.attestationId] : []));
}

export async function profileProjection(profileId: string) {
  const [data, checkpoint] = await Promise.all([
    indexerQuery<{ Contribution: IndexedContribution[] }>(`query($id:String!){Contribution(where:{creatorProfileId:{_eq:$id}},limit:250,order_by:{createdAt:desc}){id creatorProfileId artifactDigest metadataDigest metadataURI parentId registeredBy createdAt archivedAt attestations{ id issuer claimType result evidenceDigest evidenceURI issuedAt validUntil supersededBy revokedAt selfAtIssuance disputed }}}`, { id: profileId }),
    indexerCheckpoint(),
  ]);
  if (!checkpoint) throw new Error("Indexed chain checkpoint unavailable");
  const now = BigInt(checkpoint.latestTimestamp); const disputedIds = await openDisputeIds(data.Contribution.map((item) => item.id));
  const contributions = data.Contribution.map((item) => ({ ...item, attestations: item.attestations.map((claim) => ({ ...claim, disputed: claim.disputed || disputedIds.has(claim.id) })) }));
  const claims = contributions.flatMap((item) => item.attestations.map((value) => asClaim(value, item.id)));
  return { contributions, claims, reputation: buildReputation(claims, now), checkpoint };
}

export async function graphProjection(profileId: string, projection: Awaited<ReturnType<typeof profileProjection>>) {
  const nodes: Array<{ id: string; kind: string; label: string }> = [{ id: profileId, kind: "profile", label: "Creator profile" }];
  const edges: Array<{ source: string; target: string; relationship: "claimed" | "attested"; lifecycle?: string }> = [];
  for (const contribution of projection.contributions) {
    nodes.push({ id: contribution.id, kind: "contribution", label: contribution.id.slice(0, 10) }); edges.push({ source: profileId, target: contribution.id, relationship: "claimed" });
    if (contribution.parentId) edges.push({ source: contribution.parentId, target: contribution.id, relationship: "claimed" });
    const metadata = await readPublicJson(contribution.metadataURI, contribution.metadataDigest); const collaborators = Array.isArray(metadata?.collaborators) ? metadata.collaborators : []; const sources = metadata?.provenance && typeof metadata.provenance === "object" && Array.isArray((metadata.provenance as { sources?: unknown[] }).sources) ? (metadata.provenance as { sources: unknown[] }).sources : [];
    for (const value of collaborators) { if (!value || typeof value !== "object") continue; const collaborator = value as { profileId?: string; role?: string }; if (!collaborator.profileId) continue; if (!nodes.some((node) => node.id === collaborator.profileId)) nodes.push({ id: collaborator.profileId, kind: "collaborator", label: collaborator.role ?? "Collaborator" }); edges.push({ source: collaborator.profileId, target: contribution.id, relationship: "claimed" }); }
    for (const [index, value] of sources.entries()) { if (!value || typeof value !== "object") continue; const source = value as { url?: string; title?: string }; if (!source.url) continue; const sourceId = `${contribution.id}:source:${index}`; nodes.push({ id: sourceId, kind: "source", label: source.title?.slice(0, 18) ?? "Source" }); edges.push({ source: sourceId, target: contribution.id, relationship: "claimed" }); }
    for (const claim of contribution.attestations) { const issuer = claim.issuer.toLowerCase(); if (!nodes.some((node) => node.id === issuer)) nodes.push({ id: issuer, kind: "attester", label: `${issuer.slice(0, 8)}…` }); const lifecycle = claim.revokedAt ? "revoked" : claim.supersededBy ? "superseded" : BigInt(claim.validUntil) > 0n && BigInt(claim.validUntil) <= BigInt(projection.reputation.computedAt) ? "expired" : "active"; edges.push({ source: issuer, target: contribution.id, relationship: "attested", lifecycle }); }
  }
  return { algorithmVersion: REPUTATION_VERSION, profileId, nodes, edges, sourceBlock: projection.checkpoint?.latestBlock ?? null, freshness: projection.checkpoint ?? null, truncated: projection.contributions.length >= 250 };
}

export async function feedProjection(limit = 100) {
  const [data, checkpoint] = await Promise.all([
    indexerQuery<{ Contribution: IndexedContribution[]; Profile: Array<{ id: string; owner: string; metadataURI: string; metadataDigest: string; isAgent: boolean; agentId?: string }> }>(`query($limit:Int!){Contribution(limit:$limit,order_by:{createdAt:desc}){id creatorProfileId artifactDigest metadataDigest metadataURI parentId registeredBy createdAt archivedAt attestations{ id issuer claimType result evidenceDigest evidenceURI issuedAt validUntil supersededBy revokedAt selfAtIssuance disputed }} Profile(limit:250){id owner metadataURI metadataDigest isAgent agentId}}`, { limit }),
    indexerCheckpoint(),
  ]);
  if (!checkpoint) throw new Error("Indexed chain checkpoint unavailable");
  const now = BigInt(checkpoint.latestTimestamp); const disputedIds = await openDisputeIds(data.Contribution.map((item) => item.id)); data.Contribution = data.Contribution.map((item) => ({ ...item, attestations: item.attestations.map((claim) => ({ ...claim, disputed: claim.disputed || disputedIds.has(claim.id) })) }));
  const profiles = new Map(data.Profile.map((profile) => [profile.id, profile])); const ownerProfiles = new Map(data.Profile.map((profile) => [profile.owner.toLowerCase(), profile.id]));
  const attestEdges = new Set<string>();
  for (const item of data.Contribution) for (const claim of item.attestations) { const issuerProfile = ownerProfiles.get(claim.issuer.toLowerCase()); if (issuerProfile) attestEdges.add(`${issuerProfile}->${item.creatorProfileId}`); }
  return { checkpoint, at: now.toString(), items: rankFeed(data.Contribution.filter((item) => !item.archivedAt).map((item) => {
    const score = buildReputation(item.attestations.map((value) => asClaim(value, item.id)), now);
    const categoryValues = Object.values(score.categories);
    const activeExternal = categoryValues.reduce((sum, value) => sum + value.activeExternal, 0);
    const issuers = new Set(item.attestations.filter((value) => !value.selfAtIssuance && !value.revokedAt && !value.supersededBy && (!BigInt(value.validUntil) || BigInt(value.validUntil) > now)).map((value) => value.issuer.toLowerCase()));
    const covered = categoryValues.reduce((sum, value) => sum + value.activeExternal * value.evidenceCoverage, 0);
    const mutualAttestationCluster = item.attestations.some((claim) => { const issuerProfile = ownerProfiles.get(claim.issuer.toLowerCase()); return issuerProfile ? attestEdges.has(`${item.creatorProfileId}->${issuerProfile}`) : false; });
    return { ...item, creator: profiles.get(item.creatorProfileId) ?? null, activeExternal, uniqueAttesters: issuers.size, evidenceCoverage: activeExternal ? covered / activeExternal : 0, mutualAttestationCluster, createdAt: BigInt(item.createdAt) };
  })) };
}

export async function enrichedFeedProjection(limit = 100) {
  const projection = await feedProjection(limit); const items = await Promise.all(projection.items.map(async (item) => ({ ...item, metadata: await readPublicJson(item.metadataURI, item.metadataDigest), creatorMetadata: item.creator ? await readPublicJson(item.creator.metadataURI, item.creator.metadataDigest) : null })));
  return { ...projection, items };
}

export function filterFeedItems(items: Awaited<ReturnType<typeof enrichedFeedProjection>>["items"], filters: Record<string, string | undefined>, at: bigint) {
  return items.filter((item) => {
    const metadata = item.metadata ?? {}; const creatorMetadata = item.creatorMetadata ?? {}; const type = String(metadata.type ?? "").toLowerCase();
    const skills = [...(Array.isArray(metadata.skills) ? metadata.skills : []), ...(Array.isArray(creatorMetadata.skills) ? creatorMetadata.skills : [])].map(String).map((value) => value.toLowerCase());
    const communities = [...(Array.isArray(metadata.communities) ? metadata.communities : []), ...(Array.isArray(creatorMetadata.communities) ? creatorMetadata.communities : [])].map(String).map((value) => value.toLowerCase());
    const disputed = item.attestations.some((claim) => claim.disputed && !claim.revokedAt && !claim.supersededBy && (BigInt(claim.validUntil) === 0n || BigInt(claim.validUntil) > at));
    return (!filters.type || type === filters.type.toLowerCase()) && (!filters.skill || skills.includes(filters.skill.toLowerCase())) && (!filters.community || communities.includes(filters.community.toLowerCase())) && (!filters.actor || filters.actor === (item.creator?.isAgent ? "agent" : "human")) && (!filters.status || filters.status === "active" && item.activeExternal > 0 || filters.status === "unattested" && item.activeExternal === 0 || filters.status === "disputed" && disputed);
  });
}
