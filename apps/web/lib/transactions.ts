export const operationStates = ["draft", "awaiting_signature", "submitted", "proposed", "finalized", "indexed"] as const;
export type OperationState = (typeof operationStates)[number];

const transitions: Record<OperationState, readonly OperationState[]> = {
  draft: ["awaiting_signature"],
  awaiting_signature: ["draft", "submitted", "finalized"],
  submitted: ["proposed", "finalized"],
  proposed: ["finalized"],
  finalized: ["indexed"],
  indexed: [],
};

export function transitionOperation(current: OperationState, next: OperationState): OperationState {
  if (!transitions[current].includes(next)) throw new Error(`Invalid operation transition: ${current} → ${next}`);
  return next;
}

export function operationId(kind: string, wallet: string, payloadDigest: string): string {
  return `${kind}:${wallet.toLowerCase()}:${payloadDigest.toLowerCase()}`;
}
