import { afterEach, expect, it, vi } from "vitest";
import { readPublicJson } from "./public-metadata";
import { metadataDigest } from "./integrity";
afterEach(() => vi.unstubAllGlobals());
it("rejects unbound metadata and non-object inline payloads", async () => {
  const value = { title: "Original" }; const uri = `data:application/json;base64,${Buffer.from(JSON.stringify(value)).toString("base64")}`;
  await expect(readPublicJson(uri, metadataDigest(value))).resolves.toEqual(value);
  await expect(readPublicJson(uri, metadataDigest({ title: "Changed" }))).resolves.toBeNull();
  await expect(readPublicJson("data:application/json;base64,W10=")).resolves.toBeNull();
});
it("rejects oversized inline and streamed bodies", async () => {
  await expect(readPublicJson(`data:application/json;base64,${"A".repeat(800000)}`)).resolves.toBeNull();
  const cancel = vi.fn();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, headers: new Headers(), body: { getReader: () => ({ read: async () => ({ done: false, value: new Uint8Array(524289) }), cancel }) } }));
  await expect(readPublicJson("https://example.com/metadata")).resolves.toBeNull();
  expect(cancel).toHaveBeenCalled();
});
it("does not follow redirects to bypass URL validation", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response('{"name":"Agent"}'));
  vi.stubGlobal("fetch", fetch);
  await readPublicJson("https://example.com/metadata");
  expect(fetch.mock.calls[0][1].redirect).toBe("error");
});
