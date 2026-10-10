import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { privateEvidence, privateEvidenceGrants, workspaceAuditEvents, workspaceMemberships } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { createVaultReadUrl, privateEvidenceConfig } from "@/lib/private-evidence";
import { canAccessPrivateEvidence } from "@/lib/workspaces";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to access private evidence", request);
    const config = privateEvidenceConfig(); if (!config) return apiError("CONFIG_REQUIRED", "Private evidence storage is not configured", request);
    const { id } = await params;
    const [evidence] = await db().select().from(privateEvidence).where(eq(privateEvidence.id, id)).limit(1); if (!evidence || evidence.state !== "available") return apiError("NOT_FOUND", "Private evidence is not available", request);
    const [membership] = await db().select().from(workspaceMemberships).where(and(eq(workspaceMemberships.workspaceId, evidence.workspaceId), eq(workspaceMemberships.subject, session.subject))).limit(1);
    const [grant] = await db().select().from(privateEvidenceGrants).where(and(eq(privateEvidenceGrants.evidenceId, evidence.id), eq(privateEvidenceGrants.subject, session.subject), eq(privateEvidenceGrants.permission, "read"), eq(privateEvidenceGrants.status, "active"), or(isNull(privateEvidenceGrants.expiresAt), gt(privateEvidenceGrants.expiresAt, new Date())))).limit(1);
    if (!canAccessPrivateEvidence({ membershipStatus: membership?.status as "active" | "removed" | "suspended" | null, grantStatus: grant?.status as "active" | "revoked" | null, expiresAt: grant?.expiresAt })) return apiError("UNAUTHORIZED", "An active evidence grant is required", request);
    const accessUrl = await createVaultReadUrl(evidence.storageKeyCiphertext, config);
    await db().insert(workspaceAuditEvents).values({ workspaceId: evidence.workspaceId, actorSubject: session.subject, action: "private_evidence.read_url_issued", targetType: "private_evidence", targetId: evidence.id });
    return json({ accessUrl, expiresInSeconds: config.ttlSeconds }, { noStore: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Private evidence unavailable";
    return apiError(message.includes("DATABASE_URL") ? "CONFIG_REQUIRED" : "UPSTREAM_UNAVAILABLE", message, request);
  }
}
