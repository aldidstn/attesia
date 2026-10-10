# Phase 4 — Pilot hardening

Status: **4.1–4.5 implementation complete; production acceptance pending.** The application has workspace roles, reviewer membership, explicit private-evidence grants, Supabase private quarantine uploads, auditable short-lived access links, private export grants, and a workspace console. No private user data is provisioned by this repository.

| Part | Status | Exit evidence |
| --- | --- | --- |
| 4.1 Privacy model and threat controls | Complete | [Privacy model](PRIVACY-THREAT-MODEL.md), runnable document check |
| 4.2 Workspace roles and membership | Complete | Schema, migration, API boundary, membership console |
| 4.3 Private evidence storage | Complete | Supabase private quarantine boundary, basic scanner, 60-second signed URLs |
| 4.4 Evidence and reviewer workflow | Complete | Workspace UI, upload/scan, reviewer membership, read/export controls |
| 4.5 Projection, export, operations | Complete | Private listing API, no-store export endpoint, opaque audit trail; no public-indexer projection |

Private evidence is managed confidential storage, not end-to-end encrypted storage. Attestia service can process plaintext only after authenticated authorization. Public chain, public IPFS, public metadata, analytics, browser logs, and exports never contain private bytes, object keys, filenames, raw digests, or signed URLs.

Run `pnpm test:phase4:privacy` to validate required policy controls remain present.

## Production acceptance gate

Before enabling private evidence for pilot users, run a real workspace flow: create workspace, add a reviewer subject, upload a permitted text/Markdown/JSON file, scan it, verify owner read/export, then verify a reviewer without an explicit grant is denied. The API intentionally never issues a read link for `quarantine_pending` evidence. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PRIVATE_EVIDENCE_BUCKET`, and the signed URL TTL in the deployment environment; the service role key stays server-side.

The current free scanner is a fail-closed type/size check for the bounded pilot formats. A production malware/credential scanning service remains an external operational gate. Private records are deliberately not projected to Envio or exposed through public APIs.
