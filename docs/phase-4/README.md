# Phase 4 — Pilot hardening

Status: **4.1 complete; 4.2 and 4.3 implementation-ready.** The application now has workspace roles, explicit private-evidence grants, Supabase private quarantine uploads, and auditable short-lived access links. No bucket, scanner, workspace, or private user data is provisioned by this repository.

| Part | Status | Exit evidence |
| --- | --- | --- |
| 4.1 Privacy model and threat controls | Complete | [Privacy model](PRIVACY-THREAT-MODEL.md), runnable document check |
| 4.2 Workspace roles and membership | Implementation-ready | Schema, migration, API boundary, authorization tests |
| 4.3 Private evidence storage | Implementation-ready | Supabase private quarantine boundary, 60-second signed URLs |
| 4.4 Evidence and reviewer workflow | Planned | UI, access/revocation acceptance |
| 4.5 Projection, export, operations | Planned | Indexer/API, backup/rollback evidence |

Private evidence is managed confidential storage, not end-to-end encrypted storage. Attestia service can process plaintext only after authenticated authorization. Public chain, public IPFS, public metadata, analytics, browser logs, and exports never contain private bytes, object keys, filenames, raw digests, or signed URLs.

Run `pnpm test:phase4:privacy` to validate required policy controls remain present.

## Provisioning gate

Before enabling the endpoints in a deployment, create a private Supabase Storage bucket and a scanner that promotes only clean files from `quarantine/` to `vault/`. The API intentionally never issues a read link for `quarantine_pending` evidence. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PRIVATE_EVIDENCE_BUCKET`, and the signed URL TTL in the deployment environment; the service role key stays server-side.
