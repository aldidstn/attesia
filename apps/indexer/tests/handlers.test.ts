import { expect, it, vi } from "vitest";
const handlers = vi.hoisted(() => new Map<string, (input: any) => Promise<void>>());
vi.mock("envio", () => ({ indexer: { onEvent: ({ event }: { event: string }, handler: any) => handlers.set(event, handler) } }));
import "../src/handlers/profiles";
import "../src/handlers/contributions";
import "../src/handlers/attestations";

function context() {
  return Object.fromEntries(["Profile", "Contribution", "Attestation", "AgentPolicy", "AgentPolicyVersion", "ChainState"].map(name => {
    const rows = new Map<string, any>();
    return [name, { rows, get: async (id: string) => rows.get(id), set: (row: any) => rows.set(row.id, structuredClone(row)) }];
  }));
}
const zero = `0x${"0".repeat(64)}`;
const event = (params: object, block: number) => ({ params, chainId: 10143, block: { number: block, timestamp: block * 10 }, transaction: { hash: `tx-${block}` }, logIndex: 0 });
const run = (name: string, context: any, params: object, block: number) => handlers.get(name)!({ context, event: event(params, block) });
const contribution = { contributionId: "c", creatorProfileId: "p", parentId: zero, createdAt: 10n };
const claim = { attestationId: "a", contributionId: "c", claimType: "COMPLETION", result: 1, supersedes: zero, issuedAt: 20n, validUntil: 50n, selfAtIssuance: false };
const policy = { agentId: 1n, profileId: "p", version: 1n, policyDigest: "digest", policyURI: "ipfs://policy", updatedAt: 10n, actor: "owner" };
it("delayed duplicate creation preserves revoke, supersession and archive", async () => {
  const ctx = context();
  await run("ContributionRegistered", ctx, contribution, 1);
  await run("AttestationCreated", ctx, claim, 2);
  await run("AttestationSuperseded", ctx, { oldAttestationId: "a", newAttestationId: "b" }, 3);
  await run("AttestationRevoked", ctx, { attestationId: "a", revokedAt: 40n }, 4);
  await run("ContributionArchived", ctx, { contributionId: "c", archivedAt: 50n }, 5);
  await run("AttestationCreated", ctx, claim, 2);
  await run("ContributionRegistered", ctx, contribution, 1);
  expect(await ctx.Attestation.get("a")).toMatchObject({ revokedAt: 40n, supersededBy: "b" });
  expect(await ctx.Contribution.get("c")).toMatchObject({ archivedAt: 50n });
  expect(await ctx.ChainState.get("10143")).toMatchObject({ latestBlock: 5n });
});
it("duplicate policy publication cannot unpause current or historical version", async () => {
  const ctx = context();
  await run("AgentPolicyUpdated", ctx, policy, 1);
  await run("AgentPolicyPaused", ctx, { agentId: 1n, version: 1n, pausedAt: 20n, actor: "owner" }, 2);
  await run("AgentPolicyUpdated", ctx, policy, 1);
  expect(await ctx.AgentPolicy.get("1")).toMatchObject({ paused: true, updatedAt: 20n });
  expect(await ctx.AgentPolicyVersion.get("1-1")).toMatchObject({ pausedAt: 20n });
});
it("rebuilding canonical events reproduces state; old policy does not replace new actor", async () => {
  async function replay() {
    const ctx = context();
    await run("AgentPolicyUpdated", ctx, policy, 1);
    await run("AgentPolicyUpdated", ctx, { ...policy, version: 2n, updatedAt: 20n, actor: "new-owner" }, 2);
    await run("AgentPolicyUpdated", ctx, policy, 1);
    return ctx;
  }
  const a = await replay(), b = await replay();
  expect(await a.AgentPolicy.get("1")).toEqual(await b.AgentPolicy.get("1"));
  expect(await a.AgentPolicy.get("1")).toMatchObject({ version: 2, actor: "new-owner" });
});
