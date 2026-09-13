import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { operations } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { operationId, operationStates, transitionOperation, type OperationState } from "@/lib/transactions";

export async function POST(request: Request) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to submit transactions", request);
    const body = await request.json(); if (!body.kind || !body.wallet || !body.payloadDigest) return apiError("BAD_REQUEST", "kind, wallet, and payloadDigest are required", request);
    if (session.wallet && session.wallet.toLowerCase() !== String(body.wallet).toLowerCase()) return apiError("CONFLICT", "The active wallet differs from the authenticated wallet", request);
    const id = operationId(body.kind, body.wallet, body.payloadDigest);
    const [row] = await db().insert(operations).values({ id, ownerSubject: session.subject, wallet: body.wallet.toLowerCase(), kind: body.kind, state: "draft", payloadDigest: body.payloadDigest, recordId: body.recordId }).onConflictDoNothing().returning();
    if (row) return json(row, { status: 201 });
    const [existing] = await db().select().from(operations).where(eq(operations.id, id)).limit(1); return json(existing);
  } catch (error) { return apiError("CONFIG_REQUIRED", error instanceof Error ? error.message : "Operations unavailable", request); }
}
export async function PATCH(request: Request) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to update transactions", request);
    const body = await request.json(); if (!body.id || !operationStates.includes(body.state)) return apiError("BAD_REQUEST", "Valid id and state are required", request);
    const [current] = await db().select().from(operations).where(eq(operations.id, body.id)).limit(1); if (!current || current.ownerSubject !== session.subject) return apiError("NOT_FOUND", "Operation not found", request);
    try { transitionOperation(current.state as OperationState, body.state); } catch (error) { return apiError("CONFLICT", error instanceof Error ? error.message : "Invalid state transition", request); }
    const [updated] = await db().update(operations).set({ state: body.state, transactionHash: body.transactionHash ?? current.transactionHash, lastError: body.lastError ?? null, updatedAt: new Date() }).where(eq(operations.id, body.id)).returning(); return json(updated);
  } catch (error) { return apiError("CONFIG_REQUIRED", error instanceof Error ? error.message : "Operations unavailable", request); }
}
