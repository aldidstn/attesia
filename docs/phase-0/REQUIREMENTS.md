# PRD requirements and phase evidence map

Source: [Attestia PRD v1.1](../../Attestia-PRD.md), approved Phase 0 plan, and [DESIGN.md](../../DESIGN.md). This matrix describes intended behavior and acceptance evidence. **Phase 0 specifications and simulated wireflows are not production implementation.** Later-phase checks below are required checks, not passing results.

Artifact key: [Discovery](DISCOVERY.md) · [Specification](SPECIFICATION.md) · [Architecture](ARCHITECTURE.md) · [Security](SECURITY.md) · [Dependencies](DEPENDENCIES.md) · [Handoff](HANDOFF.md). The phase README identifies the prototype entry point and actual checks run.

## Decision baseline and boundaries

| ID | Decision / PRD ambiguity resolved | Consequence |
|---|---|---|
| D01 | Anyone may attest; all active external claims count | Reviewer membership scopes workspace queues/private access, not global public issuance or an undefined “credible reviewer” score |
| D02 | Public evidence first; private evidence in Phase 4 | Phase 2 refuses private evidence publication; no private content in public IPFS or chain metadata |
| D03 | Dispute metadata does not deactivate a claim | Active total includes disputed active claims; disputed/undisputed subsets and history remain visible |
| D04 | Reputation accrues to contribution creator only | Claimed collaborator attribution and wallet-confirmed acceptance remain separate; neither grants automatic reputation |
| D05 | Supersession key is issuer + contribution + claim type | Different issuers coexist; same-issuer replacement must explicitly supersede; historical records never reactivate |
| D06 | Metadata-only revision may reuse artifact digest for the same creator with explicit parent | New metadata digest/version required; exact duplicate registration remains rejected |
| D07 | Negative claims testnet-only until legal review | Synthetic negative examples allowed; no live negative/failed public pilot without the specific gate |
| D08 | Hash canonical UTF-8 RFC 8785 metadata with keccak256; artifact bytes with SHA-256 | Digest/signature envelopes excluded from hashed payload; schema fixtures and digest vectors define reproducible bytes |
| D09 | `QUALITY` binds published workspace rubric/version; pilot `USAGE` identifies GitHub merge | Rubric versions immutable for issued claims; a merge does not automatically issue any claim |
| D10 | Public profile stays wallet-bound; delegates supported | Owner/delegate checks protect writes; ownership transfer/social recovery excluded at launch |
| D11 | Reputation v1 is category counts, outcomes, attester diversity, and evidence coverage | No universal score or undefined weighting; mutual-review flags do not silently change counts |
| D12 | Phases 5–6 prepare launch-ready code without activating mainnet or live billing | Manual deployment, independent review, legal/privacy approval, funding, merchant eligibility, and pilot evidence remain external gates |

Portable means reads and verification of a Monad record, not cross-chain writes. Agent permissions are declarations. No AI detection, proof of personhood, token/reward economy, autonomous custody, marketplace settlement, universal KYC, or general social network is implied.

## Core epics

Each check ID is a stable acceptance identifier for the future implementation backlog. Phase numbers identify when real behavior is delivered, not when its specification is written.

| ID / PRD | Requirement and acceptance behavior | Screen / interface | Required evidence and phase |
|---|---|---|---|
| E1.1 / Epic 1 | Public profiles readable without wallet; complete public metadata includes name, bio, skills, role, communities, type, wallet reference, URI, summary | Public profile; `GET /api/v1/profiles/{id}`; profile schema | Anonymous read and schema fixture; P2 |
| E1.2 | WalletConnect-compatible authentication binds one-time expiring nonce to domain, URI, chain, wallet, issue time | Login; auth nonce/verify/logout API | Replay, wrong-domain/chain/wallet, expired nonce and secure-session tests; P2 |
| E1.3 | Only owner/authorized delegate updates profile; no transfer; recovery delegated to wallet provider | Profile settings; profile registry | Unauthorized update/delegation/zero-address/ownership invariant tests; P1–2 |
| E1.4 | No private identity fields onchain; chain/address/transaction/integrity visible; malformed metadata produces explicit degraded state | Profile integrity panel; verification envelope | PII boundary review, missing/malformed/hash-mismatch metadata fixtures; P0 specification, P2 behavior |
| E1.5 | Optional embedded-wallet path isolated from core wallet flow | Wallet integration boundary | Provider capability check; defer if it threatens real core loop; optional P2+ |
| E2.1 / Epic 2 | Seven types: research, pull request, design, smart contract, bounty, community task, other; required content/provenance/source/collaborator fields | Contribution composer; contribution schema | Valid fixtures for supported types; missing/unknown-field cases; P0 schema, P2 behavior |
| E2.2 | Duplicate creator/artifact registration is never silent; metadata-only revision follows D06 | Composer, publication review; contribution registry + idempotency | Exact duplicate, retry, explicit revision, wrong-parent creator tests; P1–2 |
| E2.3 | Public artifact bytes retrievable and match anchor | Publication review, detail integrity; upload and verify APIs | Hash vector, retrievable artifact, changed bytes and unavailable artifact checks; P0 vectors, P2 integration |
| E2.4 | Private artifact never public; only permitted compact integrity/classification fields anchored | Private evidence settings; ACL + signed storage access | Cross-workspace/expired URL/export isolation tests; P4; unsupported in P2 |
| E2.5 | Draft, pending, confirmed, disputed, archived shown without deleting record history | Dashboard/detail/history; register/archive events | State transition/reload/archive and disputed-active display checks; P1–2 |
| E2.6 | Source schemes validated, rendered safely, never executed | Sources; schema and safe-fetch boundary | Disallowed scheme, escaped markup, redirect/private-network fetch tests; P0 schema, P2 service |
| E3.1 / Epic 3 | Human input, AI assistance (`none`, `assistive`, `substantial`, `agent-led`, `undisclosed/unknown`), voluntary tools, sources/access date, collaborators, revision notes | Composer/provenance; provenance schema | Required/optional fields and disclosure examples; P0 specification, P2 behavior |
| E3.2 | Provenance explicitly a signed declaration, not detection; sensitive prompts/credentials excluded from public metadata guidance | Composer/publication review/detail | Comprehension task, pre-publication warning and content-handling test; P0 wireflow, P2 behavior |
| E3.3 | Revision creates new digest/parent, never rewrites history | Revision composer/history; parent references | Immutable revision and digest-change tests; P1–2 |
| E3.4 | Claimed, accepted attribution, and attested relationships distinguishable; creator-only credit | Provenance graph plus accessible list | Label/legend, acceptance authorization, no collaborator score transfer; P3 |
| E4.1 / Epic 4 | Five claim schemas with type, subject, issuer, outcome, evidence, timestamps/optional expiry/supersedes; claim metadata digest and workspace/rubric references bound | Attestation composer; attestation registry/schema | Each claim's valid/invalid fixtures and generated ABI/API checks; P0 specification, P1–2 behavior |
| E4.2 | `QUALITY` uses published rubric; new rubric version never changes past claim | Composer and claim detail; rubric schema/version reference | Missing/unpublished/wrong-workspace rubric rejection; old claim retains old version; P1–2 reference, P4 authoring |
| E4.3 | Only issuer revokes; event retained; reason/evidence required in UI | Revocation screen; `revoke`; history | Unauthorized revoke, repeat revoke, revoke while paused, reason requirement; P1–2 |
| E4.4 | Active, expired, revoked, superseded lifecycle distinct; dispute is separate workflow status | Claim badges, timeline, profile explanation | Expiry boundary, disputed-active/revoked combinations, no reactivation tests; P1–3 |
| E4.5 | Self-claims labeled, zero external weight; outsiders' external claims count | Claim detail and category counts | Self/external fixture set independent of workspace membership; P2–3 |
| E4.6 | Same-key active duplicate requires explicit replacement; other issuers coexist | Composer conflict state; supersession events | Same-issuer race and cross-issuer same-type tests; P1–2 |
| E4.7 | Negative/revoked claims require reason/evidence; negative production gate enforced | Decision/revocation review | Missing reason/evidence and environment-gating checks; P2 testnet, legal gate before production |
| E5.1 / Epic 5 | Delivery, Authorship, Quality, Usage, Provenance show active count, unique attesters, coverage, outcomes and status | Profile explanation; score projection | Deterministic mixed claim fixtures; D03/D11 labels; P3 |
| E5.2 | Revocation changes active count after indexing while historical total persists | Dashboard/detail/profile | Two external claims → revoke → counts 2 to 1; correct category changes; P2 core counts, P3 full explanation |
| E5.3 | Immutable events + algorithm version reproduce historical projections | Verification/export; score snapshots | Full replay equality and history snapshot test; P3 |
| E5.4 | Self-claims excluded; reciprocal clusters flagged without hidden reweighting | Profile/graph | Self/mutual review fixture assertions; P3 |
| E5.5 | Graph usable with ≥100 nodes through clustering/progressive disclosure; list alternative | Graph | Synthetic 100-node keyboard/mobile/load exercise; P3–4 |
| E6.1 / Epic 6 | Workspace slug/profile, reviewer membership, accepted types, queue/status filters | Workspace settings/review queue; protected workspace API | Role/type filtering and audit tests; P4 |
| E6.2 | Admin-only rubric authoring creates versions and retains history | Rubric editor; versioned rubric API | Non-admin denied; immutable issued-claim references; P4 |
| E6.3 | Non-reviewer cannot read private evidence; admin mutations audited | Private evidence/access audit | Direct API and signed-URL tests, not UI-only checks; P4 |
| E6.4 | Workspace removal preserves contributor-owned public records | Workspace archive/settings | Delete/remove membership then public record remains verifiable; P4 |
| E6.5 | CSV/JSON exports include chain, contract, record ID, block and score version; private output redacted by authorization | Export; public/organization API | Round-trip metadata and unauthorized export fixtures; public P2, workspace P4 |
| E7.1 / Epic 7 | Official ERC-8004 identity used; no competing agent NFT; current owner resolved on protected read/write | Agent profile/registration; agent adapter | Verified target registry/interface, owner-transfer and stale-owner tests; P3 |
| E7.2 | Agent ID links Attestia contributions; native ERC-8004 feedback stays separately labeled | Agent profile; agent API | Source separation and chain/registry/agent-ID mapping tests; P3 |
| E7.3 | No unavailable validation badge; policy says “declared” | Agent policy screen | Unavailable-registry and language check; P3 |
| E7.4 | Policy contains capabilities, allowed/blocked operations, ceiling, approvals, expiry/pause contact; update creates version/history | Policy composer; policy schema/registry | Schema fixtures, unauthorized owner, version/pause tests; P0 schema, P1 registry, P3 UI |
| E8.1 / Epic 8 | Feed ranks by workspace relevance, active outcomes, completeness, diversity, bounded freshness; explains factors | Home/feed; feed API | Deterministic ranking explanation fixtures; no likes/follower inputs; P3 |
| E8.2 | Filter type, community, skill, status, human/agent; new contributors reachable by category | Explore/feed filters | Combined filters/pagination and new-profile discovery tests; P3 |
| E8.3 | Repeated self-claims do not improve ranking | Feed projection | Add self-claims and assert unchanged ranking factors; P3 |

## Screens, journeys, and recovery

Phase 0 covers eight connected screens: dashboard, contribution composer, publication review, contribution detail, attestation composer, revocation, profile explanation, and public verification. Other PRD screens are mapped below for later phases; their inclusion here is not a claim that the prototype implements them.

| ID / PRD | Screen or journey contract | Acceptance evidence / phase |
|---|---|---|
| U01 / §6 A, §8 | Dashboard activation checklist, pending writes, review requests, changes, recent contributions; saved multi-step draft | Simulated P0 wireflow; real persistence and source events P2 |
| U02 / §6 A, §8 | Composer shows visibility, hashing, sources/AI disclosure; publication review shows exactly what is public before signing | Keyboard primary scenario and failure recovery P0; byte hashing/scanning/signing P2 |
| U03 / §8 | Detail leads with artifact/integrity, then provenance, claim state, collaborators, history/explorer links | P0 layout; evidence and source references verified P2 |
| U04 / §8 | Attestation includes claim, decision, rubric, evidence, expiry, conflict disclosure and permanent-public-action warning | P0 critical wireflow; all fields and contract validation P2 |
| U05 / §6 B | Issuer revokes with reason, can reference replacement; subject sees change and can dispute without history erasure | P0 simulated revoke; P2 live revoke/dispute; P4 moderation |
| U06 / §8 | Profile categorized counts/confidence, graph, badge/share/API; no absolute “trusted” label | P0 explanation; full profile P2–3 |
| U07 / §6 C | Agent registration/read and owner-checked declared policy; human/agent collaborator attribution | P3; read-only identity acceptable if registration threatens core release |
| U08 / §6 D | Walletless verify displays active/historical claims, chain/block/tx, score version, freshness and independent-check/export route | P0 simulated verification visibly labeled; live API/explorer P2 |
| U09 / §8 | Home/feed; people/agents/communities explore; review queue; settings; notifications | P3 discovery and agent UI; P4 managed workspace/notifications |
| U10 / §8, §13 | Draft → Awaiting signature → Submitted → Proposed → Finalized → Indexed; receipt alone is pending | P0 simulated sequence; P2 RPC/finality/indexed assertions. Future financial/legal consequence waits for Verified state-root finality. |
| F01 / §6.5 | Rejected/timed-out signature preserves prior step/draft; no false confirmation | P0 failure control; P2 wallet e2e |
| F02 | Wallet changes mid-composer: signer/session/profile mismatch blocks write with reason | P0 failure control; P2 server/contract check |
| F03 | Double click/retry reconciles idempotency key to existing record; no second write | P0 duplicate control; P1 uniqueness/P2 retry e2e |
| F04 | Expired auth/nonce retains draft and uploaded evidence; re-auth then continue | P0 failure control; P2 expired-session integration |
| F05 | RPC accepts but response lost: reconcile hash/operation before resubmit, including reload | P2 dropped-response/replacement test; P0 handoff specification |
| F06 | Expired unanswered invite shows awaiting-review; contributor/admin can re-invite | P2 expiry/re-invite check; P0 handoff specification |
| F07 | Finalized but unindexed record shows processing/freshness, not failed write | P0 lag control; P2 delayed-indexer check |
| F08 | Malware/type rejection after hashing still blocks registration | P2 upload rejection integration; P0 security specification |
| F09 | Same issuer races on same key: deterministic supersession; different issuers may both remain active | P1 race/invariant tests; P0 interface decision |
| F10 / Epics 1–2 | Missing/unreachable/mismatched evidence or metadata renders explicit degraded integrity, not verified/blank | P0 unavailable-evidence control; P2 broken URI/digest test |
| V01 / DESIGN.md | Violet canvas/panels, pills, rounded controls, Manrope 500/600 fallback, cyan data, mint active state, decorative provenance line art | P0 visual QA; no healthcare claims/imagery; design conflicts resolved by approved plan |
| V02 / §15 | 360px full functionality, visible keyboard focus, linked error summary, reduced motion, WCAG 2.2 AA core flows | P0 relevant prototype checks; P4 axe/manual screen reader, responsive/browser QA |

## APIs, data, chain, and security

| ID / PRD | Interface or constraint | Acceptance evidence / phase |
|---|---|---|
| A01 / §12 | Public profile, profile-contributions, contribution, contribution-attestations, agent, verify, and feed routes as listed in PRD | Versioned response/schema and anonymous read tests; P2, agent/feed P3 |
| A02 / §12 | Auth nonce/verify/logout, upload presign, draft, invite, dispute; protected workspace reviewer/policy endpoints | Auth, authorization, validation/idempotency tests; P2, workspace P4 |
| A03 / §12 | Envelope includes chainId, contract, recordId, txHash, blockNumber, confirmation, indexedAt, algorithmVersion/computedAt | Contract/API envelope fixtures and source reconciliation; P0 spec, P2 behavior |
| A04 / §12 | Cursor pagination, ETags, rate limits; paid API keys with separate public/org quotas | Pagination/cache/429 tests P2; quota/key lifecycle P6 |
| A05 / §11 | Profile, AgentLink, Contribution, Collaborator, Source, Provenance, Attestation, Workspace, Membership, ScoreSnapshot, Policy, Dispute mapped to owner/source layer | Canonical schema/interface review P0; persistence P1–4 |
| A06 / §11 | Canonical UTF-8 key/number representation, excluded envelope, SHA-256 bytes vs keccak256 metadata explicit | Valid/invalid schema fixtures, canonical byte and digest vectors P0; production boundary checks P2 |
| A07 / §9 | Chain integrity/authorization; app DB stores drafts/ACL; rebuildable indexer serves queries; no per-page historical log scan | Architecture/ADR P0; replay/fallback integration P2–4 |
| C01 / §10 | Immutable versioned registries, no proxy; profile/delegate, contribution/archive, attest/revoke/supersede, policy/pause events reconstruct history | Every write/revert/event + immutable-history invariant; P1 |
| C02 / §10 | Minimal onchain identifiers/digests/status; ownership-authoritative mappings; events include reconstruction fields | Event coverage/interface review P0; replay projection P1–2 |
| C03 / §10 | Pause stops permitted new writes, preserves reads and issuer revocation; no admin rewriting claims | Pause/unauthorized admin tests P1; production multisig/runbook P5 |
| C04 / §§9,13 | Pin chain/address/block/compiler/commit/ABI/spec revisions by environment; no timestamp-only IDs/order | Dependency/manifest spec P0; deterministic collision and deployment checks P1 |
| C05 / §13 | Verify current Foundry/viem/Monad gas/finality support; measure gas limits; no blobs or global-mempool dependency | Current evidence in Dependencies P0; Monad execution/gas and testnet checks P1; recurring predeploy check |
| C06 / §9.4 | Managed sponsorship only after supported-chain proof; allowed methods, per-wallet caps, workspace budget, kill switch; explicit self-paid fallback | Dependency finding P0; provider/abuse/budget/fallback integration before enablement; no assumed compatibility |
| S01 / §14.1 | Nonce atomically consumed; domain/chain/verifier boundaries; typed signatures only if introduced | Replay/concurrent nonce/trust-boundary tests P2; EIP-712 chain/contract test for later meta-transactions |
| S02 / §14.2 | Owner/delegate bounds, zero/collision checks, minimal external calls; no arbitrary delegatecall/unbounded loops | Fuzz/invariants/Slither/manual review P1; independent review before P5 |
| S03 / §14.1 | Validate URLs/content, escape markup, CSP, malware scan; prevent unsafe server fetch | Threat-to-control-to-negative-test map P0; malicious URI/file integration P2 |
| S04 / §14.3 | Pre-publication classification excludes private/sensitive data; immutable-public deletion limits explicit | Public-evidence policy P0; comprehension/boundary checks P2; privacy review external gate |
| S05 / §14.1 | KMS, signed URLs, workspace ACL, access audit, no public IPFS for private evidence | Unauthorized/expired/cross-workspace/storage/export tests P4 |
| S06 / §14.1 | Rebuildable idempotent event projection, reorg/finality recovery, provider fallback | Replay duplicates/late events/malformed metadata/reorg/full rebuild tests P2–4 |
| S07 / §§14.1,14.4 | Sybil/context and reciprocal-edge flags visible; report/hide/dispute/revoke; no silent count manipulation/adjudication | Gaming fixtures P3; moderation audit/takedown boundary checks P4 |
| S08 / §14.5 | Explicit legal review for EU personal-data digests and public negative claims; terms describe third-party claims and deletion limits | Review decisions recorded before affected real pilot; not supplied in P0 |
| S09 / §14.5 | Organization/payment screening before first paid Enterprise/API customer | Policy and compliant onboarding acceptance before live billing P6 |
| S10 / §§18,21 | No deployer secrets in repo/previews; extra multisig signer, succession/access handoff, incident channel | Secret scan/config P1–2; assigned people and rehearsed runbooks before P5 |

## Nonfunctional, validation, and release gates

| ID / PRD | Requirement | Acceptance evidence / delivery gate |
|---|---|---|
| N01 / §15 | Web/API availability 99.5% pilot target excluding disclosed chain/RPC incidents | Real probes and incident classifications during P5; no P0 availability claim |
| N02 | LCP <2.5s p75; cached profile API <500ms p95; index update visible <10s target | Defined measurement cohorts in Discovery; load/RUM checks P4–5 |
| N03 | At-least-once ingestion/idempotent materialization; onchain wins; freshness/resync | Replay/lag/repair tests P2–4 |
| N04 | API-to-tx/index event correlation; lag/failure alerts; no sensitive analytics payload | Restricted operational trace and analytics allowlist tests P2–4 |
| N05 | JSON/CSV, stable IDs and schema versions; English strings externalized | Export/schema and UI string review P2–4 |
| N06 | Current/previous Chrome, Safari, Firefox, Edge; mobile 360px | Browser matrix and manual device/keyboard checks P4 |
| N07 | Daily DB backups, index rebuild from deployment block | Restore and full rebuild rehearsal P4; production monitoring P5 |
| N08 | Published email/Discord channel; first response within two business days | Real owner/channel/calendar named before pilot; support process in Discovery |
| T01 / §16 | Every contract write/revert/event; ID/length/expiry/supersession fuzz; ownership/history invariants; gas snapshot | Runnable Foundry suite in verified Monad mode P1 |
| T02 | Web/API canonicalization/hash/scoring/auth; ABI/schema integration; wallet submit/attest/revoke/verify e2e | Canonical fixtures P0; service/Anvil/Playwright P2–3 |
| T03 | Private permission negatives; axe plus manual keyboard/screen reader | P4; relevant static prototype checks P0 |
| T04 | Duplicate/delayed/malformed events, finality, full replay, deterministic scores, synthetic graph/feed load | P2–4; never use mainnet user data for synthetic load |
| T05 | Five usability tasks: publish/privacy, authorship, verify tx, revoke/explain, claimed-vs-attested | Interview script P0; five-participant observations P4; ≥4/5 directional target |
| G00 / §17 Phase 0 | Schemas/policy; wireframes/threat/ADR/analytics; optional interviews and taxonomy/incentive research | **Complete:** engineering artifacts/checks recorded in README; former interview, commitment, and privacy-review exit gates deprecated |
| G01 / Phase 1 | Versioned contracts, tests/fuzz/invariants/gas, manifest, testnet deploy/verify | CI clean; no critical/high internal finding; manual revoke via Cast; explicit manual deployment gate |
| G02 / Phase 2 | Contributor/reviewer/auth/integrity/indexer/public API/recovery real | Two independent wallets complete end-to-end without developer assistance |
| G03 / Phase 3 | Versioned counts/graph/agent policy/feed | Revocation changes count and graph; registry ownership resolved |
| G04 / Phase 4 | Workspace/private ACL/export/security/accessibility/load/monitoring/backup/policies | Signed pilot checklist, published limits, rollback and index rebuild rehearsed |
| G05 / Phase 5 | Production configuration, multisig, mainnet verification and invitation pilot | Code prepared only until approved deployment; independent review, zero high/critical findings, actual two-week stability before open signup |
| G06 / Phase 6 | Sandbox billing, API keys/quotas, org analytics/custom rubrics | WTP and eligibility gates before live payments; SDK only after repeated demand; enforcement only after separate security design |
| G07 / §21 Testnet | Verified three core registries + manifest; human/agent/contribution/two claims/revoke; hashes/graph/API/explorer/recovery/privacy README | Real chain evidence required in later phases; a simulated prototype cannot close this checklist |
| G08 / §21 Mainnet | Independent review, multisig/pause, fallback/monitoring/backups/rebuild, terms/privacy/moderation/retention, measured gas, usability, incident owner | All signed/observable before live pilot; none inferred from Phase 0 documents |
| G09 / §23 | Fresh evaluator with two wallets: profile, linked real agent, publish provenance/hash, two claims, revoke/count, explorer, export/API, state comprehension | Definition of MVP done evaluated after P3–4; no mocked transaction may satisfy it |

## Phase 0 acceptance ledger

This ledger distinguishes completed Phase 0 artifacts from optional research and later-phase evidence. See [Handoff](HANDOFF.md) for owners, run commands, and blocking findings.

| Deliverable | Phase 0 evidence | Optional research or later-phase evidence |
|---|---|---|
| Discovery pack | Scenario, hypotheses, scripts, blank evidence/commitment log, metric definitions | Optional interviews and partner observations; deprecated as Phase 0 exit requirements |
| Specification | Versioned canonical schemas, fixtures, byte/hash vectors, fixed decisions | Production boundary enforcement and approved handling of real personal data |
| Architecture | Interfaces, data flow, EAS ADR, dependencies, cost assumptions | Chain/provider capability checks marked unresolved, funded accounts, deployed contracts |
| Wireflow | Eight connected screens, simulated primary workflow, specified failure examples | Real wallet/RPC/indexer flow; production accessibility/browser coverage |
| Security | Threats mapped to controls and negative tests; privacy boundaries/gates | Independent review, legal/privacy conclusions, signed operational policies |
| Handoff | Phase 1 backlog and acceptance checks; historical gate decisions recorded | **Complete:** implementation, CI, approved testnet deployment, verified source, manifest, and Cast smoke evidence |

No requirement is dropped to make Phase 0 appear complete. Optional embedded wallet, agent registration, white-label SDK, and agent enforcement retain the PRD's explicit optional/demand/security gates; all other deferred requirements have a target phase above.
