import { PrivyClient, verifyAccessToken } from "@privy-io/node";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { createPublicClient, http } from "viem";
import { generateSiweNonce, parseSiweMessage } from "viem/siwe";
import { db } from "@/db/client";
import { nonces, sessions } from "@/db/schema";
import { monadTestnet } from "./chain";
import { normalizePrivyVerificationKey, privyAppId } from "./config";

const SESSION_COOKIE = "attestia_session";
async function tokenHash(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export async function createSession(subject: string, wallet?: string) {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db().insert(sessions).values({ tokenHash: await tokenHash(token), subject, wallet: wallet?.toLowerCase(), expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
  return { subject, wallet, expiresAt };
}
export async function currentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [session] = await db().select().from(sessions).where(and(eq(sessions.tokenHash, await tokenHash(token)), gt(sessions.expiresAt, new Date()))).limit(1);
  return session ?? null;
}
export async function endSession() {
  const jar = await cookies(); const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db().delete(sessions).where(eq(sessions.tokenHash, await tokenHash(token)));
  jar.delete(SESSION_COOKIE);
}
export async function verifyPrivy(accessToken: string) {
  const appId = privyAppId(); const verificationKey = process.env.PRIVY_VERIFICATION_KEY; const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || (!verificationKey && !appSecret)) throw new Error("Privy verification is not configured");
  if (appSecret) return new PrivyClient({ appId, appSecret }).utils().auth().verifyAccessToken(accessToken);
  return verifyAccessToken({ access_token: accessToken, app_id: appId, verification_key: normalizePrivyVerificationKey(verificationKey!) });
}
export async function issueNonce(wallet?: string) {
  const nonce = generateSiweNonce(); const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db().insert(nonces).values({ nonceHash: await tokenHash(nonce), wallet: wallet?.toLowerCase(), expiresAt });
  return { nonce, expiresAt };
}
export async function verifySiwe(message: string, signature: `0x${string}`, nonce: string) {
  const hash = await tokenHash(nonce);
  const [record] = await db().select().from(nonces).where(and(eq(nonces.nonceHash, hash), gt(nonces.expiresAt, new Date()), isNull(nonces.usedAt))).limit(1);
  if (!record) return false;
  const parsed = parseSiweMessage(message);
  if (parsed.chainId !== monadTestnet.id || (record.wallet && parsed.address?.toLowerCase() !== record.wallet)) return false;
  const client = createPublicClient({ chain: monadTestnet, transport: http() });
  const valid = await client.verifySiweMessage({ message, signature, nonce, domain: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").host });
  if (!valid) return false;
  const claimed = await db().update(nonces).set({ usedAt: new Date() }).where(and(eq(nonces.nonceHash, hash), isNull(nonces.usedAt))).returning({ nonceHash: nonces.nonceHash });
  return claimed.length === 1;
}
