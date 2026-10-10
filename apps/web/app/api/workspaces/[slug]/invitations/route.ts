import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations, workspaceMemberships, workspaces } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { canManageWorkspace } from "@/lib/workspaces";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to invite a reviewer", request);
    const { slug } = await params; const [workspace] = await db().select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    if (!workspace) return apiError("NOT_FOUND", "Workspace not found", request);
    const [actor] = await db().select().from(workspaceMemberships).where(and(eq(workspaceMemberships.workspaceId, workspace.id), eq(workspaceMemberships.subject, session.subject))).limit(1);
    if (!actor || !canManageWorkspace(actor.role as never, actor.status as never)) return apiError("UNAUTHORIZED", "Workspace administrator access is required", request);
    const body = await request.json(); const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return apiError("BAD_REQUEST", "A valid reviewer email is required", request);
    const role = body.role === "contributor" || body.role === "viewer" ? body.role : "reviewer";
    const token = randomBytes(24).toString("base64url"); const recipientHash = createHash("sha256").update(token).digest("hex");
    const [row] = await db().insert(invitations).values({ contributionId: `workspace:${slug}:${role}`, issuerSubject: session.subject, recipientHash, expiresAt: new Date(Date.now() + 7 * 86400000) }).returning({ id: invitations.id, expiresAt: invitations.expiresAt });
    return json({ id: row.id, role, expiresAt: row.expiresAt, invitationToken: token, invitationUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/workspaces?invitation=${token}` }, { status: 201 });
  } catch (error) { return apiError("BAD_REQUEST", error instanceof Error ? error.message : "Invitation failed", request); }
}
