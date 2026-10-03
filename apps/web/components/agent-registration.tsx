"use client";
import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useRef, useState } from "react";
import { encodeFunctionData, type Hex } from "viem";
import { agentRegistration, identityRegistry, registeredAgentId, registrationAbi } from "@/lib/agent-registration";
import { advanceOperation, beginOperation, establishPrivySession, uploadPublicFile } from "@/lib/browser-wallet";
import { canonicalJson, metadataDigest } from "@/lib/integrity";
import { explorer } from "@/lib/chain";
import { publicClient } from "@/lib/onchain";
import { useAttestiaWrite } from "@/lib/use-attestia-write";

type Draft = { name: string; description: string; image: string; website: string; uri?: string; operationId?: string; hash?: Hex; agentId?: string; locked?: boolean };
const empty: Draft = { name: "", description: "", image: "", website: "" };

export function AgentRegistration() {
  const { wallets } = useWallets();
  return <RegistrationForm key={wallets[0]?.address.toLowerCase() ?? "anonymous"} />;
}

function RegistrationForm() {
  const { authenticated, login, getAccessToken } = usePrivy();
  const { wallets } = useWallets(); const wallet = wallets[0];
  const { writeContract } = useAttestiaWrite();
  const storageKey = `attestia:agent-registration:10143:${wallet?.address.toLowerCase() ?? "anonymous"}`;
  const [draft, setDraft] = useState<Draft>(empty);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [reviewed, setReviewed] = useState(false);
  const [status, setStatus] = useState(""), [error, setError] = useState("");
  const [recoveryHash, setRecoveryHash] = useState("");
  const running = useRef(false);
  useEffect(() => {
    try {
      const anonymousKey = "attestia:agent-registration:10143:anonymous";
      const saved = localStorage.getItem(storageKey) ?? localStorage.getItem(anonymousKey);
      if (saved && storageKey !== anonymousKey) { localStorage.setItem(storageKey, saved); localStorage.removeItem(anonymousKey); }
      // Hydrate the browser-only draft after mount; never put wallet data in server HTML.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setDraft(JSON.parse(saved));
      setReady(true);
    } catch { setError("Browser storage unavailable. Enable it to preserve transaction recovery."); }
  }, [storageKey]);
  function save(next: Draft) { localStorage.setItem(storageKey, JSON.stringify(next)); setDraft(next); }
  function edit(field: keyof typeof empty, value: string) { save({ ...draft, [field]: value, uri: undefined }); setReviewed(false); }
  async function session() {
    const token = await getAccessToken();
    if (!wallet || !authenticated || !token) throw new Error("Session expired. Sign in again; your draft is saved.");
    await establishPrivySession(token, wallet.address);
    return wallet;
  }
  async function confirm(current: Draft, hash: Hex) {
    if (!wallet || !current.uri) throw new Error("Restore the original wallet and metadata before checking this receipt.");
    setStatus("Waiting for Monad receipt. You can return here if indexing is delayed.");
    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 2, timeout: 60_000 });
    const agentId = registeredAgentId(receipt, wallet.address, current.uri);
    save({ ...current, hash, agentId, locked: true });
    setStatus(`Agent #${agentId} registered. Open its page to link an Attestia profile.`);
    if (current.operationId) {
      try { await advanceOperation(current.operationId, "finalized", hash); }
      catch { setStatus(`Agent #${agentId} confirmed onchain. Application status sync pending; your receipt is saved.`); }
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!authenticated) { login(); return; }
    if (running.current) return;
    running.current = true; setBusy(true); setError("");
    let current = draft, acquired = false;
    try {
      const signer = await session();
      if (current.hash) { await confirm(current, current.hash); return; }
      if (current.locked) throw new Error("Submission status unknown. Recover the transaction hash from wallet activity; do not register again.");
      if (!reviewed) throw new Error("Review the public metadata before registering.");
      const metadata = agentRegistration(current);
      if (await publicClient.getBalance({ address: signer.address as Hex }) === 0n) throw new Error("This wallet needs MON on Monad Testnet to pay gas. Fund the owner address shown below.");
      const operation = await beginOperation("register_agent", signer.address, metadataDigest(metadata));
      current = { ...current, operationId: operation.id };
      if (operation.transactionHash) {
        current = { ...current, hash: operation.transactionHash as Hex, locked: true }; save(current);
        await confirm(current, current.hash!); return;
      }
      if (operation.state !== "draft") { save({ ...current, locked: true }); throw new Error("Registration already started. Recover its transaction hash below."); }
      if (!current.uri) {
        setStatus("Publishing reviewed registration metadata to IPFS…");
        const upload = await uploadPublicFile(new File([canonicalJson(metadata)], "agent-registration.json", { type: "application/json" }));
        current = { ...current, uri: upload.uri }; save(current);
      }
      await publicClient.simulateContract({ address: identityRegistry, abi: registrationAbi, functionName: "register", args: [current.uri!], account: signer.address as Hex });
      await advanceOperation(operation.id, "awaiting_signature"); acquired = true;
      current = { ...current, locked: true }; save(current);
      setStatus("Approve registration in your wallet. Gas is paid in MON.");
      const { hash } = await writeContract({ wallet: signer, to: identityRegistry, data: encodeFunctionData({ abi: registrationAbi, functionName: "register", args: [current.uri!] }) });
      current = { ...current, hash }; save(current);
      await advanceOperation(operation.id, "submitted", hash);
      await confirm(current, hash);
    } catch (cause) {
      // Only explicit wallet rejection proves no transaction was broadcast.
      const rejected = (value: unknown): boolean => !!value && typeof value === "object" && (("code" in value && value.code === 4001) || ("cause" in value && rejected(value.cause)));
      if (acquired && !current.hash && rejected(cause)) {
        try { await advanceOperation(current.operationId!, "draft"); save({ ...current, locked: false }); } catch { /* Keep the intent locked if persistence is uncertain. */ }
      }
      setError(cause instanceof Error ? cause.message : "Registration failed. Your draft is saved."); setStatus("");
    } finally { running.current = false; setBusy(false); }
  }
  async function recover() {
    if (running.current) return;
    running.current = true; setBusy(true); setError("");
    try {
      await session();
      if (!/^0x[0-9a-fA-F]{64}$/.test(recoveryHash)) throw new Error("Enter a valid transaction hash.");
      await confirm(draft, recoveryHash as Hex);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Receipt unavailable. Retry later."); }
    finally { running.current = false; setBusy(false); }
  }
  return <section className="panel form-panel">
    <p className="eyebrow">ERC-8004 · Monad Testnet</p><h1 className="section-title">Register an agent</h1>
    <p className="lede">Create an agent identity owned by your connected wallet. This does not create or run an AI service. New identities are declared inactive.</p>
    <p className="muted">Privy sign-in · Gas paid in MON · Public metadata stored on IPFS</p>
    {wallet && <p className="operation-status">Owner: {wallet.address}</p>}
    <form className="stack composer-fields" onSubmit={submit}>
      <fieldset disabled={!ready || busy || !!draft.locked} className="stack" style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <legend className="eyebrow">Public registration metadata</legend>
        <label className="field"><span>Agent name</span><input id="agent-name" className="input" required maxLength={80} value={draft.name} onChange={(e) => edit("name", e.target.value)} /></label>
        <label className="field"><span>Description</span><textarea className="input" required maxLength={1000} value={draft.description} onChange={(e) => edit("description", e.target.value)} /></label>
        <label className="field"><span>Image URL (optional, HTTPS)</span><input className="input" type="url" value={draft.image} onChange={(e) => edit("image", e.target.value)} /></label>
        <label className="field"><span>Website URL (optional, HTTPS)</span><input className="input" type="url" value={draft.website} onChange={(e) => edit("website", e.target.value)} /></label>
        <p className="muted">Name, description and optional URLs become public. No credentials or private information. Registration is permanent; it does not certify quality or enforce policy.</p>
        <label><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} /> I reviewed this metadata and approve public publication.</label>
      </fieldset>
      {error && <p role="alert" className="operation-status">{error} <a href="#agent-name">Review registration</a></p>}
      {status && <p role="status" className="operation-status">{status}</p>}
      {!draft.agentId && <button className="pill pill-primary" disabled={!ready || busy || (authenticated && !draft.hash && (!!draft.locked || !reviewed))} formNoValidate={!authenticated}>{busy ? "Processing…" : !authenticated ? "Sign in with Privy" : draft.hash ? "Check registration receipt" : "Publish and register agent"}</button>}
      {draft.hash && <a className="text-link" href={explorer.transaction(draft.hash)} target="_blank" rel="noreferrer">View transaction on Monad Explorer</a>}
      {draft.agentId && <Link className="pill pill-primary" href={`/agents/${draft.agentId}`}>Open agent #{draft.agentId} and link profile</Link>}
    </form>
    {draft.locked && !draft.agentId && <div className="stack composer-fields"><p className="muted">Already approved, but no receipt? Paste the hash from wallet activity. This checks the existing transaction without sending another.</p><label className="field"><span>Registration transaction hash</span><input className="input" value={recoveryHash} onChange={(e) => setRecoveryHash(e.target.value)} /></label><button type="button" className="pill pill-secondary" disabled={busy} onClick={recover}>Recover registration</button></div>}
    <p className="muted">Already own an agent? <Link href="/agents">Inspect and link its ID</Link>.</p>
  </section>;
}
