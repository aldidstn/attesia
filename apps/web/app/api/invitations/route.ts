import { createHash } from "node:crypto";
import { db } from "@/db/client";
import { invitations } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
export async function POST(request: Request) {
  try { const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to invite a reviewer", request); const body = await request.json(); if (!body.contributionId || !body.recipient) return apiError("BAD_REQUEST", "contributionId and recipient are required", request); const recipientHash = createHash("sha256").update(body.recipient.trim().toLowerCase()).digest("hex"); const [row] = await db().insert(invitations).values({ contributionId: body.contributionId, issuerSubject: session.subject, recipientHash, expiresAt: new Date(Date.now() + 7 * 86400000) }).onConflictDoNothing().returning(); if (!row) return apiError("CONFLICT", "This reviewer already has an invitation", request); return json({ id: row.id, contributionId: row.contributionId, expiresAt: row.expiresAt }, { status: 201 }); }
  catch (error) { return apiError("CONFIG_REQUIRED", error instanceof Error ? error.message : "Invitations unavailable", request); }
}
