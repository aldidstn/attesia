"use client";

import { usePrivy } from "@privy-io/react-auth";
import { privyAppId } from "@/lib/config";

function ConfigNeeded() {
  return <span className="badge" data-tone="pending">Auth setup needed</span>;
}

function PrivyWalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  if (!ready) return <button className="pill pill-quiet" disabled>Loading wallet…</button>;
  if (!authenticated) return <button className="pill pill-primary" onClick={login}>Sign in</button>;
  const address = user?.wallet?.address;
  return <button className="pill pill-secondary" onClick={logout}>{address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Sign out"}</button>;
}

export function WalletButton() {
  return privyAppId() ? <PrivyWalletButton /> : <ConfigNeeded />;
}
