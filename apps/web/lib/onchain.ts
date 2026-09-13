import { createPublicClient, http } from "viem";
import { monadTestnet } from "./chain";
import { contracts } from "./contracts.generated";

export const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });
export async function readProfile(id: `0x${string}`) {
  const value = await publicClient.readContract({ ...contracts.AttestiaProfileRegistry, functionName: "profile", args: [id] });
  return { id, owner: value.ownerSnapshot, metadataDigest: value.metadataDigest, metadataURI: value.metadataURI, createdAt: value.createdAt.toString(), updatedAt: value.updatedAt.toString(), agentId: value.agentId.toString(), isAgent: value.isAgent };
}
export async function readContribution(id: `0x${string}`) {
  const value = await publicClient.readContract({ ...contracts.ContributionRegistry, functionName: "contribution", args: [id] });
  return { id, creatorProfileId: value.creatorProfileId, artifactDigest: value.artifactDigest, metadataDigest: value.metadataDigest, metadataURI: value.metadataURI, parentId: value.parentId, registeredBy: value.registeredBy, createdAt: value.createdAt.toString(), archivedAt: value.archivedAt.toString() };
}
export async function readAttestation(id: `0x${string}`) {
  const value = await publicClient.readContract({ ...contracts.AttestationRegistry, functionName: "attestation", args: [id] });
  return { id, contributionId: value.contributionId, claimType: value.claimType, result: value.result, issuer: value.issuer, metadataDigest: value.metadataDigest, metadataURI: value.metadataURI, evidenceDigest: value.evidenceDigest, evidenceURI: value.evidenceURI, issuedAt: value.issuedAt.toString(), validUntil: value.validUntil.toString(), supersedes: value.supersedes, supersededBy: value.supersededBy, revokedAt: value.revokedAt.toString(), selfAtIssuance: value.selfAtIssuance };
}
