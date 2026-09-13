import { isHex } from "viem";
import { apiError, json } from "@/lib/api";
import { readProfile } from "@/lib/onchain";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!isHex(id, { strict: true }) || id.length !== 66) return apiError("BAD_REQUEST", "Profile ID must be bytes32", request);
  try { const profile = await readProfile(id as `0x${string}`); return json({ data: profile, integrity: { status: "unverified", reason: "Metadata retrieval is checked separately" } }, { etag: `"${profile.metadataDigest}"` }); }
  catch { return apiError("NOT_FOUND", "Profile was not found on Monad Testnet", request); }
}
