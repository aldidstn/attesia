import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { privateEvidence, workspaceMemberships, workspaces } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to view private evidence", request);
    const slug = new URL(request.url).searchParams.get("workspaceSlug"); if (!slug) return apiError("BAD_REQUEST", "workspaceSlug is required", request);
    const [workspace] = await db().select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1); if (!workspace) return apiError("NOT_FOUND", "Workspace not found", request);
    const [membership] = await db().select().from(workspaceMemberships).where(and(eq(workspaceMemberships.workspaceId, workspace.id), eq(workspaceMemberships.subject, session.subject), eq(workspaceMemberships.status, "active"))).limit(1);
    if (!membership) return apiError("UNAUTHORIZED", "Active workspace membership is required", request);
    const rows = await db().select({ id: privateEvidence.id, contributionId: privateEvidence.contributionId, classification: privateEvidence.classification, state: privateEvidence.state, scanVersion: privateEvidence.scanVersion, scanResult: privateEvidence.scanResult, createdAt: privateEvidence.createdAt, deleteAfter: privateEvidence.deleteAfter }).from(privateEvidence).where(eq(privateEvidence.workspaceId, workspace.id));
    return json({ data: rows }, { noStore: true });
  } catch (error) { return apiError("UPSTREAM_UNAVAILABLE", error instanceof Error ? error.message : "Private evidence unavailable", request); }
}
