import { getAddress } from "viem";
import { parseSiweMessage } from "viem/siwe";
import { apiError, json } from "@/lib/api";
import { createSession, verifyPrivy, verifySiwe } from "@/lib/auth";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.accessToken === "string") { const verified = await verifyPrivy(body.accessToken); return json({ session: await createSession(verified.user_id, body.wallet) }); }
    if (typeof body.message === "string" && typeof body.signature === "string" && typeof body.nonce === "string") {
      if (!(await verifySiwe(body.message, body.signature, body.nonce))) return apiError("UNAUTHORIZED", "Signature is invalid or expired", request);
      const address = parseSiweMessage(body.message).address; if (!address) return apiError("BAD_REQUEST", "SIWE message has no address", request);
      return json({ session: await createSession(`siwe:${getAddress(address)}`, getAddress(address)) });
    }
    return apiError("BAD_REQUEST", "Provide a Privy access token or SIWE message", request);
  } catch (error) {
    if (error instanceof Error && /configured|DATABASE_URL/.test(error.message)) return apiError("CONFIG_REQUIRED", error.message, request);
    return apiError("UNAUTHORIZED", "Authentication could not be verified", request);
  }
}
