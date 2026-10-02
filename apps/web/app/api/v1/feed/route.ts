import { apiError, decodeCursor, encodeCursor, json } from "@/lib/api";
import { metadataDigest } from "@/lib/integrity";
import { enrichedFeedProjection, filterFeedItems } from "@/lib/phase3-data";
import { categoryName } from "@/lib/reputation";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url); const rawLimit = Number(url.searchParams.get("limit") ?? 20); const limit = Number.isInteger(rawLimit) ? Math.max(1, Math.min(rawLimit, 50)) : 20;
    const rawCursor = decodeCursor(url.searchParams.get("cursor")); const offset = rawCursor ? Number(rawCursor) : 0; if (!Number.isInteger(offset) || offset < 0) throw new Error("Invalid pagination cursor");
    const type = url.searchParams.get("type")?.toLowerCase(); const community = url.searchParams.get("community")?.toLowerCase(); const skill = url.searchParams.get("skill")?.toLowerCase(); const status = url.searchParams.get("status"); const actor = url.searchParams.get("actor");
    if (actor && !["human", "agent"].includes(actor)) return apiError("BAD_REQUEST", "actor must be human or agent", request);
    if (status && !["active", "unattested", "disputed"].includes(status)) return apiError("BAD_REQUEST", "status must be active, unattested, or disputed", request);
    const projection = await enrichedFeedProjection(200); const filtered = filterFeedItems(projection.items, { type, community, skill, status: status ?? undefined, actor: actor ?? undefined }, BigInt(projection.at));
    const page = filtered.slice(offset, offset + limit).map((item) => ({ ...item, createdAt: item.createdAt.toString(), claimCategories: [...new Set(item.attestations.map((claim) => categoryName(claim.claimType)).filter(Boolean))], rankExplanation: { workspaceRelevance: "not_applicable", activeExternal: item.activeExternal, evidenceCoverage: item.evidenceCoverage, uniqueAttesters: item.uniqueAttesters, freshnessBucket: item.freshnessBucket } }));
    const data = { items: page, nextCursor: offset + limit < filtered.length ? encodeCursor(String(offset + limit)) : null, sourceBlock: projection.checkpoint?.latestBlock ?? null, freshness: projection.checkpoint ?? null };
    return json({ data }, { etag: `"${metadataDigest(data)}"` });
  } catch (error) { const message = error instanceof Error ? error.message : "Indexer unavailable"; return apiError(message === "Invalid pagination cursor" ? "BAD_REQUEST" : "UPSTREAM_UNAVAILABLE", message, request); }
}
