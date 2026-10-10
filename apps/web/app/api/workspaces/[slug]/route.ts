import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { workspaces } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { validWorkspaceSlug } from "@/lib/workspaces";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params; if (!validWorkspaceSlug(slug)) return apiError("BAD_REQUEST", "Invalid workspace slug", request);
    const [workspace] = await db().select({ slug: workspaces.slug, name: workspaces.name, description: workspaces.description, status: workspaces.status, createdAt: workspaces.createdAt }).from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    if (!workspace || workspace.status !== "active") return apiError("NOT_FOUND", "Workspace not found", request);
    return json({ data: workspace }, { etag: `"workspace:${workspace.slug}"` });
  } catch (error) { return apiError("CONFIG_REQUIRED", error instanceof Error ? error.message : "Workspace unavailable", request); }
}
