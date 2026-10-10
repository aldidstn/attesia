"use client";

import type { ConnectedWallet } from "@privy-io/react-auth";
import { createPublicClient, http, type Hex } from "viem";
import { monadWallet } from "./browser-wallet";
import { monadTestnet } from "./chain";

const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });

export function addFeeBuffer(value: bigint) {
  return (value * 120n + 99n) / 100n;
}

export function useAttestiaWrite() {
  async function writeContract({ wallet, to, data }: { wallet: ConnectedWallet; to: `0x${string}`; data: Hex }) {
    await wallet.switchChain(monadTestnet.id);
    const account = wallet.address as `0x${string}`;
    const [client, gas, fees] = await Promise.all([
      monadWallet(await wallet.getEthereumProvider(), account),
      publicClient.estimateGas({ account, to, data }),
      publicClient.estimateFeesPerGas(),
    ]);
    return {
      hash: await client.sendTransaction({
        to,
        data,
        gas: addFeeBuffer(gas),
        maxFeePerGas: addFeeBuffer(fees.maxFeePerGas),
        maxPriorityFeePerGas: addFeeBuffer(fees.maxPriorityFeePerGas),
      }),
    };
  }

  return { writeContract };
}
