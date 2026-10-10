import { apiError, json } from "@/lib/api";
import { readAgent } from "@/lib/agent";
import { metadataDigest } from "@/lib/integrity";
export async function GET(request: Request, { params }: { params: Promise<{ chainId: string; agentId: string }> }) {
  const { chainId, agentId } = await params; if (chainId !== "10143" || !/^\d+$/.test(agentId)) return apiError("BAD_REQUEST", "Monad Testnet chain ID and a numeric agent ID are required", request);
  try { const data = await readAgent(BigInt(agentId)); return json({ data, sources: { identity: "ERC-8004 Identity Registry", reputation: "ERC-8004 Reputation Registry", claims: "Attestia registries" } }, { etag: `"${metadataDigest(data)}"` }); }
  catch { return apiError("NOT_FOUND", "Agent was not found or the registry is unavailable", request); }
}
