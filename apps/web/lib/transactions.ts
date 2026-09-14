import { isAddress, isHex } from "viem";

export const operationStates = ["draft", "awaiting_signature", "submitted", "proposed", "finalized", "indexed"] as const;
export type OperationState = (typeof operationStates)[number];
export const operationKinds = ["create_profile", "update_profile", "register_contribution", "create_attestation", "revoke_attestation"] as const;

const transitions: Record<OperationState, readonly OperationState[]> = {
  draft: ["awaiting_signature"],
  awaiting_signature: ["draft", "submitted", "finalized"],
  submitted: ["proposed", "finalized"],
  proposed: ["finalized"],
  finalized: ["indexed"],
  indexed: [],
};

export function transitionOperation(current: OperationState, next: OperationState): OperationState {
  if (current === next) return next;
  if (!transitions[current].includes(next)) throw new Error(`Invalid operation transition: ${current} → ${next}`);
  return next;
}

export function operationId(kind: string, wallet: string, payloadDigest: string): string {
  if (!(operationKinds as readonly string[]).includes(kind)) throw new Error("Invalid operation kind");
  if (!isAddress(wallet)) throw new Error("Invalid operation wallet");
  if (!isHex(payloadDigest, { strict: true }) || payloadDigest.length !== 66) throw new Error("Invalid operation payload digest");
  return `${kind}:${wallet.toLowerCase()}:${payloadDigest.toLowerCase()}`;
}
