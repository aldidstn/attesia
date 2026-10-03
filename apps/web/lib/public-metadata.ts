import { metadataDigest, validatePublicUrl } from "./integrity";

export function metadataUrl(uri: string) {
  if (uri.startsWith("data:application/json;base64,")) return uri;
  if (uri.startsWith("ipfs://")) {
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL; if (!gateway) throw new Error("Gateway unavailable");
    return `https://${gateway.replace(/^https?:\/\//, "").replace(/\/$/, "")}/ipfs/${uri.slice(7)}`;
  }
  return validatePublicUrl(uri).toString();
}

export async function readPublicJson(uri: string, expectedDigest?: string): Promise<Record<string, unknown> | null> {
  const maxBytes = 524288;
  try {
    let bytes: Uint8Array;
    if (uri.startsWith("data:application/json;base64,")) {
      if (uri.length > Math.ceil(maxBytes / 3) * 4 + 29) return null;
      bytes = Buffer.from(uri.slice(29), "base64");
    } else {
      const response = await fetch(metadataUrl(uri), { headers: { accept: "application/json" }, redirect: "error", signal: AbortSignal.timeout(5000), next: { revalidate: 60 } });
      if (!response.ok || !response.body) return null;
      if (Number(response.headers.get("content-length") ?? 0) > maxBytes) { await response.body.cancel(); return null; }
      const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        total += value.byteLength;
        if (total > maxBytes) { await reader.cancel(); return null; }
        chunks.push(value);
      }
      bytes = Buffer.concat(chunks);
    }
    if (bytes.byteLength > maxBytes) return null;
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if (expectedDigest && metadataDigest(value).toLowerCase() !== expectedDigest.toLowerCase()) return null;
    return value;
  } catch { return null; }
}
