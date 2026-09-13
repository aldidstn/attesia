import { apiError, json } from "@/lib/api";
import { canonicalJson, metadataDigest, sha256, validatePublicUrl } from "@/lib/integrity";
import { readAttestation, readContribution, readProfile } from "@/lib/onchain";

function metadataUrl(uri: string) {
  if (uri.startsWith("ipfs://")) {
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL; if (!gateway) throw new Error("NEXT_PUBLIC_GATEWAY_URL is not configured");
    return validatePublicUrl(`https://${gateway.replace(/^https?:\/\//, "").replace(/\/$/, "")}/ipfs/${uri.slice(7)}`);
  }
  return validatePublicUrl(uri);
}
export async function GET(request: Request) {
  const url = new URL(request.url); const id = url.searchParams.get("id"); const type = url.searchParams.get("type") ?? "contribution";
  if (!id || !/^0x[0-9a-fA-F]{64}$/.test(id)) return apiError("BAD_REQUEST", "A bytes32 id is required", request);
  try {
    const record = type === "profile" ? await readProfile(id as `0x${string}`) : type === "attestation" ? await readAttestation(id as `0x${string}`) : await readContribution(id as `0x${string}`);
    const response = await fetch(metadataUrl(record.metadataURI), { signal: AbortSignal.timeout(8000), headers: { accept: "application/json" } });
    if (!response.ok) return json({ data: record, integrity: { status: "unavailable", expected: record.metadataDigest, reason: `Metadata returned HTTP ${response.status}` } }, { status: 200 });
    const text = await response.text(); if (text.length > 4 * 1024 * 1024) throw new Error("Metadata exceeds verification limit");
    const metadata = JSON.parse(text); const actual = metadataDigest(metadata); const matches = actual.toLowerCase() === record.metadataDigest.toLowerCase();
    return json({ data: record, metadata, canonical: canonicalJson(metadata), integrity: { status: matches ? "verified" : "mismatch", expected: record.metadataDigest, actual } }, { etag: `"${actual}"` });
  } catch (error) { return apiError("UPSTREAM_UNAVAILABLE", error instanceof Error ? error.message : "Verification unavailable", request); }
}
export async function POST(request: Request) {
  try { const form = await request.formData(); const file = form.get("file"); const expected = form.get("expected"); if (!(file instanceof File) || typeof expected !== "string") return apiError("BAD_REQUEST", "file and expected digest are required", request); const actual = await sha256(await file.arrayBuffer()); return json({ artifact: { status: actual.toLowerCase() === expected.toLowerCase() ? "verified" : "mismatch", expected, actual, bytes: file.size } }); }
  catch { return apiError("BAD_REQUEST", "Artifact could not be verified", request); }
}
