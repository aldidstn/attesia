import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { workspaceAuditEvents, workspaceMemberships, workspaces } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { canManageWorkspace, isWorkspaceRole } from "@/lib/workspaces";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to manage members", request);
    const { slug } = await params; const [workspace] = await db().select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1); if (!workspace || workspace.status !== "active") return apiError("NOT_FOUND", "Workspace not found", request);
    const [actor] = await db().select().from(workspaceMemberships).where(and(eq(workspaceMemberships.workspaceId, workspace.id), eq(workspaceMemberships.subject, session.subject))).limit(1);
    if (!actor || !canManageWorkspace(actor.role as never, actor.status as never)) return apiError("UNAUTHORIZED", "Workspace administrator access is required", request);
    const body = await request.json(); if (typeof body.subject !== "string" || !isWorkspaceRole(body.role)) return apiError("BAD_REQUEST", "A user subject and valid role are required", request);
    const [membership] = await db().insert(workspaceMemberships).values({ workspaceId: workspace.id, subject: body.subject, role: body.role }).onConflictDoUpdate({ target: [workspaceMemberships.workspaceId, workspaceMemberships.subject], set: { role: body.role, status: "active", updatedAt: new Date() } }).returning();
    await db().insert(workspaceAuditEvents).values({ workspaceId: workspace.id, actorSubject: session.subject, action: "member.upserted", targetType: "membership", targetId: membership.id, detail: { role: body.role } });
    return json({ id: membership.id, subject: membership.subject, role: membership.role, status: membership.status });
  } catch (error) { return apiError("BAD_REQUEST", error instanceof Error ? error.message : "Member update failed", request); }
}
