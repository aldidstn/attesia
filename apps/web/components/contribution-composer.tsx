"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, UploadSimple } from "@phosphor-icons/react";
import { contributionTypes } from "@/lib/schemas";
import { canonicalJson, metadataDigest, sha256, validatePublicUrl, validateTextArtifact } from "@/lib/integrity";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { encodeAbiParameters, encodeFunctionData, keccak256, stringToHex } from "viem";
import { advanceOperation, beginOperation, establishPrivySession, uploadPublicFile } from "@/lib/browser-wallet";
import { contracts } from "@/lib/contracts.generated";
import { privyAppId } from "@/lib/config";
import { publicClient } from "@/lib/onchain";
import { track } from "@/lib/analytics";
import { useAttestiaWrite } from "@/lib/use-attestia-write";

type Draft = { title: string; summary: string; type: (typeof contributionTypes)[number]; creatorProfileId: string; parentId: string; createdAt: string; aiUsed: boolean; tools: string; collaborators: string; sources: string; fileName?: string; artifactDigest?: string };
const blank: Draft = { title: "", summary: "", type: "pull_request", creatorProfileId: "", parentId: "", createdAt: "", aiUsed: false, tools: "", collaborators: "", sources: "" };
const key = "attestia:contribution-draft";

function PublishButton({ draft, file, metadata }: { draft: Draft; file?: File; metadata: Record<string, unknown> }) {
  const { authenticated, login, getAccessToken } = usePrivy(); const { wallets } = useWallets(); const [status, setStatus] = useState("");
  const { writeContract } = useAttestiaWrite();
  async function publish() {
    if (!authenticated) { login(); return; }
    try {
      if (!file) throw new Error("Re-select the artifact file after a reload");
      if (!/^0x[0-9a-fA-F]{64}$/.test(draft.creatorProfileId)) throw new Error("Creator profile ID must be bytes32");
      const wallet = wallets[0]; if (!wallet) throw new Error("No EVM wallet is available"); const token = await getAccessToken(); if (!token) throw new Error("Session expired; your draft is safe");
      setStatus("Creating application session…"); await establishPrivySession(token, wallet.address);
      draft.sources.split("\n").map((url) => url.trim()).filter(Boolean).forEach(validatePublicUrl);
      setStatus("Uploading reviewed artifact…"); const artifact = await uploadPublicFile(file, draft.artifactDigest);
      const finalMetadata = { ...metadata, artifact: { byteLength: file.size, fileName: file.name, mediaType: file.type, sha256: artifact.artifactDigest, uri: artifact.uri } };
      setStatus("Uploading canonical metadata…"); const metadataUpload = await uploadPublicFile(new File([canonicalJson(finalMetadata)], "contribution.json", { type: "application/json" }));
      const digest = metadataDigest(finalMetadata); const recordKey = keccak256(encodeAbiParameters([{ type: "bytes32" }, { type: "bytes32" }, { type: "bytes32" }], [draft.creatorProfileId as `0x${string}`, artifact.artifactDigest, digest]));
      const duplicate = await publicClient.readContract({ ...contracts.ContributionRegistry, functionName: "contributionByRecordKey", args: [recordKey] });
      if (duplicate !== `0x${"0".repeat(64)}`) throw new Error(`Exact duplicate already exists: ${duplicate}`);
      const id = recordKey; const parent = draft.parentId || `0x${"0".repeat(64)}`; const operation = await beginOperation("register_contribution", wallet.address, digest, id); if (operation.transactionHash) { setStatus(`Already submitted ${operation.transactionHash}`); return; }
      await advanceOperation(operation.id, "awaiting_signature"); setStatus("Awaiting signature…");
      const data = encodeFunctionData({ ...contracts.ContributionRegistry, functionName: "registerContribution", args: [id, draft.creatorProfileId as `0x${string}`, artifact.artifactDigest, digest, metadataUpload.uri, parent as `0x${string}`] });
      const { hash } = await writeContract({ wallet, to: contracts.ContributionRegistry.address, data });
      await advanceOperation(operation.id, "submitted", hash); track("activation", { contributionType: draft.type }); localStorage.removeItem(key); setStatus(`Submitted ${hash}. Waiting for finality and indexing.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Publication failed"); }
  }
  return <><span className="badge">Monad Testnet · wallet pays MON gas</span><button type="button" className="pill pill-primary" onClick={publish}>{authenticated ? "Publish on Monad" : "Sign in to publish"}</button>{status && <p className="operation-status" role="status">{status}</p>}</>;
}

export function ContributionComposer() {
  const [step, setStep] = useState(1); const [draft, setDraft] = useState<Draft>(blank); const [file, setFile] = useState<File>(); const [error, setError] = useState(""); const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem(key);
    // Draft recovery must happen after hydration because localStorage is browser-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(saved ? JSON.parse(saved) : { ...blank, createdAt: new Date().toISOString() }); setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(key, JSON.stringify(draft)); }, [draft, hydrated]);
  const update = <K extends keyof Draft>(field: K, value: Draft[K]) => setDraft((current) => ({ ...current, [field]: value }));
  async function selectFile(file?: File) {
    if (!file) return; try { const bytes = new Uint8Array(await file.arrayBuffer()); validateTextArtifact(file, bytes); setFile(file); update("fileName", file.name); update("artifactDigest", await sha256(bytes)); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "File rejected"); }
  }
  function next() {
    if (step === 1 && (draft.title.trim().length < 3 || draft.summary.trim().length < 10 || !/^0x[0-9a-fA-F]{64}$/.test(draft.creatorProfileId))) { setError("Add a title, a summary of at least 10 characters, and a bytes32 creator profile ID."); return; }
    if (step === 2 && !draft.artifactDigest) { setError("Add a public text, Markdown, or JSON artifact."); return; }
    setError(""); setStep((value) => Math.min(4, value + 1));
  }
  const metadata = { schema: "attestia.contribution.v1", title: draft.title, summary: draft.summary, type: draft.type, visibility: "public", creatorProfileId: draft.creatorProfileId, workspaceId: keccak256(stringToHex("attestia:public")), createdAt: draft.createdAt, artifact: null, provenance: { schema: "attestia.provenance.v1", disclosureVersion: 1, aiAssistance: draft.aiUsed ? "assistive" : "none", tools: draft.tools.split(",").map((v) => v.trim()).filter(Boolean), humanInput: draft.aiUsed ? "Creator reviewed and accepted disclosed AI-assisted output." : "Creator declares the work was completed without AI assistance.", sources: draft.sources.split("\n").map((url) => url.trim()).filter(Boolean).map((url) => ({ title: url, url, accessedAt: draft.createdAt, digest: null, digestAlgorithm: null })) }, collaborators: draft.collaborators.split(",").map((v) => v.trim()).filter(Boolean).map((profileId) => ({ profileId, wallet: null, role: "collaborator", relationship: "claimed", shareBasisPoints: null })), revision: { parentId: draft.parentId || null, notes: draft.parentId ? "Metadata or artifact revision." : "Initial version." } };
  return <div className="composer-layout">
    <aside className="stepper" aria-label="Contribution steps">{["Describe", "Evidence", "Provenance", "Review"].map((label, index) => <button key={label} className="step" aria-current={step === index + 1 ? "step" : undefined} onClick={() => index + 1 < step && setStep(index + 1)}><span>{index + 1 < step ? <Check /> : index + 1}</span>{label}</button>)}</aside>
    <section className="panel composer-panel">
      <p className="eyebrow">Step {step} of 4 · Draft saved on this device</p>
      <h1 className="section-title">{["Describe the contribution", "Attach public evidence", "Disclose provenance", "Review before publishing"][step - 1]}</h1>
      {error && <div className="error-summary" role="alert" tabIndex={-1}><h2>Fix this before continuing</h2><a href="#composer-fields">{error}</a></div>}
      <fieldset id="composer-fields" className="stack composer-fields" disabled={!hydrated} aria-busy={!hydrated}>
        {step === 1 && <><div className="field"><label htmlFor="title">Title</label><input id="title" className="input" value={draft.title} onChange={(e) => update("title", e.target.value)} maxLength={120} /></div><div className="field"><label htmlFor="summary">What changed and why?</label><textarea id="summary" className="input" value={draft.summary} onChange={(e) => update("summary", e.target.value)} maxLength={1200} /></div><div className="field"><label htmlFor="type">Contribution type</label><select id="type" className="input" value={draft.type} onChange={(e) => update("type", e.target.value as Draft["type"])}>{contributionTypes.map((type) => <option key={type}>{type.replaceAll("_", " ")}</option>)}</select></div><div className="field"><label htmlFor="creator">Creator profile ID</label><input id="creator" className="input" value={draft.creatorProfileId} onChange={(e) => update("creatorProfileId", e.target.value)} placeholder="0x…" /></div><div className="field"><label htmlFor="parent">Revision parent ID (optional)</label><input id="parent" className="input" value={draft.parentId} onChange={(e) => update("parentId", e.target.value)} placeholder="0x…" /></div></>}
        {step === 2 && <><label className="upload-zone"><UploadSimple size={28} /><b>{draft.fileName ?? "Choose a text, Markdown, or JSON file"}</b><span>Public forever · 4 MB maximum</span><input className="sr-only" type="file" accept="text/plain,text/markdown,application/json,.md" onChange={(e) => selectFile(e.target.files?.[0])} /></label>{draft.artifactDigest && <code className="digest">SHA-256 {draft.artifactDigest}</code>}<div className="field"><label htmlFor="sources">HTTPS source links, one per line</label><textarea id="sources" className="input" value={draft.sources} onChange={(e) => update("sources", e.target.value)} placeholder="https://github.com/org/repo/pull/42" /></div></>}
        {step === 3 && <><label className="check-row"><input type="checkbox" checked={draft.aiUsed} onChange={(e) => update("aiUsed", e.target.checked)} /> AI tools helped create this contribution</label>{draft.aiUsed && <div className="field"><label htmlFor="tools">Tools, comma separated</label><input id="tools" className="input" value={draft.tools} onChange={(e) => update("tools", e.target.value)} /></div>}<div className="field"><label htmlFor="collaborators">Collaborators, comma separated</label><input id="collaborators" className="input" value={draft.collaborators} onChange={(e) => update("collaborators", e.target.value)} /></div></>}
        {step === 4 && <><div className="publication-warning"><b>This metadata and evidence will be public.</b><p>Confirm it contains no private files, credentials, sensitive prompts, personal data, or restricted material.</p></div><dl className="review-list"><div><dt>Title</dt><dd>{draft.title}</dd></div><div><dt>Type</dt><dd>{draft.type}</dd></div><div><dt>Evidence</dt><dd>{draft.fileName}</dd></div><div><dt>Metadata preview digest</dt><dd className="data">{metadataDigest(metadata)}</dd></div></dl>{privyAppId() ? <PublishButton draft={draft} file={file} metadata={metadata} /> : <span className="badge" data-tone="pending">Privy configuration required to publish</span>}<p className="muted form-note">Your draft remains on this device if signing is rejected, expires, or the wallet changes.</p></>}
      </fieldset>
      <div className="composer-actions">{step > 1 && <button className="pill pill-quiet" onClick={() => setStep(step - 1)}><ArrowLeft /> Back</button>}{step < 4 && <button className="pill pill-primary" onClick={next}>Continue <ArrowRight /></button>}</div>
    </section>
  </div>;
}
