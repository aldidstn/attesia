"use client";

import { useSendTransaction, type ConnectedWallet } from "@privy-io/react-auth";
import type { Hex } from "viem";
import { monadWallet } from "./browser-wallet";
import { monadTestnet } from "./chain";
import { contracts } from "./contracts.generated";
import { canOfferSelfPay } from "./sponsorship";

type SponsorshipKind = "create_profile" | "register_contribution" | "create_attestation" | "revoke_attestation";
const sponsoredTargets: Record<SponsorshipKind, string> = {
  create_profile: contracts.AttestiaProfileRegistry.address,
  register_contribution: contracts.ContributionRegistry.address,
  create_attestation: contracts.AttestationRegistry.address,
  revoke_attestation: contracts.AttestationRegistry.address,
};

export function useAttestiaWrite() {
  const { sendTransaction } = useSendTransaction();
  const sponsorshipEnabled = process.env.NEXT_PUBLIC_SPONSORSHIP_ENABLED === "true";

  async function writeContract({ wallet, to, data, sponsorshipKind }: { wallet: ConnectedWallet; to: `0x${string}`; data: Hex; sponsorshipKind?: SponsorshipKind }) {
    await wallet.switchChain(monadTestnet.id);
    const canSponsor = sponsorshipEnabled && sponsorshipKind && sponsoredTargets[sponsorshipKind].toLowerCase() === to.toLowerCase();
    if (canSponsor) {
      try {
        const result = await sendTransaction({ to, data }, { address: wallet.address, sponsor: true });
        return { hash: result.hash, sponsored: true };
      } catch (error) {
        if (!canOfferSelfPay(error)) throw error;
        const accepted = window.confirm("Gas sponsorship is unavailable. Continue with a self-paid Monad Testnet transaction?");
        if (!accepted) throw new Error("Transaction not sent. Your draft is safe.");
      }
    }
    const client = await monadWallet(await wallet.getEthereumProvider(), wallet.address as `0x${string}`);
    return { hash: await client.sendTransaction({ to, data }), sponsored: false };
  }

  return { writeContract, sponsorshipEnabled };
}
