const MAX_TTL_SECONDS = 60;
export const MAX_PRIVATE_EVIDENCE_BYTES = 10 * 1024 * 1024;
export type PrivateEvidenceConfig = { url: string; serviceRoleKey: string; bucket: string; ttlSeconds: number };
export function privateEvidenceConfig(env: Record<string, string | undefined> = process.env): PrivateEvidenceConfig | null {
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY, bucket = env.PRIVATE_EVIDENCE_BUCKET ?? "private-evidence";
  if (!url || !serviceRoleKey) return null;
  const ttl = Number(env.PRIVATE_EVIDENCE_UPLOAD_TTL_SECONDS ?? MAX_TTL_SECONDS);
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > MAX_TTL_SECONDS) throw new Error(`PRIVATE_EVIDENCE_UPLOAD_TTL_SECONDS must be 1-${MAX_TTL_SECONDS}`);
  return { url: url.replace(/\/$/, ""), serviceRoleKey, bucket, ttlSeconds: ttl };
}
function headers(config: PrivateEvidenceConfig) { return { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}`, "content-type": "application/json" }; }
export async function createQuarantineUploadUrl(storageKey: string, contentType: string, config: PrivateEvidenceConfig) {
  if (!storageKey.startsWith("quarantine/")) throw new Error("Private uploads must target quarantine");
  const response = await fetch(`${config.url}/storage/v1/object/upload/sign/${config.bucket}/${storageKey}`, { method: "POST", headers: headers(config), body: JSON.stringify({}) });
  if (!response.ok) throw new Error(`Supabase upload signing failed (${response.status})`);
  const body = await response.json() as { url?: string }; if (!body.url) throw new Error("Supabase did not return an upload URL");
  return { url: `${config.url}/storage/v1${body.url.startsWith("/") ? body.url : `/${body.url}`}`, contentType };
}
export async function createVaultReadUrl(storageKey: string, config: PrivateEvidenceConfig) {
  if (!storageKey.startsWith("vault/")) throw new Error("Only scanned vault evidence can be read");
  const response = await fetch(`${config.url}/storage/v1/object/sign/${config.bucket}/${storageKey}`, { method: "POST", headers: headers(config), body: JSON.stringify({ expiresIn: config.ttlSeconds }) });
  if (!response.ok) throw new Error(`Supabase read signing failed (${response.status})`);
  const body = await response.json() as { signedURL?: string }; if (!body.signedURL) throw new Error("Supabase did not return a read URL");
  return `${config.url}/storage/v1${body.signedURL.startsWith("/") ? body.signedURL : `/${body.signedURL}`}`;
}
