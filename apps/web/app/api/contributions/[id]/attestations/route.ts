import { and, eq } from "drizzle-orm";
import { apiError, json } from "@/lib/api";
import { db } from "@/db/client";
import { disputes } from "@/db/schema";
import { indexerQuery } from "@/lib/indexer";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const result = await indexerQuery<{ Attestation: Array<{ id: string; selfAtIssuance: boolean; disputed: boolean; revokedAt?: string; supersededBy?: string }> }>(`query($id:String!){Attestation(where:{contribution_id:{_eq:$id}},order_by:{issuedAt:desc}){id issuer claimType result evidenceURI issuedAt validUntil supersedes supersededBy revokedAt selfAtIssuance disputed}}`, { id });
    const openDisputes = process.env.DATABASE_URL ? await db().select({ attestationId: disputes.attestationId }).from(disputes).where(and(eq(disputes.contributionId, id), eq(disputes.resolved, false))) : [];
    const disputedIds = new Set(openDisputes.map((row) => row.attestationId)); const claims = result.Attestation.map((claim) => ({ ...claim, disputed: claim.disputed || disputedIds.has(claim.id) }));
    const active = claims.filter((claim) => !claim.revokedAt && !claim.supersededBy); const external = active.filter((claim) => !claim.selfAtIssuance); return json({ data: claims, counts: { active: active.length, external: external.length, self: active.length - external.length, disputed: external.filter((claim) => claim.disputed).length, undisputed: external.filter((claim) => !claim.disputed).length } }); }
  catch (error) { return apiError("UPSTREAM_UNAVAILABLE", error instanceof Error ? error.message : "Indexer unavailable", request); }
}
