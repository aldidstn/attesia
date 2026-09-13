"use client";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { keccak256, stringToHex } from "viem";
import { advanceOperation, beginOperation, establishPrivySession, monadWallet, uploadPublicFile } from "@/lib/browser-wallet";
import { contracts } from "@/lib/contracts.generated";
import { canonicalJson, metadataDigest } from "@/lib/integrity";
import { publicClient } from "@/lib/onchain";

function ProfileForm() {
  const { authenticated, login, getAccessToken } = usePrivy(); const { wallets } = useWallets();
  const [name, setName] = useState(""); const [bio, setBio] = useState(""); const [skills, setSkills] = useState(""); const [status, setStatus] = useState("");
  useEffect(() => { const saved = localStorage.getItem("attestia:profile-draft"); if (saved) { const value = JSON.parse(saved);
    // Profile recovery must happen after hydration because localStorage is browser-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(value.name ?? ""); setBio(value.bio ?? ""); setSkills(value.skills ?? ""); } }, []);
  useEffect(() => { localStorage.setItem("attestia:profile-draft", JSON.stringify({ name, bio, skills })); }, [name, bio, skills]);
  async function publish(event: React.FormEvent) {
    event.preventDefault(); if (!authenticated) { login(); return; }
    try {
      const wallet = wallets[0]; if (!wallet) throw new Error("No EVM wallet is available"); setStatus("Creating secure session…");
      const token = await getAccessToken(); if (!token) throw new Error("Privy session expired. Sign in again; your draft is safe.");
      await establishPrivySession(token, wallet.address);
      const metadata = { schema: "attestia.profile.v1", type: "human", displayName: name, bio, role: "Contributor", skills: skills.split(",").map((v) => v.trim()).filter(Boolean), communities: [], agentLink: null };
      const canonical = canonicalJson(metadata); setStatus("Publishing reviewed metadata…");
      const uploaded = await uploadPublicFile(new File([canonical], "profile.json", { type: "application/json" }));
      const id = keccak256(stringToHex(`attestia:profile:${wallet.address.toLowerCase()}`)); const digest = metadataDigest(metadata);
      const exists = await publicClient.readContract({ ...contracts.AttestiaProfileRegistry, functionName: "profileExists", args: [id] });
      const operation = await beginOperation(exists ? "update_profile" : "create_profile", wallet.address, digest, id); if (operation.transactionHash) { setStatus(`Already submitted ${operation.transactionHash}`); return; }
      await advanceOperation(operation.id, "awaiting_signature"); setStatus("Awaiting signature…"); const client = await monadWallet(await wallet.getEthereumProvider(), wallet.address as `0x${string}`);
      const hash = exists
        ? await client.writeContract({ ...contracts.AttestiaProfileRegistry, functionName: "updateProfile", args: [id, uploaded.uri, digest] })
        : await client.writeContract({ ...contracts.AttestiaProfileRegistry, functionName: "createProfile", args: [id, uploaded.uri, digest] });
      await advanceOperation(operation.id, "submitted", hash); localStorage.removeItem("attestia:profile-draft"); setStatus(`${exists ? "Update" : "Profile"} submitted ${hash}`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Profile creation failed"); }
  }
  return <form className="panel form-panel" onSubmit={publish}><p className="eyebrow">Human profile · Public metadata</p><h1 className="section-title">Create or update your profile</h1><p className="lede">Your wallet has one deterministic profile ID. Saving creates it the first time and updates it thereafter.</p><div className="stack composer-fields"><div className="field"><label htmlFor="name">Display name</label><input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required /></div><div className="field"><label htmlFor="bio">Bio</label><textarea id="bio" className="input" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} /></div><div className="field"><label htmlFor="skills">Skills, comma separated</label><input id="skills" className="input" value={skills} onChange={(e) => setSkills(e.target.value)} /></div><div className="publication-warning"><b>Publication is permanent.</b><p>Only include information you want anyone to read.</p></div><button className="pill pill-primary">{authenticated ? "Save profile" : "Sign in to continue"}</button>{status && <p className="operation-status" role="status">{status}</p>}</div></form>;
}
export function ProfileOnboarding() { return process.env.NEXT_PUBLIC_PRIVY_APP_ID ? <ProfileForm /> : <section className="panel form-panel"><span className="badge" data-tone="pending">Configuration needed</span><h1 className="section-title">Connect Privy to create profiles</h1><p className="lede">Set the public App ID and server verification key. Read-only verification remains available.</p></section>; }
