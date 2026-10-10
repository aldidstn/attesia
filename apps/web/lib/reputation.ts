import { keccak256, stringToHex } from "viem";

export const REPUTATION_VERSION = "reputation-v1";
export const categories = ["COMPLETION", "AUTHORSHIP", "QUALITY", "USAGE", "PROVENANCE"] as const;
export type ReputationCategory = (typeof categories)[number];

const hashes = Object.fromEntries(categories.map((name) => [keccak256(stringToHex(name)).toLowerCase(), name])) as Record<string, ReputationCategory>;
const ZERO = `0x${"0".repeat(64)}`;

export type ReputationClaim = {
  id: string; contributionId: string; claimType: string; issuer: string; result: number;
  evidenceDigest: string; evidenceURI: string; issuedAt: bigint; validUntil: bigint;
  selfAtIssuance: boolean; disputed: boolean; supersededBy?: string | null; revokedAt?: bigint | null;
};

export type CategorySignal = {
  activeExternal: number; uniqueAttesters: number; evidenceCoverage: number;
  self: number; disputed: number; undisputed: number; revoked: number;
  superseded: number; expired: number; historical: number;
  outcomes: { positive: number; neutral: number; negative: number };
};

const emptySignal = (): CategorySignal => ({
  activeExternal: 0, uniqueAttesters: 0, evidenceCoverage: 0, self: 0,
  disputed: 0, undisputed: 0, revoked: 0, superseded: 0, expired: 0,
  historical: 0, outcomes: { positive: 0, neutral: 0, negative: 0 },
});

export function categoryName(value: string): ReputationCategory | undefined {
  const upper = value.toUpperCase();
  return categories.includes(upper as ReputationCategory) ? upper as ReputationCategory : hashes[value.toLowerCase()];
}

export function buildReputation(claims: ReputationClaim[], at: bigint) {
  const signals = Object.fromEntries(categories.map((name) => [name, emptySignal()])) as Record<ReputationCategory, CategorySignal>;
  const issuers = Object.fromEntries(categories.map((name) => [name, new Set<string>()])) as Record<ReputationCategory, Set<string>>;
  const evidence = Object.fromEntries(categories.map((name) => [name, 0])) as Record<ReputationCategory, number>;

  for (const claim of claims) {
    const name = categoryName(claim.claimType); if (!name) continue;
    const signal = signals[name]; signal.historical++;
    if (claim.revokedAt) { signal.revoked++; continue; }
    if (claim.supersededBy) { signal.superseded++; continue; }
    if (claim.validUntil > 0n && claim.validUntil <= at) { signal.expired++; continue; }
    if (claim.selfAtIssuance) { signal.self++; continue; }
    signal.activeExternal++;
    issuers[name].add(claim.issuer.toLowerCase());
    if (claim.evidenceURI && claim.evidenceDigest.toLowerCase() !== ZERO) evidence[name]++;
    if (claim.disputed) signal.disputed++; else signal.undisputed++;
    if (claim.result > 0) signal.outcomes.positive++; else if (claim.result < 0) signal.outcomes.negative++; else signal.outcomes.neutral++;
  }
  for (const name of categories) {
    signals[name].uniqueAttesters = issuers[name].size;
    signals[name].evidenceCoverage = signals[name].activeExternal ? evidence[name] / signals[name].activeExternal : 0;
  }
  return { algorithmVersion: REPUTATION_VERSION, computedAt: at.toString(), categories: signals };
}

export type FeedSignal = { id: string; activeExternal: number; evidenceCoverage: number; uniqueAttesters: number; createdAt: bigint };
export function rankFeed<T extends FeedSignal>(items: T[]) {
  return [...items].sort((a, b) =>
    b.activeExternal - a.activeExternal || b.evidenceCoverage - a.evidenceCoverage ||
    b.uniqueAttesters - a.uniqueAttesters || Number(b.createdAt / 604800n - a.createdAt / 604800n) || a.id.localeCompare(b.id)
  ).map((item) => ({ ...item, workspaceRelevance: "not_applicable" as const, freshnessBucket: (item.createdAt / 604800n).toString() }));
}
