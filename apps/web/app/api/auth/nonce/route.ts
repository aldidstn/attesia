import { apiError, json } from "@/lib/api";
import { issueNonce } from "@/lib/auth";
export async function POST(request: Request) {
  try { const body = await request.json().catch(() => ({})); return json(await issueNonce(typeof body.wallet === "string" ? body.wallet : undefined)); }
  catch (error) { if (error instanceof Error && error.message.includes("DATABASE_URL")) return apiError("CONFIG_REQUIRED", error.message, request); return apiError("BAD_REQUEST", "Could not issue a nonce", request); }
}
