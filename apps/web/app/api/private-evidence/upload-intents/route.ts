import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { privateEvidence, privateEvidenceGrants, workspaceAuditEvents, workspaceMemberships, workspaces } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { createQuarantineUploadUrl, MAX_PRIVATE_EVIDENCE_BYTES, privateEvidenceConfig } from "@/lib/private-evidence";

const allowedClassifications = new Set(["confidential", "restricted"]);
export async function POST(request: Request) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to prepare a private upload", request);
    const body = await request.json(); if (typeof body.workspaceSlug !== "string" || typeof body.contentType !== "string" || !allowedClassifications.has(body.classification) || !Number.isInteger(body.size) || body.size < 1 || body.size > MAX_PRIVATE_EVIDENCE_BYTES) return apiError("BAD_REQUEST", "Invalid private evidence upload request", request);
    const config = privateEvidenceConfig(); if (!config) return apiError("CONFIG_REQUIRED", "Private evidence storage is not configured", request);
    const [workspace] = await db().select().from(workspaces).where(eq(workspaces.slug, body.workspaceSlug)).limit(1); if (!workspace || workspace.status !== "active") return apiError("NOT_FOUND", "Workspace not found", request);
    const [membership] = await db().select().from(workspaceMemberships).where(and(eq(workspaceMemberships.workspaceId, workspace.id), eq(workspaceMemberships.subject, session.subject))).limit(1);
    if (!membership || membership.status !== "active") return apiError("UNAUTHORIZED", "Active workspace membership is required", request);
    const id = crypto.randomUUID(), storageKey = `quarantine/${workspace.id}/${id}`;
    const signed = await createQuarantineUploadUrl(storageKey, body.contentType, config);
    const [evidence] = await db().insert(privateEvidence).values({ id, workspaceId: workspace.id, ownerSubject: session.subject, contributionId: typeof body.contributionId === "string" ? body.contributionId : null, classification: body.classification, storageKeyCiphertext: storageKey }).returning();
    await db().insert(privateEvidenceGrants).values([{ evidenceId: id, subject: session.subject, permission: "read", grantedBySubject: session.subject }, { evidenceId: id, subject: session.subject, permission: "export", grantedBySubject: session.subject }]);
    await db().insert(workspaceAuditEvents).values({ workspaceId: workspace.id, actorSubject: session.subject, action: "private_evidence.upload_intent_created", targetType: "private_evidence", targetId: id });
    return json({ id: evidence.id, state: evidence.state, uploadUrl: signed.url, contentType: signed.contentType, expiresInSeconds: config.ttlSeconds, maxBytes: MAX_PRIVATE_EVIDENCE_BYTES }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Private storage unavailable";
    return apiError(message.includes("DATABASE_URL") ? "CONFIG_REQUIRED" : "UPSTREAM_UNAVAILABLE", message, request);
  }
}
