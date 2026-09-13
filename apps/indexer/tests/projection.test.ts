import { describe, expect, it } from "vitest";
import { claimCounts, projectClaim, type Projection } from "../src/projection";
const empty = (): Projection => ({ claims: new Map(), activeByKey: new Map() });
describe("claim lifecycle projection", () => {
  it("is idempotent and excludes self claims from external counts", () => {
    const state = empty(); const event = { type: "created" as const, claim: { id: "a", contributionId: "c", issuer: "0x1", claimType: "COMPLETION", self: true, disputed: false } };
    projectClaim(state, event); projectClaim(state, event); expect(claimCounts(state, "c")).toEqual({ active: 1, external: 0, self: 1, disputed: 0, undisputed: 0 });
  });
  it("keeps disputes counted while exposing subsets", () => {
    const state = empty(); projectClaim(state, { type: "created", claim: { id: "a", contributionId: "c", issuer: "0x1", claimType: "QUALITY", self: false, disputed: true } });
    expect(claimCounts(state, "c")).toMatchObject({ active: 1, external: 1, disputed: 1, undisputed: 0 });
  });
  it("removes revoked and superseded claims from active counts", () => {
    const state = empty(); projectClaim(state, { type: "created", claim: { id: "a", contributionId: "c", issuer: "0x1", claimType: "QUALITY", self: false, disputed: false } });
    projectClaim(state, { type: "superseded", oldId: "a", newId: "b" }); expect(claimCounts(state, "c").active).toBe(0);
  });
  it("rebuilds the same historical state from a delayed replay", () => {
    const events = [
      { type: "created" as const, claim: { id: "a", contributionId: "c", issuer: "0x1", claimType: "COMPLETION", self: false, disputed: false } },
      { type: "revoked" as const, id: "a", revokedAt: 12n },
    ];
    const first = events.reduce(projectClaim, empty()); const rebuilt = events.reduce(projectClaim, empty());
    expect([...rebuilt.claims.entries()]).toEqual([...first.claims.entries()]); expect(claimCounts(rebuilt, "c").active).toBe(0);
  });
});
