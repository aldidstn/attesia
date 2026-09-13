import { indexer } from "envio";
const ZERO = `0x${"0".repeat(64)}`;
indexer.onEvent({ contract: "AttestationRegistry", event: "AttestationCreated" }, async ({ event, context }) => {
  const p = event.params;
  context.Attestation.set({ id: p.attestationId, contribution_id: p.contributionId, issuer: p.issuer, claimType: p.claimType, result: Number(p.result), metadataDigest: p.metadataDigest, metadataURI: p.metadataURI, evidenceDigest: p.evidenceDigest, evidenceURI: p.evidenceURI, issuedAt: p.issuedAt, validUntil: p.validUntil, supersedes: p.supersedes === ZERO ? undefined : p.supersedes, supersededBy: undefined, revokedAt: undefined, selfAtIssuance: p.selfAtIssuance, disputed: false });
  context.ChainState.set({ id: String(event.chainId), latestBlock: BigInt(event.block.number), latestTimestamp: BigInt(event.block.timestamp) });
});
indexer.onEvent({ contract: "AttestationRegistry", event: "AttestationSuperseded" }, async ({ event, context }) => {
  const old = await context.Attestation.get(event.params.oldAttestationId); if (old) context.Attestation.set({ ...old, supersededBy: event.params.newAttestationId });
  context.ChainState.set({ id: String(event.chainId), latestBlock: BigInt(event.block.number), latestTimestamp: BigInt(event.block.timestamp) });
});
indexer.onEvent({ contract: "AttestationRegistry", event: "AttestationRevoked" }, async ({ event, context }) => {
  const claim = await context.Attestation.get(event.params.attestationId); if (claim) context.Attestation.set({ ...claim, revokedAt: event.params.revokedAt });
  context.ChainState.set({ id: String(event.chainId), latestBlock: BigInt(event.block.number), latestTimestamp: BigInt(event.block.timestamp) });
});
