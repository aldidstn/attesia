import { createEffect, indexer, S } from "envio";

// Envio 3.10 block hooks contain only the block number. Cache exact-block RPC
// timestamps so quiet contracts still expire claims deterministically on replay.
const blockTimestamp = createEffect({ name: "checkpoint-timestamp", input: S.number, output: S.bigint, rateLimit: { calls: 20, per: "second" }, cache: true }, async ({ input }) => {
  const response = await fetch("https://testnet-rpc.monad.xyz", {
    method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: [`0x${input.toString(16)}`, false] }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.result?.timestamp) throw new Error("Indexed block timestamp unavailable");
  return BigInt(payload.result.timestamp);
});

indexer.onBlock({ name: "chain-checkpoint", where: () => ({ block: { number: { _every: 1000 } } }) }, async ({ block, context }) => {
  const timestamp = await context.effect(blockTimestamp, block.number);
  context.ChainState.set({ id: String(context.chain.id), latestBlock: BigInt(block.number), latestTimestamp: timestamp });
});
