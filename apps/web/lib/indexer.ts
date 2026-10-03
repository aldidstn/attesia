export function indexerEndpoint() {
  return process.env.ENVIO_GRAPHQL_URL || process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL;
}

export async function indexerQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const endpoint = indexerEndpoint();
  if (!endpoint) throw new Error("ENVIO_GRAPHQL_URL is not configured");
  const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables }), next: { revalidate: 5 } });
  if (!response.ok) throw new Error(`Indexer returned HTTP ${response.status}`);
  const payload = await response.json(); if (payload.errors?.length) throw new Error(payload.errors[0].message);
  return payload.data;
}

export async function indexerCheckpoint() {
  const result = await indexerQuery<{ chain_metadata: Array<{ latest_processed_block: number | string }> }>(
    "query($chainId:Int!){chain_metadata(where:{chain_id:{_eq:$chainId}},limit:1){latest_processed_block}}",
    { chainId: 10143 },
  );
  const indexed = result.chain_metadata[0]?.latest_processed_block;
  if (indexed == null || BigInt(indexed) < 0n) return null;
  // The event checkpoint stops on quiet contracts. Read chain time at Envio's
  // processed block, never at the RPC head or the web server's wall clock.
  const { publicClient } = await import("./onchain");
  const block = await publicClient.getBlock({ blockNumber: BigInt(indexed) });
  return { latestBlock: String(indexed), latestTimestamp: block.timestamp.toString() };
}

export async function indexerOperationVisible(kind: string, id: string, payloadDigest: string) {
  const result = await indexerQuery<{
    Profile_by_pk: { metadataDigest: string } | null;
    Contribution_by_pk: { metadataDigest: string } | null;
    Attestation_by_pk: { metadataDigest: string; revokedAt: string | null } | null;
    AgentPolicy_by_pk: { digest: string; paused: boolean } | null;
  }>("query($id:String!,$chainId:Int!){Profile_by_pk(id:$id,chainId:$chainId){metadataDigest} Contribution_by_pk(id:$id,chainId:$chainId){metadataDigest} Attestation_by_pk(id:$id,chainId:$chainId){metadataDigest revokedAt} AgentPolicy_by_pk(id:$id,chainId:$chainId){digest paused}}", { id, chainId: 10143 });
  const digestMatches = (value?: string) => value?.toLowerCase() === payloadDigest.toLowerCase();
  if (kind === "create_profile" || kind === "update_profile") return digestMatches(result.Profile_by_pk?.metadataDigest);
  if (kind === "register_contribution") return digestMatches(result.Contribution_by_pk?.metadataDigest);
  if (kind === "create_attestation") return digestMatches(result.Attestation_by_pk?.metadataDigest);
  if (kind === "revoke_attestation") return result.Attestation_by_pk?.revokedAt != null;
  if (kind === "create_agent_profile") return digestMatches(result.Profile_by_pk?.metadataDigest);
  if (kind === "set_agent_policy") return digestMatches(result.AgentPolicy_by_pk?.digest);
  if (kind === "pause_agent_policy") return result.AgentPolicy_by_pk?.paused === true;
  return false;
}
