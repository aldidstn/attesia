"use client";

import type { ConnectedWallet } from "@privy-io/react-auth";
import type { Hex } from "viem";
import { monadWallet } from "./browser-wallet";
import { monadTestnet } from "./chain";

export function useAttestiaWrite() {
  async function writeContract({ wallet, to, data }: { wallet: ConnectedWallet; to: `0x${string}`; data: Hex }) {
    await wallet.switchChain(monadTestnet.id);
    const client = await monadWallet(await wallet.getEthereumProvider(), wallet.address as `0x${string}`);
    return { hash: await client.sendTransaction({ to, data }) };
  }

  return { writeContract };
}
