import { afterEach, expect, it, vi } from "vitest";
const fixtures = vi.hoisted(() => ({ feed: vi.fn(), profile: vi.fn() }));
vi.mock("./phase3-data", () => ({ enrichedFeedProjection: fixtures.feed, profileProjection: fixtures.profile, filterFeedItems: (items: unknown[]) => items }));
import { GET as feed } from "@/app/api/v1/feed/route";
import { GET as reputation } from "@/app/api/v1/profiles/[id]/reputation/route";
afterEach(() => vi.clearAllMocks());
it("rejects malformed feed filters and cursor before querying upstream", async () => {
  for (const query of ["actor=robot", "status=likes", "cursor=%%%"])
    expect((await feed(new Request(`https://example.com/api/v1/feed?${query}`))).status).toBe(400);
  expect(fixtures.feed).not.toHaveBeenCalled();
});
it("paginates feed deterministically and emits ETags and source checkpoint", async () => {
  const items = ["a", "b"].map(id => ({ id, createdAt: 10n, attestations: [], activeExternal: 0, evidenceCoverage: 0, uniqueAttesters: 0, freshnessBucket: "0" }));
  fixtures.feed.mockResolvedValue({ items, at: "100", checkpoint: { latestBlock: "50", latestTimestamp: "100" } });
  const first = await feed(new Request("https://example.com/api/v1/feed?limit=1"));
  const body = await first.json();
  expect(body.data.items[0].id).toBe("a"); expect(first.headers.get("etag")).toBeTruthy();
  const second = await feed(new Request(`https://example.com/api/v1/feed?limit=1&cursor=${body.data.nextCursor}`));
  expect((await second.json()).data).toMatchObject({ items: [{ id: "b" }], sourceBlock: "50", nextCursor: null });
});
it("keeps dependency errors structured and retryable", async () => {
  fixtures.profile.mockRejectedValue(new Error("Indexer unavailable"));
  const response = await reputation(new Request("https://example.com"), { params: Promise.resolve({ id: `0x${"1".repeat(64)}` }) });
  expect(response.status).toBe(503); expect(response.headers.get("retry-after")).toBe("30");
  expect((await response.json()).error.code).toBe("UPSTREAM_UNAVAILABLE");
});
