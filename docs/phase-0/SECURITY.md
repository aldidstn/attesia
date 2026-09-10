# Evidence policy and threat model

Status: engineering policy proposal, not legal advice or completed security review. Scope: public testnet MVP, with private evidence design reserved for Phase 4. Owners below are roles pending named operators.

## Publication boundaries

| Data | Handling | Retention / consequence |
|---|---|---|
| Drafts, abandoned uploads | Private quarantine; author session only | Proposed: remove abandoned drafts after 30 days; rejected uploads after 24 hours; no public anchoring |
| Public artifact | Opt-in, scanned, sanitized, hashed bytes, public IPFS | Permanently copyable; unpin/hide cannot retract other copies |
| Public metadata | Reviewed pseudonymous display information and evidence links | Immutable versions; no email/legal identity/contact records, private prompts or source credentials |
| Onchain record | Identifier, owner, safe digest/URI, lifecycle | Public permanent history; never describe hide/delete as chain erasure |
| Phase 4 private artifact | S3 SSE-KMS, opaque object key, tenant ACL, short signed URL | Configurable retention, default 30 days after workspace closure; authorized deletion revokes access immediately; backup purge within 30 days |
| Audit/security logs | Restricted, pseudonymous internal IDs; redact tokens/payloads | Proposed 90 days, then delete unless documented incident hold |

The 90-day rule covers operational access/security logs only. Versioned domain history (dispute state transitions, issuer-relationship snapshots, rubric history and evidence observations used by a published score snapshot) remains available for the lifetime of retained public projections so historical results can be reproduced. Keep personal reasons/evidence in separately deletable storage; durable events use opaque references and safe state facts. Privacy review must approve this split before a real pilot. A deletion that prevents full historical reconstruction must be disclosed on the affected export, not silently replaced with current state.

Retention defaults require counsel and operator sign-off before a real pilot. A hash can still reveal guessable sensitive input. Public schemas are not proof that contents contain no personal data; technical validation cannot provide a legal/privacy guarantee. EU personal-data anchoring and public negative claims stay gated.

First-public-upload allowlist: PDF, UTF-8 text/Markdown/diff/patch/JSON, PNG, JPEG, WebP; maximum 10 MiB per artifact. Verify magic bytes where applicable, reject active HTML/SVG/executables/archives, strip image metadata, and serve files from a separate origin with download-safe headers. PDF/text secret scanning is a defense in depth control, not a guarantee. Scan unavailable/timeout = upload remains blocked. Allow external HTTPS/IPFS references after URL validation; artifact integrity needs an immutable captured byte snapshot, not merely a mutable GitHub URL.

Merged-PR evidence records repository URL, PR URL/number and merge commit SHA, plus sanitized patch bytes. Git identity strings may contain personal data: inspect/redact author headers before publication and say which bytes were hashed. The original PR link provides context; the sanitized snapshot is the artifact being verified. Prototype examples are fictional, never attest to real people's work.

No public-by-default visibility toggle. Publication review presents exactly which metadata/artifact will become public and requires explicit acknowledgement. Rejected signature, failed scan, session expiry or wallet mismatch preserves draft and never pins rejected content. In Phase 4, public envelope exposes only safe classification/digest and an opaque access reference; internal storage keys and presigned URLs never enter canonical public metadata, analytics or exports.

## Threat/control/test map

| ID | Threat / severity | Required control and owner | Negative test / acceptance |
|---|---|---|---|
| T01 | Signature replay, cross-domain login / high | Backend: atomically consume wallet-bound nonce; verify domain, URI, chain, issued-at, expiry; HTTP-only Secure SameSite cookies; Origin/CSRF controls | Same nonce twice, expired message, wrong domain/URI/chain, wallet switch all rejected |
| T02 | Unauthorized writes / critical | Contracts: owner/delegate checks, immutable owners, issuer-only revoke; policy uses current ERC-8004 owner | Foreign wallet cannot edit, archive, revoke or publish another agent policy; removed delegate rejected |
| T03 | Duplicate/racing transactions / high | Contracts + API: scoped IDs, uniqueness, same-issuer supersession and database idempotency | Double click/retry creates one logical record; different issuers coexist; stale replacement reverts |
| T04 | Permanent disclosure / critical | Product/storage: public review, quarantine, redaction guidance, safe metadata schema | Sensitive fixture never leaves quarantine; private URI/credential fields rejected; rejection cannot trigger publish |
| T05 | Malicious uploads / high | Storage: MIME/magic/size limits, malware scan, separate origin, CSP/nosniff, no inline HTML | Renamed executable, oversized file, active document, failed scanner blocked before anchor |
| T06 | SSRF / high | Backend: allowlisted fetchers; block loopback/link-local/private IPv4/IPv6 and metadata-service addresses; revalidate DNS/redirects; time/byte limits | Public URL redirecting to internal address rejected; IPFS gateway redirects equally checked |
| T07 | Cross-workspace private access / critical | Backend: ACL on every URL issuance and export, short URL TTL ≤60s, no-store, audit access | Nonmember, expired membership, removed reviewer and guessed object key denied; old signed URL expires within bound |
| T08 | Reputation gaming / high | Product: anyone-counts policy visible; separate positive/negative counts, issuer diversity, self exclusion, reciprocal flags | Self/delegate claims never count externally; dispute doesn't erase total; evidence outage doesn't silently change count |
| T09 | Stale/reorged index / high | Indexer: finalized-only projection, idempotent event key, rollback/replay, freshness timestamp | Duplicate/out-of-order/reverted events reproduce same canonical projection; API marks lag |
| T10 | Hash ambiguity / high | Schema: RFC8785, UTF-8, SHA256 bytes versus keccak metadata, immutable versions | Key ordering invariant; byte/content mutation breaks expected digest; unknown/duplicate keys rejected at parse boundary |
| T11 | Malicious display metadata / high | Frontend: escaped text, scheme validation, no raw HTML, safe download names | Script title, javascript/data URL, CSV formula payload do not execute |
| T12 | Agent overclaim/ownership change / high | Adapter: current owner + pinned interface, declared-only label, unavailable validation state | Sold agent rejects old owner's new write; stale RPC never treated as authorization success |
| T13 | Revocation censorship / high | Contracts: direct issuer revoke works while new-write pause enabled | Cast revoke succeeds during pause; admin cannot rewrite claim; original event remains |
| T14 | Sponsorship abuse / high | Backend/paymaster: allowlisted chain/contract/selectors, session-to-smart-account binding, daily cap, atomic workspace budget and kill switch | Arbitrary call/batch/nested execution refused; exhausted budget prompts self-pay; concurrent requests respect cap |
| T15 | Negative-claim harm / high | Operator: evidence/reason requirement, reports/disputes, legal release gate | Production negative issuance disabled in first deployment; testnet labels preserved; hide action doesn't falsify chain history |
| T16 | Admin/key compromise or disappearance / critical | Operator: production multisig with additional signer, least privilege, incident/handoff runbook | Pause drill, signer unavailability, credential rotation and restore/index rebuild demonstrated before Phase 5 |
| T17 | Billing/authentication abuse / high | Phase 6: verified Stripe webhook, idempotent events, reconciled subscription state, hashed API keys | Forged/replayed/out-of-order billing events never grant unauthorized paid access |

Contract-level checks cannot validate offchain malware scans, truth or privacy. The official app controls publication and sponsorship; direct callers can issue malformed/spam records. Read models must show invalid/unavailable metadata without pretending those events vanished. Any stronger chain admission gate needs a separately documented design.

## Moderation and incidents

Subjects and workspace admins can open evidence-backed disputes. The audit log records opener, reason, time and resolution; open disputes appear as a separate subset of active claims. Reviewers can respond; only issuers revoke their own claims. Platform moderation hides unsafe hosted material from default discovery with a reason and audit entry, but preserves safe minimal chain history and explains any unavailable evidence.

Private deletion revokes application access and schedules object/backup purge; signed URLs may survive up to their 60-second TTL. Hosted illegal/sensitive material follows operator takedown process; never promise deletion of public replicas or blockchain history. Operator must publish support/abuse channel and target first response within two business days before pilot.

Suspected leak: stop new publication/sponsorship, revoke access credentials, preserve restricted incident evidence, identify affected storage/versions, execute approved notification process and revalidate before resuming. Contract pause should preserve reads and issuer revocation. No automatic messages or external notifications are implemented or sent in Phase 0.

## Release evidence still required

Named incident/privacy owner, counsel's data-classification and negative-claim position, approved terms/moderation/retention policy, independent contract review, production multisig/handoff and backup/index rebuild drill. These remain gates; documentation does not satisfy them.
