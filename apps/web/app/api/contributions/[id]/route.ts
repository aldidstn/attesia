import { isHex } from "viem";
import { apiError, json } from "@/lib/api";
import { readContribution } from "@/lib/onchain";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!isHex(id, { strict: true }) || id.length !== 66) return apiError("BAD_REQUEST", "Contribution ID must be bytes32", request);
  try { const contribution = await readContribution(id as `0x${string}`); return json({ data: contribution, projection: { status: "pending", message: "Attestations are available when the Envio endpoint is configured" } }, { etag: `"${contribution.metadataDigest}"` }); }
  catch { return apiError("NOT_FOUND", "Contribution was not found on Monad Testnet", request); }
}
