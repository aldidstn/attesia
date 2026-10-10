import { db } from "@/db/client";
import { workspaceAuditEvents, workspaceMemberships, workspaces } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { validWorkspaceSlug } from "@/lib/workspaces";

export async function POST(request: Request) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to create a workspace", request);
    const body = await request.json(); const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : ""; const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!validWorkspaceSlug(slug) || name.length < 2 || name.length > 100) return apiError("BAD_REQUEST", "Provide a 3-48 character lowercase slug and a workspace name", request);
    const id = crypto.randomUUID();
    await db().transaction(async (tx) => {
      await tx.insert(workspaces).values({ id, slug, name, description: typeof body.description === "string" ? body.description.trim().slice(0, 500) || null : null, ownerSubject: session.subject });
      await tx.insert(workspaceMemberships).values({ workspaceId: id, subject: session.subject, role: "owner" });
      await tx.insert(workspaceAuditEvents).values({ workspaceId: id, actorSubject: session.subject, action: "workspace.created", targetType: "workspace", targetId: id });
    });
    return json({ id, slug, name, role: "owner" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace unavailable";
    if (message.includes("DATABASE_URL")) return apiError("CONFIG_REQUIRED", message, request);
    if (/unique|duplicate/i.test(message)) return apiError("CONFLICT", "That workspace slug is already in use", request);
    return apiError("BAD_REQUEST", message, request);
  }
}
