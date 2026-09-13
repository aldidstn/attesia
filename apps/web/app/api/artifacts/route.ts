import { PinataSDK } from "pinata";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { findCredential, sha256, validateTextArtifact } from "@/lib/integrity";
import { db } from "@/db/client";
import { artifacts } from "@/db/schema";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in before publishing evidence", request);
    if (!process.env.PINATA_JWT) return apiError("CONFIG_REQUIRED", "PINATA_JWT is not configured", request);
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File)) return apiError("BAD_REQUEST", "A file is required", request);
    const bytes = new Uint8Array(await file.arrayBuffer()); validateTextArtifact(file, bytes);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (findCredential(text)) return apiError("BAD_REQUEST", "Possible credential found. Remove it before publication", request);
    if (file.type === "application/json") JSON.parse(text);
    const digest = await sha256(bytes); const expectedDigest = form.get("expectedDigest");
    if (typeof expectedDigest === "string" && expectedDigest.toLowerCase() !== digest.toLowerCase()) return apiError("CONFLICT", "Browser and server artifact digests do not match", request);
    const pinata = new PinataSDK({ pinataJwt: process.env.PINATA_JWT, pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL });
    const uploaded = await pinata.upload.public.file(file).name(file.name);
    const uri = `ipfs://${uploaded.cid}`; let retrieval = "pending";
    try { const gatewayUrl = await pinata.gateways.public.convert(uri); const response = await fetch(gatewayUrl); if (response.ok && await sha256(await response.arrayBuffer()) === digest) retrieval = "verified"; } catch { /* Pinata propagation can lag; public verification retries later. */ }
    await db().insert(artifacts).values({ ownerSubject: session.subject, cid: uploaded.cid, uri, sha256: digest, fileName: file.name, mediaType: file.type, size: String(bytes.byteLength), retrievalStatus: retrieval });
    return json({ cid: uploaded.cid, uri, artifactDigest: digest, size: bytes.byteLength, retrieval });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    if (message.includes("DATABASE_URL")) return apiError("CONFIG_REQUIRED", message, request);
    if (/limit|accepted|UTF-8|JSON|credential/i.test(message)) return apiError("BAD_REQUEST", message, request);
    return apiError("UPSTREAM_UNAVAILABLE", "Artifact storage is unavailable", request);
  }
}
