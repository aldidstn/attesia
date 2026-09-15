"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";
import { privyAppId } from "@/lib/config";

function ConfigNeeded() {
  return <span className="badge" data-tone="pending">Auth setup needed</span>;
}

function PrivyWalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  if (!ready) return <button className="pill pill-quiet" disabled>Loading wallet…</button>;
  if (!authenticated) return <button className="pill pill-primary" onClick={login}>Sign in</button>;
  const address = user?.wallet?.address;
  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }
  return <div className="wallet-controls">
    {address && <button className="pill pill-secondary" onClick={copyAddress} aria-label={`Copy wallet address ${address}`}>
      {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : `${address.slice(0, 6)}…${address.slice(-4)}`}
    </button>}
    <button className="pill pill-quiet" onClick={logout}>Sign out</button>
    <span className="sr-only" role="status" aria-live="polite">{copyStatus === "copied" ? "Wallet address copied" : copyStatus === "failed" ? "Wallet address could not be copied" : ""}</span>
  </div>;
}

export function WalletButton() {
  return privyAppId() ? <PrivyWalletButton /> : <ConfigNeeded />;
}
