import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { privateEvidence, privateEvidenceGrants, workspaceAuditEvents, workspaceMemberships } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { canManageWorkspace } from "@/lib/workspaces";

const permissions = new Set(["read", "export"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to manage access", request);
    const { id } = await params; const [evidence] = await db().select().from(privateEvidence).where(eq(privateEvidence.id, id)).limit(1); if (!evidence) return apiError("NOT_FOUND", "Private evidence not found", request);
    const [actor] = await db().select().from(workspaceMemberships).where(and(eq(workspaceMemberships.workspaceId, evidence.workspaceId), eq(workspaceMemberships.subject, session.subject))).limit(1);
    if (!actor || !canManageWorkspace(actor.role as never, actor.status as never)) return apiError("UNAUTHORIZED", "Workspace administrator access is required", request);
    const body = await request.json(); if (typeof body.subject !== "string" || !permissions.has(body.permission) || !["grant", "revoke"].includes(body.action)) return apiError("BAD_REQUEST", "Subject, permission, and grant or revoke action are required", request);
    const status = body.action === "grant" ? "active" : "revoked";
    const [grant] = await db().insert(privateEvidenceGrants).values({ evidenceId: evidence.id, subject: body.subject, permission: body.permission, status, grantedBySubject: session.subject, revokedAt: status === "revoked" ? new Date() : null }).onConflictDoUpdate({ target: [privateEvidenceGrants.evidenceId, privateEvidenceGrants.subject, privateEvidenceGrants.permission], set: { status, grantedBySubject: session.subject, revokedAt: status === "revoked" ? new Date() : null } }).returning();
    await db().insert(workspaceAuditEvents).values({ workspaceId: evidence.workspaceId, actorSubject: session.subject, action: `private_evidence.grant_${body.action}`, targetType: "private_evidence_grant", targetId: grant.id, detail: { permission: body.permission } });
    return json({ id: grant.id, subject: grant.subject, permission: grant.permission, status: grant.status });
  } catch (error) { return apiError("BAD_REQUEST", error instanceof Error ? error.message : "Evidence grant failed", request); }
}
