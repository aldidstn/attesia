import { isHex } from "viem";
import { apiError, json } from "@/lib/api";
import { readAttestation } from "@/lib/onchain";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!isHex(id, { strict: true }) || id.length !== 66) return apiError("BAD_REQUEST", "Attestation ID must be bytes32", request);
  try { const attestation = await readAttestation(id as `0x${string}`); return json({ data: attestation }, { etag: `"${attestation.metadataDigest}"` }); }
  catch { return apiError("NOT_FOUND", "Attestation was not found on Monad Testnet", request); }
}
