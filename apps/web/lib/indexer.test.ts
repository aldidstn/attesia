import { afterEach, describe, expect, it, vi } from "vitest";
import { indexerCheckpoint, indexerEndpoint, indexerOperationVisible } from "./indexer";

afterEach(() => { vi.unstubAllGlobals(); delete process.env.ENVIO_GRAPHQL_URL; delete process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL; });

describe("Envio projection", () => {
  it("prefers the server-only endpoint", () => {
    process.env.ENVIO_GRAPHQL_URL = "https://server.example/graphql";
    process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL = "https://public.example/graphql";
    expect(indexerEndpoint()).toBe("https://server.example/graphql");
  });
  it("uses the String primary-key type expected by HyperIndex", async () => {
    process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL = "https://indexer.example/v1/graphql";
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { ChainState_by_pk: { latestBlock: "42", latestTimestamp: "7" } } }) });
    vi.stubGlobal("fetch", fetch);
    expect(await indexerCheckpoint()).toEqual({ latestBlock: "42", latestTimestamp: "7" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.query).toContain("$id:String!");
    expect(body.variables.chainId).toBe(10143);
  });

  it("matches indexed records to the operation intent", async () => {
    process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL = "https://indexer.example/v1/graphql";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {
      Profile_by_pk: null,
      Contribution_by_pk: { metadataDigest: "0xabc" },
      Attestation_by_pk: { metadataDigest: "0xdef", revokedAt: "9" },
    } }) }));
    await expect(indexerOperationVisible("register_contribution", "0x1", "0xAbC")).resolves.toBe(true);
    await expect(indexerOperationVisible("create_attestation", "0x1", "0xabc")).resolves.toBe(false);
    await expect(indexerOperationVisible("revoke_attestation", "0x1", "0xunused")).resolves.toBe(true);
  });
});
