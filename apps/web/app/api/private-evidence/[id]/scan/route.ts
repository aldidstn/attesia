import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { privateEvidence, privateEvidenceGrants, workspaceAuditEvents, workspaceMemberships } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { privateEvidenceConfig, promoteQuarantineObject } from "@/lib/private-evidence";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to scan private evidence", request);
    const config = privateEvidenceConfig(); if (!config) return apiError("CONFIG_REQUIRED", "Private evidence storage is not configured", request);
    const { id } = await params;
    const [evidence] = await db().select().from(privateEvidence).where(eq(privateEvidence.id, id)).limit(1);
    if (!evidence || evidence.state !== "quarantine_pending") return apiError("NOT_FOUND", "Quarantine evidence not found", request);
    const [membership] = await db().select().from(workspaceMemberships).where(and(eq(workspaceMemberships.workspaceId, evidence.workspaceId), eq(workspaceMemberships.subject, session.subject))).limit(1);
    if (!membership || !["owner", "admin"].includes(membership.role) || membership.status !== "active") return apiError("UNAUTHORIZED", "Workspace admin access is required", request);
    const promoted = await promoteQuarantineObject(evidence.storageKeyCiphertext, config);
    await db().update(privateEvidence).set({ state: "available", storageKeyCiphertext: promoted.storageKey, scanVersion: "supabase-basic-v1", scanResult: "clean", updatedAt: new Date() }).where(eq(privateEvidence.id, id));
    await db().insert(workspaceAuditEvents).values({ workspaceId: evidence.workspaceId, actorSubject: session.subject, action: "private_evidence.scan_completed", targetType: "private_evidence", targetId: id, detail: { result: "clean", bytes: promoted.bytes, contentType: promoted.contentType } });
    return json({ id, state: "available", scanVersion: "supabase-basic-v1", scanResult: "clean" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Private evidence scan failed";
    return apiError(message.includes("DATABASE_URL") ? "CONFIG_REQUIRED" : "UPSTREAM_UNAVAILABLE", message, request);
  }
}
