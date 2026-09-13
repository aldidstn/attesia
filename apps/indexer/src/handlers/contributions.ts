import { indexer } from "envio";
const ZERO = `0x${"0".repeat(64)}`;
indexer.onEvent({ contract: "ContributionRegistry", event: "ContributionRegistered" }, async ({ event, context }) => {
  const p = event.params;
  context.Contribution.set({ id: p.contributionId, creatorProfileId: p.creatorProfileId, artifactDigest: p.artifactDigest, metadataDigest: p.metadataDigest, metadataURI: p.metadataURI, parentId: p.parentId === ZERO ? undefined : p.parentId, registeredBy: p.registeredBy, createdAt: p.createdAt, archivedAt: undefined });
  context.ChainState.set({ id: String(event.chainId), latestBlock: BigInt(event.block.number), latestTimestamp: BigInt(event.block.timestamp) });
});
indexer.onEvent({ contract: "ContributionRegistry", event: "ContributionArchived" }, async ({ event, context }) => {
  const contribution = await context.Contribution.get(event.params.contributionId); if (!contribution) return;
  context.Contribution.set({ ...contribution, archivedAt: event.params.archivedAt });
  context.ChainState.set({ id: String(event.chainId), latestBlock: BigInt(event.block.number), latestTimestamp: BigInt(event.block.timestamp) });
});
