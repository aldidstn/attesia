import canonicalize from "canonicalize";
import { keccak256, stringToHex } from "viem";

export const MAX_ARTIFACT_BYTES = 4 * 1024 * 1024;
export const ALLOWED_ARTIFACT_TYPES = new Set(["text/plain", "text/markdown", "application/json"]);

export function canonicalJson(value: unknown): string {
  const result = canonicalize(value);
  if (result === undefined) throw new Error("Value cannot be represented as canonical JSON");
  return result;
}

export function metadataDigest(value: unknown): `0x${string}` {
  return keccak256(stringToHex(canonicalJson(value)));
}

export async function sha256(bytes: ArrayBuffer | Uint8Array): Promise<`0x${string}`> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return `0x${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function validatePublicUrl(input: string): URL {
  const url = new URL(input);
  if (url.protocol !== "https:") throw new Error("Only HTTPS URLs are accepted");
  if (url.username || url.password) throw new Error("URLs cannot contain credentials");
  const hostname = url.hostname.toLowerCase();
  const ipv4 = hostname.split(".").map(Number);
  const privateIpv4 = ipv4.length === 4 && ipv4.every(Number.isInteger) && (
    ipv4[0] === 0 || ipv4[0] === 10 || ipv4[0] === 127 ||
    (ipv4[0] === 100 && ipv4[1] >= 64 && ipv4[1] <= 127) ||
    (ipv4[0] === 169 && ipv4[1] === 254) ||
    (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31) ||
    (ipv4[0] === 192 && ipv4[1] === 168) ||
    (ipv4[0] === 198 && (ipv4[1] === 18 || ipv4[1] === 19)) || ipv4[0] >= 224
  );
  const ipv6 = hostname.replace(/^\[|\]$/g, "");
  const privateIpv6 = ipv6 === "::" || ipv6 === "::1" || /^(?:f[cd]|fe[89ab])/i.test(ipv6) || /^::ffff:(?:0|10|127|169\.254|172\.(?:1[6-9]|2\d|3[01])|192\.168)\./i.test(ipv6);
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || privateIpv4 || privateIpv6) {
    throw new Error("Local and private URLs are not accepted");
  }
  return url;
}

export function validateTextArtifact(file: Pick<File, "name" | "size" | "type">, bytes?: Uint8Array): void {
  if (file.size > MAX_ARTIFACT_BYTES) throw new Error("Artifact exceeds the 4 MB limit");
  if (!ALLOWED_ARTIFACT_TYPES.has(file.type)) throw new Error("Only text, Markdown, and JSON files are accepted");
  if (/\.(?:exe|dll|sh|bat|cmd|com|msi|html?|svg|js|mjs|wasm)$/i.test(file.name)) throw new Error("Executable or active content is not accepted");
  if (bytes) new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /(?:api[_-]?key|secret|password|private[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_\-/.+=]{12,}/i,
  /\b(?:ghp|github_pat|sk_live|sk_test)_[A-Za-z0-9_\-]{16,}\b/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  /\bphc_[A-Za-z0-9_-]{20,}\b/,
];

export function findCredential(text: string): boolean {
  return secretPatterns.some((pattern) => pattern.test(text));
}
