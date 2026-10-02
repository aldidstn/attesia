import { validatePublicUrl } from "./integrity";

export function metadataUrl(uri: string) {
  if (uri.startsWith("data:application/json;base64,")) return uri;
  if (uri.startsWith("ipfs://")) {
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL; if (!gateway) throw new Error("Gateway unavailable");
    return `https://${gateway.replace(/^https?:\/\//, "").replace(/\/$/, "")}/ipfs/${uri.slice(7)}`;
  }
  return validatePublicUrl(uri).toString();
}

export async function readPublicJson(uri: string): Promise<Record<string, unknown> | null> {
  try {
    if (uri.startsWith("data:application/json;base64,")) return JSON.parse(Buffer.from(uri.slice(29), "base64").toString("utf8"));
    const response = await fetch(metadataUrl(uri), { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5000), next: { revalidate: 60 } });
    if (!response.ok || Number(response.headers.get("content-length") ?? 0) > 524288) return null;
    const text = await response.text(); if (text.length > 524288) return null;
    const value = JSON.parse(text); return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch { return null; }
}
