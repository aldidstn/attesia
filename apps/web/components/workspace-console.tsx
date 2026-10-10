"use client";

import { useEffect, useRef, useState } from "react";

type Workspace = { slug: string; name: string; description: string | null; role: string; status: string };
type Evidence = { id: string; classification: string; state: string; scanResult: string | null; scanVersion: string | null; createdAt: string };
type Member = { id: string; subject: string; role: string; status: string };
type ApiError = { error?: { message?: string } };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const body = await response.json() as T & ApiError;
  if (!response.ok) throw new Error(body.error?.message ?? "Request failed");
  return body;
}

export function WorkspaceConsole() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]), [selected, setSelected] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]), [members, setMembers] = useState<Member[]>([]);
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const createForm = useRef<HTMLFormElement>(null), uploadForm = useRef<HTMLFormElement>(null), memberForm = useRef<HTMLFormElement>(null), grantForm = useRef<HTMLFormElement>(null);
  const workspace = workspaces.find((item) => item.slug === selected);
  async function loadWorkspaces() {
    try { const result = await api<{ data: Workspace[] }>("/api/workspaces"); setWorkspaces(result.data); setSelected((current) => current || result.data[0]?.slug || ""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not load workspaces"); }
  }
  async function loadWorkspaceData(slug: string) {
    if (!slug) return;
    try {
      const [privateEvidence, workspaceMembers] = await Promise.all([
        api<{ data: Evidence[] }>(`/api/private-evidence?workspaceSlug=${encodeURIComponent(slug)}`),
        api<{ data: Member[] }>(`/api/workspaces/${encodeURIComponent(slug)}/members`).catch(() => ({ data: [] as Member[] })),
      ]);
      setEvidence(privateEvidence.data); setMembers(workspaceMembers.data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load workspace data"); }
  }
  useEffect(() => { void loadWorkspaces(); }, []);
  useEffect(() => { void loadWorkspaceData(selected); }, [selected]);
  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setMessage("");
    try { const created = await api<Workspace>("/api/workspaces", { method: "POST", body: JSON.stringify({ slug: form.get("slug"), name: form.get("name"), description: form.get("description") }) }); await loadWorkspaces(); setSelected(created.slug); createForm.current?.reset(); setMessage("Workspace created."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Workspace creation failed"); } finally { setBusy(false); }
  }
  async function submitUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const file = form.get("file"); if (!(file instanceof File) || !selected) return;
    setBusy(true); setMessage("");
    try {
      const intent = await api<{ id: string; uploadUrl: string; contentType: string }>("/api/private-evidence/upload-intents", { method: "POST", body: JSON.stringify({ workspaceSlug: selected, classification: form.get("classification"), contentType: file.type || "application/octet-stream", size: file.size }) });
      const upload = await fetch(intent.uploadUrl, { method: "PUT", headers: { "content-type": intent.contentType }, body: file }); if (!upload.ok) throw new Error("Private upload failed");
      await api(`/api/private-evidence/${intent.id}/scan`, { method: "POST", body: "{}" }); await loadWorkspaceData(selected); uploadForm.current?.reset(); setMessage("Evidence uploaded, scanned, and placed in the private vault.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Private upload failed"); } finally { setBusy(false); }
  }
  async function submitMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return; const form = new FormData(event.currentTarget); setBusy(true); setMessage("");
    try { await api(`/api/workspaces/${encodeURIComponent(selected)}/members`, { method: "POST", body: JSON.stringify({ subject: form.get("subject"), role: form.get("role") }) }); await loadWorkspaceData(selected); memberForm.current?.reset(); setMessage("Member access updated."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Member update failed"); } finally { setBusy(false); }
  }
  async function submitGrant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const evidenceId = String(form.get("evidenceId") ?? ""); if (!evidenceId) return;
    setBusy(true); setMessage("");
    try { await api(`/api/private-evidence/${evidenceId}/grants`, { method: "POST", body: JSON.stringify({ subject: form.get("subject"), permission: form.get("permission"), action: form.get("action") }) }); grantForm.current?.reset(); setMessage("Evidence grant updated. New access links are checked against this change immediately."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Evidence grant update failed"); } finally { setBusy(false); }
  }
  async function openEvidence(item: Evidence, exportFile = false) {
    try { const result = await api<{ accessUrl: string }>(`/api/private-evidence/${item.id}/${exportFile ? "export" : "access"}`); window.open(result.accessUrl, "_blank", "noopener,noreferrer"); setMessage(exportFile ? "A short-lived export link was issued." : "A short-lived read link was issued."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Evidence access failed"); }
  }
  return <div className="workspace-layout">
    <section className="panel form-panel"><p className="eyebrow">Private collaboration</p><h1 className="section-title">Workspaces</h1><p className="lede">Private files remain outside public records, IPFS, analytics, and reputation scoring.</p>
      <form className="stack composer-fields" ref={createForm} onSubmit={submitCreate}><div className="grid-2"><div className="field"><label htmlFor="workspace-name">Name</label><input className="input" id="workspace-name" name="name" required minLength={2} maxLength={100} /></div><div className="field"><label htmlFor="workspace-slug">Slug</label><input className="input" id="workspace-slug" name="slug" required pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]" placeholder="pilot-review" /></div></div><div className="field"><label htmlFor="workspace-description">Description</label><textarea className="input" id="workspace-description" name="description" maxLength={500} /></div><button className="pill pill-primary" disabled={busy}>Create workspace</button></form>
    </section>
    <section className="panel form-panel"><div className="section-heading"><div><p className="eyebrow">Access boundary</p><h2 className="section-title">Workspace evidence</h2></div>{workspace && <span className="badge" data-tone="active">{workspace.role}</span>}</div>
      <div className="field"><label htmlFor="workspace-select">Workspace</label><select className="input" id="workspace-select" value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Select a workspace</option>{workspaces.map((item) => <option key={item.slug} value={item.slug}>{item.name} · {item.slug}</option>)}</select></div>
      {selected && <><form className="stack composer-fields" ref={uploadForm} onSubmit={submitUpload}><div className="grid-2"><div className="field"><label htmlFor="evidence-file">Private file</label><input className="input" id="evidence-file" name="file" type="file" required accept="text/plain,application/json,text/markdown" /></div><div className="field"><label htmlFor="classification">Classification</label><select className="input" id="classification" name="classification" defaultValue="confidential"><option value="confidential">Confidential</option><option value="restricted">Restricted</option></select></div></div><p className="form-note muted">Maximum 10 MB. Uploads enter quarantine, are checked, then become available in the private vault. This service uses managed encryption, not end-to-end encryption.</p><button className="pill pill-primary" disabled={busy}>Upload and scan</button></form>
      <div className="workspace-records" aria-live="polite">{evidence.length ? evidence.map((item) => <article className="panel-soft workspace-record" key={item.id}><div><span className="badge" data-tone={item.state === "available" ? "active" : "pending"}>{item.state}</span><p className="data">{item.id}</p><p className="muted">{item.classification} · {item.scanResult ?? "waiting for scan"}</p></div><div className="cluster"><button className="pill pill-secondary" onClick={() => void openEvidence(item)}>Read</button><button className="pill pill-quiet" onClick={() => void openEvidence(item, true)}>Export</button></div></article>) : <p className="muted">No private evidence in this workspace yet.</p>}</div>
      {(workspace?.role === "owner" || workspace?.role === "admin") && evidence.length > 0 && <form className="cluster composer-fields" ref={grantForm} onSubmit={submitGrant}><div className="field grow"><label htmlFor="grant-evidence">Evidence</label><select className="input" id="grant-evidence" name="evidenceId" required>{evidence.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select></div><div className="field grow"><label htmlFor="grant-subject">Account subject</label><input className="input" id="grant-subject" name="subject" required /></div><div className="field"><label htmlFor="grant-permission">Scope</label><select className="input" id="grant-permission" name="permission"><option value="read">Read</option><option value="export">Export</option></select></div><div className="field"><label htmlFor="grant-action">Action</label><select className="input" id="grant-action" name="action"><option value="grant">Grant</option><option value="revoke">Revoke</option></select></div><button className="pill pill-secondary align-end" disabled={busy}>Update evidence access</button></form>}</>}
    </section>
    {selected && (workspace?.role === "owner" || workspace?.role === "admin") && <section className="panel form-panel"><p className="eyebrow">Review access</p><h2 className="section-title">Members</h2><p className="form-note muted">Use an Attestia account subject, never a wallet address. Workspace membership alone does not grant private-file access.</p><form className="cluster composer-fields" ref={memberForm} onSubmit={submitMember}><div className="field grow"><label htmlFor="member-subject">Account subject</label><input className="input" id="member-subject" name="subject" required /></div><div className="field"><label htmlFor="member-role">Role</label><select className="input" id="member-role" name="role" defaultValue="reviewer"><option value="admin">Admin</option><option value="reviewer">Reviewer</option><option value="contributor">Contributor</option><option value="viewer">Viewer</option></select></div><button className="pill pill-primary align-end" disabled={busy}>Save member</button></form><div className="workspace-records">{members.map((member) => <div className="workspace-record panel-soft" key={member.id}><span className="data">{member.subject}</span><span className="badge">{member.role}</span><span className="muted">{member.status}</span></div>)}</div></section>}
    {message && <p className="operation-status" role="status">{message}</p>}
  </div>;
}
