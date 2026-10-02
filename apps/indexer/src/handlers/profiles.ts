import { indexer } from "envio";
import { projectPolicy } from "../projection";

indexer.onEvent({ contract: "AttestiaProfileRegistry", event: "ProfileCreated" }, async ({ event, context }) => {
  context.Profile.set({ id: event.params.profileId, owner: event.params.owner, metadataDigest: event.params.metadataDigest, metadataURI: event.params.metadataURI, createdAt: event.params.createdAt, updatedAt: event.params.createdAt, isAgent: false, agentId: undefined });
  context.ChainState.set({ id: String(event.chainId), latestBlock: BigInt(event.block.number), latestTimestamp: BigInt(event.block.timestamp) });
});
indexer.onEvent({ contract: "AttestiaProfileRegistry", event: "AgentProfileCreated" }, async ({ event, context }) => {
  context.Profile.set({ id: event.params.profileId, owner: event.params.owner, metadataDigest: event.params.metadataDigest, metadataURI: event.params.metadataURI, createdAt: event.params.createdAt, updatedAt: event.params.createdAt, isAgent: true, agentId: event.params.agentId });
  context.ChainState.set({ id: String(event.chainId), latestBlock: BigInt(event.block.number), latestTimestamp: BigInt(event.block.timestamp) });
});
indexer.onEvent({ contract: "AttestiaProfileRegistry", event: "ProfileUpdated" }, async ({ event, context }) => {
  const profile = await context.Profile.get(event.params.profileId); if (!profile) return;
  context.Profile.set({ ...profile, metadataDigest: event.params.metadataDigest, metadataURI: event.params.metadataURI, updatedAt: event.params.updatedAt });
  context.ChainState.set({ id: String(event.chainId), latestBlock: BigInt(event.block.number), latestTimestamp: BigInt(event.block.timestamp) });
});
indexer.onEvent({ contract: "AttestiaProfileRegistry", event: "AgentPolicyUpdated" }, async ({ event, context }) => {
  const p = event.params; const id = p.agentId.toString(); const versionId = `${id}-${p.version}`;
  const current = await context.AgentPolicy.get(id); const next = projectPolicy(current ? { version: current.version, digest: current.digest, uri: current.uri, paused: current.paused, updatedAt: current.updatedAt } : undefined, { type: "updated", version: Number(p.version), digest: p.policyDigest, uri: p.policyURI, at: p.updatedAt })!;
  context.AgentPolicy.set({ id, profileId: p.profileId, agentId: p.agentId, ...next, actor: p.actor });
  context.AgentPolicyVersion.set({ id: versionId, profileId: p.profileId, agentId: p.agentId, digest: p.policyDigest, uri: p.policyURI, version: Number(p.version), actor: p.actor, publishedAt: p.updatedAt, pausedAt: undefined });
  context.ChainState.set({ id: String(event.chainId), latestBlock: BigInt(event.block.number), latestTimestamp: BigInt(event.block.timestamp) });
});
indexer.onEvent({ contract: "AttestiaProfileRegistry", event: "AgentPolicyPaused" }, async ({ event, context }) => {
  const p = event.params; const id = p.agentId.toString(); const versionId = `${id}-${p.version}`;
  const policy = await context.AgentPolicy.get(id); if (policy) { const next = projectPolicy({ version: policy.version, digest: policy.digest, uri: policy.uri, paused: policy.paused, updatedAt: policy.updatedAt }, { type: "paused", version: Number(p.version), at: p.pausedAt }); if (next) context.AgentPolicy.set({ ...policy, ...next, actor: p.actor }); }
  const version = await context.AgentPolicyVersion.get(versionId); if (version) context.AgentPolicyVersion.set({ ...version, pausedAt: p.pausedAt });
  context.ChainState.set({ id: String(event.chainId), latestBlock: BigInt(event.block.number), latestTimestamp: BigInt(event.block.timestamp) });
});
