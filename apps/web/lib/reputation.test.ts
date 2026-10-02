import { describe, expect, it } from "vitest";
import { buildReputation, rankFeed, type ReputationClaim } from "./reputation";

const claim = (overrides: Partial<ReputationClaim> = {}): ReputationClaim => ({
  id: "a", contributionId: "c", claimType: "COMPLETION", issuer: "0xReviewer",
  result: 1, evidenceDigest: `0x${"1".repeat(64)}`, evidenceURI: "https://example.com/evidence",
  issuedAt: 10n, validUntil: 0n, selfAtIssuance: false, disputed: false,
  ...overrides,
});

describe("reputation-v1", () => {
  it("counts external claims by category and keeps disputed claims active", () => {
    const score = buildReputation([claim(), claim({ id: "b", issuer: "0xOther", disputed: true })], 100n);
    expect(score.categories.COMPLETION).toMatchObject({ activeExternal: 2, uniqueAttesters: 2, disputed: 1, undisputed: 1, evidenceCoverage: 1 });
  });

  it("shows self claims but gives them zero external weight", () => {
    const score = buildReputation([claim({ selfAtIssuance: true })], 100n);
    expect(score.categories.COMPLETION).toMatchObject({ activeExternal: 0, self: 1 });
  });

  it("excludes revoked, superseded, and expired claims from active counts", () => {
    const score = buildReputation([
      claim({ id: "revoked", revokedAt: 20n }),
      claim({ id: "superseded", supersededBy: "new" }),
      claim({ id: "expired", validUntil: 99n }),
    ], 100n);
    expect(score.categories.COMPLETION).toMatchObject({ activeExternal: 0, revoked: 1, superseded: 1, expired: 1, historical: 3 });
  });

  it("deduplicates attesters case-insensitively and measures evidence coverage", () => {
    const score = buildReputation([
      claim({ issuer: "0xAbC" }),
      claim({ id: "b", issuer: "0xabc", evidenceDigest: `0x${"0".repeat(64)}`, evidenceURI: "" }),
    ], 100n);
    expect(score.categories.COMPLETION).toMatchObject({ uniqueAttesters: 1, evidenceCoverage: 0.5 });
  });

  it("ranks deterministically without workspace preference", () => {
    const ranked = rankFeed([
      { id: "b", activeExternal: 1, evidenceCoverage: 1, uniqueAttesters: 1, createdAt: 20n },
      { id: "a", activeExternal: 2, evidenceCoverage: 0.5, uniqueAttesters: 2, createdAt: 10n },
    ]);
    expect(ranked.map((item) => item.id)).toEqual(["a", "b"]);
    expect(ranked[0].workspaceRelevance).toBe("not_applicable");
  });
});
