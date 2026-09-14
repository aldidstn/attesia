export type ClaimProjection = { id: string; contributionId: string; issuer: string; claimType: string; self: boolean; supersededBy?: string; revokedAt?: bigint; disputed: boolean };
export type Projection = { claims: Map<string, ClaimProjection> };
export type ClaimEvent =
  | { type: "created"; claim: ClaimProjection }
  | { type: "superseded"; oldId: string; newId: string }
  | { type: "revoked"; id: string; revokedAt: bigint }
  | { type: "disputed"; id: string; disputed: boolean };

export function projectClaim(state: Projection, event: ClaimEvent): Projection {
  if (event.type === "created") {
    if (state.claims.has(event.claim.id)) return state;
    state.claims.set(event.claim.id, event.claim);
  } else if (event.type === "superseded") {
    const old = state.claims.get(event.oldId); if (old) old.supersededBy = event.newId;
  } else if (event.type === "revoked") {
    const claim = state.claims.get(event.id); if (claim) claim.revokedAt = event.revokedAt;
  } else {
    const claim = state.claims.get(event.id); if (claim) claim.disputed = event.disputed;
  }
  return state;
}
export function claimCounts(state: Projection, contributionId: string) {
  const all = [...state.claims.values()].filter((claim) => claim.contributionId === contributionId && !claim.supersededBy && !claim.revokedAt);
  const external = all.filter((claim) => !claim.self);
  return { active: all.length, external: external.length, self: all.length - external.length, disputed: external.filter((claim) => claim.disputed).length, undisputed: external.filter((claim) => !claim.disputed).length };
}
