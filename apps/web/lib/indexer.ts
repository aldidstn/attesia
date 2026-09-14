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
  const result = await indexerQuery<{ ChainState_by_pk: { latestBlock: string; latestTimestamp: string } | null }>(
    "query($id:String!,$chainId:Int!){ChainState_by_pk(id:$id,chainId:$chainId){latestBlock latestTimestamp}}",
    { id: "10143", chainId: 10143 },
  );
  return result.ChainState_by_pk;
}

export async function indexerOperationVisible(kind: string, id: string, payloadDigest: string) {
  const result = await indexerQuery<{
    Profile_by_pk: { metadataDigest: string } | null;
    Contribution_by_pk: { metadataDigest: string } | null;
    Attestation_by_pk: { metadataDigest: string; revokedAt: string | null } | null;
  }>("query($id:String!,$chainId:Int!){Profile_by_pk(id:$id,chainId:$chainId){metadataDigest} Contribution_by_pk(id:$id,chainId:$chainId){metadataDigest} Attestation_by_pk(id:$id,chainId:$chainId){metadataDigest revokedAt}}", { id, chainId: 10143 });
  const digestMatches = (value?: string) => value?.toLowerCase() === payloadDigest.toLowerCase();
  if (kind === "create_profile" || kind === "update_profile") return digestMatches(result.Profile_by_pk?.metadataDigest);
  if (kind === "register_contribution") return digestMatches(result.Contribution_by_pk?.metadataDigest);
  if (kind === "create_attestation") return digestMatches(result.Attestation_by_pk?.metadataDigest);
  if (kind === "revoke_attestation") return result.Attestation_by_pk?.revokedAt != null;
  return false;
}
