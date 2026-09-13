import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { drafts } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to retrieve saved drafts", request);
    const rows = await db().select().from(drafts).where(eq(drafts.ownerSubject, session.subject)).orderBy(desc(drafts.updatedAt)).limit(50);
    return json({ data: rows, nextCursor: null });
  } catch (error) { return apiError("CONFIG_REQUIRED", error instanceof Error ? error.message : "Draft storage unavailable", request); }
}
export async function POST(request: Request) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to save drafts", request);
    const body = await request.json(); if (!body.payload || typeof body.kind !== "string") return apiError("BAD_REQUEST", "kind and payload are required", request);
    const [saved] = await db().insert(drafts).values({ id: body.id, ownerSubject: session.subject, kind: body.kind, payload: body.payload, updatedAt: new Date() }).onConflictDoUpdate({ target: drafts.id, set: { payload: body.payload, updatedAt: new Date() } }).returning();
    return json(saved, { status: 201 });
  } catch (error) { return apiError("CONFIG_REQUIRED", error instanceof Error ? error.message : "Draft storage unavailable", request); }
}
