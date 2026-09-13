import { indexer } from "envio";

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
