import { checkpoint } from "../checkpoint";
import { indexer } from "envio";
const ZERO = `0x${"0".repeat(64)}`;
indexer.onEvent({ contract: "ContributionRegistry", event: "ContributionRegistered" }, async ({ event, context }) => {
  const p = event.params; if (await context.Contribution.get(p.contributionId)) return;
  context.Contribution.set({ id: p.contributionId, creatorProfileId: p.creatorProfileId, artifactDigest: p.artifactDigest, metadataDigest: p.metadataDigest, metadataURI: p.metadataURI, parentId: p.parentId === ZERO ? undefined : p.parentId, registeredBy: p.registeredBy, createdAt: p.createdAt, archivedAt: undefined });
  await checkpoint(context, event);
});
indexer.onEvent({ contract: "ContributionRegistry", event: "ContributionArchived" }, async ({ event, context }) => {
  const contribution = await context.Contribution.get(event.params.contributionId); if (!contribution) return;
  context.Contribution.set({ ...contribution, archivedAt: event.params.archivedAt });
  await checkpoint(context, event);
});
