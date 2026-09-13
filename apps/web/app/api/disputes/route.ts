import { db } from "@/db/client";
import { disputes } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { validatePublicUrl } from "@/lib/integrity";
import { desc, eq } from "drizzle-orm";
export async function GET(request: Request) {
  try { const contributionId = new URL(request.url).searchParams.get("contributionId"); if (!contributionId) return apiError("BAD_REQUEST", "contributionId is required", request); const rows = await db().select({ id: disputes.id, attestationId: disputes.attestationId, reason: disputes.reason, evidenceUri: disputes.evidenceUri, resolved: disputes.resolved, createdAt: disputes.createdAt }).from(disputes).where(eq(disputes.contributionId, contributionId)).orderBy(desc(disputes.createdAt)).limit(100); return json({ data: rows }); }
  catch (error) { return apiError("CONFIG_REQUIRED", error instanceof Error ? error.message : "Disputes unavailable", request); }
}
export async function POST(request: Request) {
  try { const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to annotate a dispute", request); const body = await request.json(); if (!body.contributionId || typeof body.reason !== "string" || body.reason.trim().length < 20) return apiError("BAD_REQUEST", "A contribution ID and clear reason are required", request); if (body.evidenceURI) validatePublicUrl(body.evidenceURI); const [row] = await db().insert(disputes).values({ contributionId: body.contributionId, attestationId: body.attestationId, authorSubject: session.subject, reason: body.reason.trim(), evidenceUri: body.evidenceURI }).returning(); return json({ id: row.id, contributionId: row.contributionId, createdAt: row.createdAt }, { status: 201 }); }
  catch (error) { const message = error instanceof Error ? error.message : "Disputes unavailable"; return apiError(message.includes("DATABASE_URL") ? "CONFIG_REQUIRED" : "BAD_REQUEST", message, request); }
}
