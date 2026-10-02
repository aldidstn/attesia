import { publicClient } from "./onchain";
import { contracts } from "./contracts.generated";
import { readPublicJson } from "./public-metadata";
import { indexerQuery } from "./indexer";

export const identityRegistry = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;
export const reputationRegistry = "0x8004B663056A597Dffe9eCcC1965A193B7388713" as const;
const identityAbi = [
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }] },
  { type: "function", name: "getAgentWallet", stateMutability: "view", inputs: [{ name: "agentId", type: "uint256" }], outputs: [{ type: "address" }] },
] as const;
const reputationAbi = [
  { type: "function", name: "getClients", stateMutability: "view", inputs: [{ name: "agentId", type: "uint256" }], outputs: [{ type: "address[]" }] },
  { type: "function", name: "readAllFeedback", stateMutability: "view", inputs: [{ name: "agentId", type: "uint256" }, { name: "clientAddresses", type: "address[]" }, { name: "tag1", type: "string" }, { name: "tag2", type: "string" }, { name: "includeRevoked", type: "bool" }], outputs: [{ type: "address[]" }, { type: "uint64[]" }, { type: "int128[]" }, { type: "uint8[]" }, { type: "string[]" }, { type: "string[]" }, { type: "bool[]" }] },
] as const;

export async function readAgent(agentId: bigint) {
  const [owner, uri, wallet, linkedProfileId, policy, clients] = await Promise.all([
    publicClient.readContract({ address: identityRegistry, abi: identityAbi, functionName: "ownerOf", args: [agentId] }),
    publicClient.readContract({ address: identityRegistry, abi: identityAbi, functionName: "tokenURI", args: [agentId] }),
    publicClient.readContract({ address: identityRegistry, abi: identityAbi, functionName: "getAgentWallet", args: [agentId] }),
    publicClient.readContract({ ...contracts.AttestiaProfileRegistry, functionName: "profileByAgent", args: [agentId] }),
    publicClient.readContract({ ...contracts.AttestiaProfileRegistry, functionName: "agentPolicy", args: [agentId] }),
    publicClient.readContract({ address: reputationRegistry, abi: reputationAbi, functionName: "getClients", args: [agentId] }),
  ]);
  const selectedClients = clients.slice(0, 100);
  const feedback = selectedClients.length ? await publicClient.readContract({ address: reputationRegistry, abi: reputationAbi, functionName: "readAllFeedback", args: [agentId, selectedClients, "", "", true] }) : [[], [], [], [], [], [], []] as const;
  const policyHistory = await indexerQuery<{ AgentPolicyVersion: Array<{ version: number; digest: string; uri: string; actor: string; publishedAt: string; pausedAt?: string | null }> }>(`query{AgentPolicyVersion(where:{agentId:{_eq:${agentId}}},order_by:{version:desc}){version digest uri actor publishedAt pausedAt}}`, {}).then((value) => value.AgentPolicyVersion).catch(() => []);
  return {
    chainId: 10143, agentId: agentId.toString(), owner, agentWallet: wallet, agentURI: uri,
    metadata: await readPublicJson(uri), identityRegistry, reputationRegistry,
    linkedProfileId, policy: { digest: policy.digest, uri: policy.uri, updatedAt: policy.updatedAt.toString(), version: policy.version, paused: policy.paused },
    policyHistory,
    erc8004Feedback: feedback[0].map((client, index) => ({ client, feedbackIndex: feedback[1][index].toString(), value: feedback[2][index].toString(), valueDecimals: feedback[3][index], tag1: feedback[4][index], tag2: feedback[5][index], revoked: feedback[6][index] })),
    feedbackTruncated: clients.length > selectedClients.length,
  };
}
