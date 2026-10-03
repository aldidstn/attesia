import { expect, it, vi } from "vitest";
const hooks = vi.hoisted(() => ({ onBlock: vi.fn() }));
vi.mock("envio", () => ({ indexer: hooks, S: { number: {}, bigint: {} }, createEffect: vi.fn(() => ({})) }));
it("advances indexed chain time without a contract event, reproducibly", async () => {
  await import("../src/handlers/checkpoint");
  const [options, handler] = hooks.onBlock.mock.calls[0];
  expect(options.where({ chain: { id: 10143 } })).toEqual({ block: { number: { _every: 1000 } } });
  const set = vi.fn();
  const input = { block: { number: 100, timestamp: 200 }, context: { chain: { id: 10143 }, effect: vi.fn().mockResolvedValue(200n), ChainState: { set } } };
  await handler(input);
  await handler(input);
  expect(set.mock.calls).toEqual([[{ id: "10143", latestBlock: 100n, latestTimestamp: 200n }], [{ id: "10143", latestBlock: 100n, latestTimestamp: 200n }]]);
});
