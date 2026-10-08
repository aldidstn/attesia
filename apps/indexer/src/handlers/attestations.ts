import { checkpoint } from "../checkpoint";
import { indexer } from "envio";
const ZERO = `0x${"0".repeat(64)}`;
const categories: Record<string, string> = {
  "0xdb5630fbeb0ae3d52fd326e015fdc8f0443667fc6997e329e29da93e8fb46beb": "COMPLETION",
  "0x976d7aa58871de61df55235065ee41f5954d05432caf7e21eaabb66baa80ab66": "AUTHORSHIP",
  "0xe5521c090138c536f188428b9818105253de1fa80d6328538b05716e805fd5b6": "QUALITY",
  "0x225e9c5263d35a32ed1251d530e9f526d8708e52665b40e9682091beb2ea1a04": "USAGE",
  "0xf3ad510c7dab54a684cd9e0046afa1d4225cc8861a4f92f66da3eba8a3a3ca0b": "PROVENANCE",
};
indexer.onEvent({ contract: "AttestationRegistry", event: "AttestationCreated" }, async ({ event, context }) => {
  const p = event.params; if (await context.Attestation.get(p.attestationId)) return; const contribution = await context.Contribution.get(p.contributionId); if (!contribution) return; const category = categories[p.claimType.toLowerCase()] ?? p.claimType;
  context.Attestation.set({ id: p.attestationId, contribution_id: p.contributionId, issuer: p.issuer, claimType: p.claimType, result: Number(p.result), metadataDigest: p.metadataDigest, metadataURI: p.metadataURI, evidenceDigest: p.evidenceDigest, evidenceURI: p.evidenceURI, issuedAt: p.issuedAt, validUntil: p.validUntil, supersedes: p.supersedes === ZERO ? undefined : p.supersedes, supersededBy: undefined, revokedAt: undefined, selfAtIssuance: p.selfAtIssuance, disputed: false, profileId: contribution.creatorProfileId, category });
  await checkpoint(context, event);
});
indexer.onEvent({ contract: "AttestationRegistry", event: "AttestationSuperseded" }, async ({ event, context }) => {
  const old = await context.Attestation.get(event.params.oldAttestationId); if (old) context.Attestation.set({ ...old, supersededBy: event.params.newAttestationId });
  await checkpoint(context, event);
});
indexer.onEvent({ contract: "AttestationRegistry", event: "AttestationRevoked" }, async ({ event, context }) => {
  const claim = await context.Attestation.get(event.params.attestationId); if (claim) context.Attestation.set({ ...claim, revokedAt: event.params.revokedAt });
  await checkpoint(context, event);
});
