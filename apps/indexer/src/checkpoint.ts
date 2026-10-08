type Checkpoint = { id: string; latestBlock: bigint; latestTimestamp: bigint };
export async function checkpoint(context: { ChainState: { get(id: string): Promise<Checkpoint | undefined>; set(value: Checkpoint): void } }, event: { chainId: number; block: { number: number; timestamp: number } }) {
  const id = String(event.chainId), latestBlock = BigInt(event.block.number);
  const current = await context.ChainState.get(id);
  if (!current || latestBlock > current.latestBlock) context.ChainState.set({ id, latestBlock, latestTimestamp: BigInt(event.block.timestamp) });
}
