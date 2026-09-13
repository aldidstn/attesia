import { apiError, decodeCursor, encodeCursor, json } from "@/lib/api";
import { indexerQuery } from "@/lib/indexer";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const url = new URL(request.url); const requestedLimit = Number(url.searchParams.get("limit") ?? 20); const limit = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 50)) : 20; const cursor = decodeCursor(url.searchParams.get("cursor"));
    const result = await indexerQuery<{ Contribution: Array<Record<string, unknown>> }>(`query($id:String!,$limit:Int!,$cursor:String){Contribution(where:{creatorProfileId:{_eq:$id},id:{_gt:$cursor}},limit:$limit,order_by:{id:asc}){id creatorProfileId artifactDigest metadataDigest metadataURI parentId registeredBy createdAt archivedAt}}`, { id, limit, cursor });
    const data = result.Contribution; const lastId = data.at(-1)?.id; return json({ data, nextCursor: data.length === limit && typeof lastId === "string" ? encodeCursor(lastId) : null });
  } catch (error) { const message = error instanceof Error ? error.message : "Indexer unavailable"; return apiError(message === "Invalid pagination cursor" ? "BAD_REQUEST" : "UPSTREAM_UNAVAILABLE", message, request); }
}
