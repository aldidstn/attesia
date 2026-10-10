export type ClaimProjection = { id: string; contributionId: string; issuer: string; claimType: string; self: boolean; supersededBy?: string; revokedAt?: bigint; disputed: boolean; issuedAt?: bigint; validUntil?: bigint; evidence?: boolean };
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

export function reputation(state: Projection, contributionIds: string[], at: bigint) {
  const names = ["COMPLETION", "AUTHORSHIP", "QUALITY", "USAGE", "PROVENANCE"];
  const result = Object.fromEntries(names.map((name) => [name, { activeExternal: 0, uniqueAttesters: 0, evidenceCoverage: 0, self: 0, disputed: 0, undisputed: 0, revoked: 0, superseded: 0, expired: 0, historical: 0 }])) as Record<string, any>;
  const issuers = new Map<string, Set<string>>(); const evidence = new Map<string, number>();
  for (const claim of state.claims.values()) {
    if (!contributionIds.includes(claim.contributionId) || !result[claim.claimType]) continue;
    const signal = result[claim.claimType]; signal.historical++;
    if (claim.revokedAt) { signal.revoked++; continue; }
    if (claim.supersededBy) { signal.superseded++; continue; }
    if (claim.validUntil && claim.validUntil <= at) { signal.expired++; continue; }
    if (claim.self) { signal.self++; continue; }
    signal.activeExternal++; if (claim.disputed) signal.disputed++; else signal.undisputed++;
    const set = issuers.get(claim.claimType) ?? new Set<string>(); set.add(claim.issuer.toLowerCase()); issuers.set(claim.claimType, set);
    if (claim.evidence) evidence.set(claim.claimType, (evidence.get(claim.claimType) ?? 0) + 1);
  }
  for (const name of names) { result[name].uniqueAttesters = issuers.get(name)?.size ?? 0; result[name].evidenceCoverage = result[name].activeExternal ? (evidence.get(name) ?? 0) / result[name].activeExternal : 0; }
  return result;
}

export type PolicyProjection = { version: number; digest: string; uri: string; paused: boolean; updatedAt: bigint };
export function projectPolicy(current: PolicyProjection | undefined, event: { type: "updated"; version: number; digest: string; uri: string; at: bigint } | { type: "paused"; version: number; at: bigint }) {
  if (event.type === "updated") return !current || event.version > current.version ? { version: event.version, digest: event.digest, uri: event.uri, paused: false, updatedAt: event.at } : current;
  return current && event.version === current.version ? { ...current, paused: true, updatedAt: event.at } : current;
}
