import { createWalletClient, custom } from "viem";
import { monadTestnet } from "./chain";

export async function monadWallet(provider: unknown, address: `0x${string}`) {
  const evm = provider as { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
  let current = await evm.request({ method: "eth_chainId" });
  if (current !== "0x279f") { await evm.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x279f" }] }); current = await evm.request({ method: "eth_chainId" }); }
  if (current !== "0x279f") throw new Error("Monad Testnet (10143) is required");
  return createWalletClient({ account: address, chain: monadTestnet, transport: custom(evm) });
}

export async function establishPrivySession(accessToken: string, wallet?: string) {
  const response = await fetch("/api/auth/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accessToken, wallet }) });
  if (!response.ok) throw new Error((await response.json()).error?.message ?? "Application session failed");
}

export async function uploadPublicFile(file: File, expectedDigest?: string) {
  const form = new FormData(); form.set("file", file); if (expectedDigest) form.set("expectedDigest", expectedDigest);
  const response = await fetch("/api/artifacts", { method: "POST", body: form }); const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? "Upload failed"); return body as { cid: string; uri: string; artifactDigest: `0x${string}` };
}

export async function beginOperation(kind: string, wallet: string, payloadDigest: string, recordId?: string) {
  const response = await fetch("/api/operations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, wallet, payloadDigest, recordId }) }); const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? "Could not persist transaction intent"); return body as { id: string; state: string; transactionHash?: string };
}
export async function advanceOperation(id: string, state: string, transactionHash?: string) {
  const response = await fetch("/api/operations", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, state, transactionHash }) }); const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? "Could not persist transaction state"); return body;
}
