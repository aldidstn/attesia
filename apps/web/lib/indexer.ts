export async function indexerQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const endpoint = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL;
  if (!endpoint) throw new Error("NEXT_PUBLIC_ENVIO_GRAPHQL_URL is not configured");
  const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables }), next: { revalidate: 5 } });
  if (!response.ok) throw new Error(`Indexer returned HTTP ${response.status}`);
  const payload = await response.json(); if (payload.errors?.length) throw new Error(payload.errors[0].message);
  return payload.data;
}
