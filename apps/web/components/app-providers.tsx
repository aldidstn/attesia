"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { monadTestnet } from "@/lib/chain";

const wagmiConfig = createConfig({ chains: [monadTestnet], transports: { [monadTestnet.id]: http() } });

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const content = <WagmiProvider config={wagmiConfig}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></WagmiProvider>;

  if (!appId) return content;
  return <PrivyProvider appId={appId} config={{ loginMethods: ["email", "wallet"], defaultChain: monadTestnet, supportedChains: [monadTestnet], embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } } }}>{content}</PrivyProvider>;
}
