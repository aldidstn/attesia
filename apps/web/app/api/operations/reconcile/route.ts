import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { operations } from "@/db/schema";
import { apiError, json } from "@/lib/api";
import { currentSession } from "@/lib/auth";
import { contracts } from "@/lib/contracts.generated";
import { indexerCheckpoint, indexerOperationVisible } from "@/lib/indexer";
import { publicClient } from "@/lib/onchain";

export async function POST(request: Request) {
  try {
    const session = await currentSession(); if (!session) return apiError("UNAUTHORIZED", "Sign in to reconcile transactions", request); const { id } = await request.json();
    const [operation] = await db().select().from(operations).where(eq(operations.id, id)).limit(1); if (!operation || operation.ownerSubject !== session.subject) return apiError("NOT_FOUND", "Operation not found", request);
    let state = operation.state; let receiptBlock: bigint | undefined;
    if (operation.transactionHash && state !== "indexed") { const receipt = await publicClient.getTransactionReceipt({ hash: operation.transactionHash as `0x${string}` }).catch(() => null); if (receipt?.status === "success") { state = "finalized"; receiptBlock = receipt.blockNumber; } }
    if (!operation.transactionHash && operation.kind === "register_contribution" && operation.recordId) { const exists = await publicClient.readContract({ ...contracts.ContributionRegistry, functionName: "contributionExists", args: [operation.recordId as `0x${string}`] }); if (exists) state = "finalized"; }
    if (state === "finalized" && process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL) {
      const indexed = receiptBlock !== undefined
        ? await indexerCheckpoint().then((checkpoint) => checkpoint && BigInt(checkpoint.latestBlock) >= receiptBlock).catch(() => false)
        : operation.recordId
          ? await indexerOperationVisible(operation.kind, operation.recordId, operation.payloadDigest).catch(() => false)
          : false;
      if (indexed) state = "indexed";
    }
    if (state !== operation.state) await db().update(operations).set({ state, updatedAt: new Date() }).where(eq(operations.id, operation.id));
    return json({ ...operation, state, indexerLag: state === "finalized" });
  } catch (error) { return apiError("UPSTREAM_UNAVAILABLE", error instanceof Error ? error.message : "Reconciliation unavailable", request); }
}
