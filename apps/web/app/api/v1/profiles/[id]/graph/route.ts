import { isHex } from "viem";
import { apiError, json } from "@/lib/api";
import { metadataDigest } from "@/lib/integrity";
import { graphProjection, profileProjection } from "@/lib/phase3-data";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!isHex(id, { strict: true }) || id.length !== 66) return apiError("BAD_REQUEST", "Profile ID must be bytes32", request);
  try {
    const data = await graphProjection(id, await profileProjection(id)); return json({ data }, { etag: `"${metadataDigest(data)}"` });
  } catch (error) { return apiError("UPSTREAM_UNAVAILABLE", error instanceof Error ? error.message : "Indexer unavailable", request); }
}
