# Phase 4.1 — Private evidence privacy model and threat controls

Status: implementation-ready engineering policy. It is not legal advice, a privacy notice, or proof of compliance. Applies to Monad Testnet pilot only; mainnet and production data require separate approval.

## Decision record

| Decision | Chosen design | Reason |
| --- | --- | --- |
| Trust model | Managed confidential storage | Privy wallets do not provide portable encryption keys. KMS + server ACL ships without inventing wallet-key recovery. |
| Storage | Private object bucket, Block Public Access, SSE-KMS | No public IPFS, CDN, bucket listing, or public object ACL. |
| Read path | App authorizes each request, then issues one-object signed URL | Storage never decides membership; URL TTL is at most 60 seconds. |
| Upload path | Quarantine object → scan/classify → vault copy | No evidence becomes readable until scan and policy checks pass. |
| Integrity | Private SHA-256 plus random per-object salt, encrypted in application DB | Raw digest never appears onchain/public metadata because low-entropy files are guessable. |
| Public envelope | Optional `private_evidence_present` boolean only | No URI, CID, object key, filename, MIME type, size, raw digest, prompt, or access state. |
| Encryption claim | Encryption at rest and in transit; not end-to-end encrypted | KMS/service boundary must be stated plainly in UI, exports, and terms. |

Do not add browser-side or wallet-derived encryption keys in Phase 4. That changes recovery, revocation, device migration, and incident scope. It requires separate cryptographic design and review.

## Data classes and allowed locations

| Class | Examples | Allowed location | Forbidden location |
| --- | --- | --- | --- |
| Public evidence | Reviewed public artifact, public provenance | Pinata/IPFS, public metadata, chain digest | Private vault required only if contributor selects private evidence |
| Private evidence bytes | Client document, private prompt, contract, unredacted export | Quarantine/vault private bucket | Chain, public IPFS, public metadata, analytics, error logs, URL query strings |
| Private evidence descriptors | Filename, MIME, size, salted digest, storage version | Restricted PostgreSQL and audit event with opaque evidence ID | Chain, public API, public export, browser telemetry |
| Access state | Workspace/evidence ID, actor internal ID, action, outcome, timestamp | Restricted PostgreSQL audit log | Public projection or reputation input |
| Credentials and keys | KMS key ID, storage credentials, signed URL | Server secret manager or KMS | Browser bundle, database fields, logs, chain, IPFS |

Private evidence never changes public reputation counts, public feed ranking, or anonymous verification output. A public contribution remains valid when private evidence is deleted or becomes unavailable; UI shows private evidence unavailable without claiming it was verified.

## Minimal entities

`workspace`: opaque ID, public slug/profile, status, owner subject, retention policy version.

`membership`: workspace ID, member subject, role (`owner`, `admin`, `reviewer`, `contributor`, `viewer`), active interval, grant/revoke actor, audit sequence.

`private_evidence`: opaque evidence ID, workspace ID, contributor subject, optional contribution ID, classification enum, quarantine/vault state, encrypted storage locator, encrypted filename/MIME/size/salted SHA-256, scan result/version, retention deadline, delete/purge timestamps.

`evidence_access_grant`: evidence ID, subject, scope (`read`, `export`), active interval, grant/revoke actor, reason. Workspace role alone grants no private read; explicit evidence grant is required.

`access_audit`: opaque evidence ID, actor internal ID, action, result, policy version, request correlation ID, timestamp. Never store signed URL, plaintext name, bytes, digest, wallet, or request body.

Database constraints: one active membership per `(workspace_id, subject)`; one active grant per `(evidence_id, subject, scope)`; monotonic audit sequence per evidence; all mutations transactionally append audit event. Subject IDs are first-party opaque identifiers, never wallet-address hashes.

## Authorization and storage flow

```mermaid
sequenceDiagram
  participant U as Signed-in member
  participant A as Attestia API
  participant D as Postgres ACL/audit
  participant Q as Private quarantine
  participant S as Scanner
  participant V as KMS vault

  U->>A: upload private evidence
  A->>D: verify active membership + write intent
  A-->>U: one-object quarantine upload URL
  U->>Q: encrypted-in-transit upload
  A->>S: scan and classify quarantine object
  S->>V: copy approved object with SSE-KMS
  A->>D: persist evidence + audit; delete quarantine source
  U->>A: request private read
  A->>D: verify membership, explicit grant, evidence state
  A-->>U: no-store single-object URL, TTL <= 60 seconds
```

Every read, export, grant, revoke, deletion, and scan-state change re-evaluates authorization on server. Client-provided workspace ID, role, evidence ID, object key, filename, or MIME type is untrusted input. Storage object keys use random UUIDs; never derive from workspace, user, contribution, or filename.

Revoking membership or grant blocks future URLs immediately. An already-issued URL can work only until expiry, maximum 60 seconds. No cache-control exception: read responses use `Cache-Control: private, no-store` and `Referrer-Policy: no-referrer`.

## Retention and deletion

| State | Rule |
| --- | --- |
| Quarantine rejected/failed scan | Delete within 24 hours; retain minimal failure category only. |
| User-requested deletion | Revoke grants immediately; delete vault object and encrypted descriptors from primary store within 24 hours. |
| Workspace closure | Revoke all grants immediately; purge private evidence after 30 days unless documented legal hold applies. |
| Backup copies | Purge within 30 days after primary deletion. |
| Access/security audit | Retain 90 days; incident hold must name owner, reason, and expiry. |

Deletion never changes chain history. Private evidence has no public chain anchor by default, so deletion affects only private storage. If future product adds a public commitment, UI/export must state that commitment remains after object deletion.

## Threats, controls, and required negative tests

| ID | Threat | Required control | Acceptance test |
| --- | --- | --- | --- |
| P4-T01 | Cross-workspace read | Active membership plus explicit grant checked server-side | Member of workspace A cannot read evidence in workspace B. |
| P4-T02 | Removed member uses old link | URL TTL <= 60s; re-check before issuing URL | Revoke member; new request denied; old URL denied after TTL. |
| P4-T03 | Guessable object key | Random UUID key; bucket blocks listing/public reads | Guessed key and direct bucket URL return denied. |
| P4-T04 | Unsafe upload | Quarantine, MIME/magic/size validation, malware scan, credential scan | Executable, active HTML/SVG, archive, oversized, scanner timeout, secret fixture all blocked. |
| P4-T05 | Premature availability | Vault copy only after scan success and DB state transition | Quarantine object cannot receive read URL; failed scan cannot create evidence row. |
| P4-T06 | Metadata leak | Opaque IDs; encrypted private descriptors; analytics allowlist | Public API/export/analytics/log fixture contains no filename, key, URL, digest, or bytes. |
| P4-T07 | Stale role/grant race | DB transaction and conditional active-state update | Concurrent revoke/read leaves either denied or a URL bounded to 60 seconds. |
| P4-T08 | Export escalation | `export` scope distinct from `read`; server-side redaction | Reviewer with read only cannot create private export. |
| P4-T09 | Admin compromise | Least-privilege KMS/storage roles, audit, key rotation runbook | App role cannot list all objects or decrypt outside approved service path. |
| P4-T10 | Retention failure | Deletion queue, retry, purge audit | Delete request creates revoke then primary/backup purge evidence. |
| P4-T11 | Public/chain leak | Schema and API reject private fields from public envelope | Attempted CID, URI, raw digest, filename, prompt, or signed URL rejected. |
| P4-T12 | Private evidence used as score proof | Reputation engine ignores private evidence presence | Deleting or hiding private evidence does not alter public score/counts. |

## Non-negotiable implementation checks

- No `NEXT_PUBLIC_*` storage secret, KMS key, private gateway, bucket, object prefix, or signed URL.
- No direct browser upload to vault; browser receives signed URL only for one quarantine object.
- No wildcard signed URLs, bucket-level signed URLs, list permission, public ACL, or IPFS pin for private evidence.
- Every private API response sets `Cache-Control: private, no-store`; private export also sets attachment disposition and no-referrer policy.
- Scanner, KMS, database, and storage failures fail closed. Draft metadata may remain local; private object never becomes available.
- Logs use correlation ID and allowlisted action/outcome only. Error reporting strips request body and storage URL.
- Workspace removal preserves public contribution records and public verification; it only removes private access.

## Required pilot gates

Before enabling real private evidence: named incident/privacy owner; approved retention, moderation, privacy notice, terms, and deletion request process; KMS key ownership/rotation; storage lifecycle policy; backup restore/purge drill; independent security review; five-person privacy/usability observation; rollback and index-rebuild evidence. None are satisfied by this document.
