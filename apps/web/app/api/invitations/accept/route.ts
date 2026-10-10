import { createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations, workspaceMemberships, workspaces } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to accept this invitation", request);
    const body = await request.json(); const token = typeof body.token === "string" ? body.token : ""; if (!token) return apiError("BAD_REQUEST", "Invitation token is required", request);
    const hash = createHash("sha256").update(token).digest("hex");
    const [invite] = await db().select().from(invitations).where(and(eq(invitations.recipientHash, hash), isNull(invitations.acceptedAt))).limit(1);
    if (!invite || invite.expiresAt <= new Date() || !invite.contributionId.startsWith("workspace:")) return apiError("NOT_FOUND", "Invitation is invalid or expired", request);
    const [, slug, role = "reviewer"] = invite.contributionId.split(":"); const [workspace] = await db().select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1); if (!workspace) return apiError("NOT_FOUND", "Workspace not found", request);
    await db().insert(workspaceMemberships).values({ workspaceId: workspace.id, subject: session.subject, role }).onConflictDoUpdate({ target: [workspaceMemberships.workspaceId, workspaceMemberships.subject], set: { role, status: "active", updatedAt: new Date() } });
    await db().update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invite.id));
    return json({ workspaceSlug: slug, role });
  } catch (error) { return apiError("BAD_REQUEST", error instanceof Error ? error.message : "Invitation acceptance failed", request); }
}
