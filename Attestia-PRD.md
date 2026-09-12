# Attestia — Product Requirements Document

**Version:** 1.2<br>
**Status:** Build-ready draft  
**Primary network:** Monad Testnet (build/staging) → Monad Mainnet (**live network since 24 November 2025** — treat as a real-value environment, not a future milestone)  
**Product category:** Trust, Identity & AI Infrastructure  
**Prepared from:** `attestia_business_model.pdf`, Monad official documentation, Ethereum developer documentation, Privy documentation, EAS/ERC-8004 ecosystem documentation, and current coverage of Monad network status<br>
**Research cut-off:** 12 September 2026<br>
**Revision cut-off:** 12 September 2026 (v1.2 — see Changelog)

> **Positioning:** Attestia turns digital contributions into portable trust for people and AI agents.

---

## Changelog

### v1.1 → v1.2

- Deprecated the former Phase 0 stakeholder-interview, partner-commitment, and privacy-review exit gates; Phase 0 acceptance now depends on its engineering artifacts. Later production and negative-claim reviews remain phase-specific gates.
- Selected **Privy React SDK** as the MVP authentication and embedded-wallet stack instead of leaving the provider optional.
- Added Privy-specific onboarding, chain-configuration, session, sponsorship, fallback, security, and test requirements.
- Kept `wagmi` + `viem` for contract reads/writes and wallet interoperability; Privy does not replace the contract client.
- Recorded Monad Execution Events as a post-MVP indexing option. Its real-time path requires a self-hosted Linux Monad node, so Envio remains the MVP indexer.
- Added official Privy, Monad Execution Events, and Metropolis Privy-track references.

### v1.0 → v1.1

- Corrected framing: Monad mainnet is a live, real-value network (since Nov 2025) with an active upgrade cadence, not a future milestone — updated header and §13.
- Flagged ERC-8004 as a Draft-status EIP whose registries/interfaces can still change — updated §10.4, §13.2, §22.
- Added competitive and prior-art analysis (EAS and adjacent attestation/reputation protocols) plus an explicit build-vs-integrate rationale — new §2.4.
- Added a retention metric and unit-economics/willingness-to-pay validation notes — updated §4.4, §20.
- Added a legal and regulatory subsection covering the GDPR erasure tension, defamation liability, ToS/liability posture, and sanctions screening — new §14.5.
- Added a gas sponsorship / account abstraction design instead of leaving it an unresolved assumption — new §9.4.
- Added rubric ownership and versioning process — updated Epic 4 and Epic 6.
- Added solo-builder succession / key-person risk and mitigation — updated §18, §22.
- Added a consolidated edge-case and failure-state catalog for the core journeys — new §6.5.
- Clarified what "portable" means against the cross-chain non-goal, so the positioning and scope don't read as contradictory — updated §3, §4.2.
- Added a glossary — new Appendix A.

---

## 1. Executive summary

Attestia is an evidence-backed contribution and reputation platform for Web3 communities. A contributor or AI agent can register an identity, submit a work artifact, disclose provenance, receive claim-specific attestations, and present a portable history to another community.

The source business model is directionally strong, but its full scope combines at least four products: contributor identity, work provenance, community review, and AI-agent governance. Building all four deeply would weaken a solo-builder MVP. This PRD therefore defines a narrower wedge:

> **MVP wedge:** a DAO or hackathon can verify a concrete contribution and produce a portable, inspectable trust record.

The MVP proves one complete loop:

1. Create or connect an identity.
2. Register a contribution with public evidence and provenance disclosure.
3. Invite two reviewers.
4. Issue or reject structured attestations.
5. Revoke one attestation and see derived reputation update.
6. Reuse the public profile in another community.
7. Register one AI agent and display its declared permission policy.

Attestia does **not** claim to detect AI-generated content, prove objective truth, replace legal identity, or provide autonomous custody in the MVP.

---

## 2. Source analysis

### 2.1 What the business document gets right

- It replaces vanity metrics with evidence and review history.
- It treats AI provenance as disclosure, not unreliable “AI detection.”
- It stores artifacts offchain while anchoring integrity onchain.
- It includes revocation and disputes rather than treating attestations as permanent truth.
- It aligns Monad’s frequent low-cost transactions with many independent trust updates.
- It proposes an adoption-friendly model: free individuals, paid organization workflows and APIs.

### 2.2 Critical product refinements

1. **Reputation is a derived signal, not an onchain fact.** Store claims and lifecycle events onchain; calculate category scores offchain with a versioned algorithm.
2. **Human and agent identity should not be forced into one schema.** Use an Attestia profile for people and organizations, and integrate ERC-8004 for agents through an adapter.
3. **Permissions in MVP are declarations, not enforcement.** A policy hash and approval log can be audited, but Attestia must not imply it can stop an external agent unless calls are actually routed through an enforcing smart account or policy gateway.
4. **Private evidence cannot be placed on a public chain or public IPFS.** Store only a digest, minimal classification, and access-controlled URI.
5. **A social feed is secondary.** The first success metric is verified contribution completion, not daily engagement.
6. **“Attestation” must be explained carefully.** Attestia product attestations are application-level trust claims; they are not Ethereum proof-of-stake consensus attestations.

### 2.3 Key assumptions requiring validation

- DAOs will accept reviewer-signed evidence as more useful than raw GitHub activity.
- Contributors are willing to connect a wallet if gas can be sponsored or interactions are minimized.
- Reviewers will complete structured verification without financial incentives.
- One organization will act as a design partner and seed credible attesters.
- Public contribution metadata is sufficient for the hackathon; private workspace demand is post-MVP.
- Reviewers, admins, and pricing tiers behave as sketched even though no willingness-to-pay data exists yet (see §20).
- Privy authentication, embedded wallets, and app-paid gas sponsorship work on Monad Testnet within the hackathon window; prove this with an account-backed integration test before relying on it in the demo (see §9.4–9.5).
- ERC-8004's Identity Registry interface stays stable enough between now and ship date to avoid a breaking adapter rewrite (see §10.4).

### 2.4 Competitive and prior-art landscape

Attestia's core primitive — schema-based, revocable, evidence-linked attestations — already has established prior art. This PRD does not assume Attestia is first-of-kind; it should be positioned and built with these in view:

| Project | Overlap with Attestia | Why Attestia is not simply redundant |
|---|---|---|
| **Ethereum Attestation Service (EAS)** | Generic, schema-based, revocable onchain/offchain attestations — structurally the same primitive as Epic 4 | EAS is a generic attestation substrate with no contribution/provenance model, no reviewer workflow, and no reputation layer; Attestia is a vertical product built for a specific workflow, not infrastructure |
| **Gitcoin Passport / proof-of-personhood tools** | Sybil-resistance signal for contributor identity | Attestia scores *work*, not personhood; these are complementary sybil-resistance inputs, not substitutes |
| **Karma3/OpenRank, SourceCred** | Graph-based reputation scoring from contribution activity | These infer reputation from raw activity signals; Attestia requires human-reviewed, claim-specific attestations as the input, which is a different trust model |
| **Otterspace, Disco.xyz** | Soulbound/verifiable-credential badges for community roles and contributions | Similar badge surface, but neither centers claim-specific, evidence-linked, revocable review as the core loop the way Epic 4/5 do |
| **ERC-8004 (agent identity/reputation)** | Directly reused for agent identity — not a competitor, a dependency (see §10.4) | N/A — intentional integration |

**Build-vs-integrate decision:** the MVP builds a custom `AttestationRegistry` (§10.1) rather than issuing EAS schemas on Monad. Rationale to defend, not assume:

1. EAS's revocation and schema-registry semantics are generic; Attestia needs claim-type-specific fields (rubric/version, supersession, validity windows) that would otherwise be encoded as loosely-typed EAS schema data anyway, giving up little by going custom.
2. A dedicated registry keeps Attestia's authorization and event model self-contained, avoiding a hard dependency on EAS's own upgrade path and Monad deployment status.
3. This is a reversible decision, not a structural one — if EAS reaches production maturity on Monad before Phase 3, migrating to EAS-backed schemas while keeping the Attestia reputation layer on top is a valid post-MVP option, not a rewrite.

This tradeoff should be stated explicitly to any reviewer, investor, or design partner — "why not just use EAS" is a predictable first question, and the answer should be a documented decision, not an omission.

---

## 3. Product vision and principles

### Vision

Make verifiable work history portable across communities, while preserving the context needed to understand who made a claim, what evidence supported it, and whether it remains valid.

### Product principles

1. **Evidence before score.** Every score links back to inspectable claims and evidence.
2. **Specific claims, not generic endorsements.** Reviewers attest to authorship, completion, quality, usage, or provenance—not “this person is good.”
3. **Minimal onchain data.** Public chain data is permanent; never store PII, secrets, private files, or raw agent prompts.
4. **Revocation is first-class.** Every attestation state clearly shows active, revoked, expired, disputed, or superseded.
5. **Progressive Web3.** Browsing is walletless; signing occurs only when creating an identity, contribution, or attestation.
6. **Transparent scoring.** Display score version, inputs, confidence, and reason—not a mysterious universal number.
7. **Human control over agents.** Sensitive agent actions require explicit approvals in later enforcement phases.
8. **Portable by default.** Public records expose stable IDs, contract addresses, transaction hashes, and an API-friendly representation. In MVP, "portable" means portable **reads and verification** — the same record can be checked and reused by any community, app, or agent — not portable **presence across chains**; see the non-goal in §4.2.

---

## 4. Goals, non-goals, and success criteria

### 4.1 MVP goals

- Demonstrate a complete contribution → review → attestation → reputation update loop on Monad Testnet.
- Make every public record independently verifiable through contract events and explorer links.
- Resolve and display a human profile plus an ERC-8004-backed AI agent identity; writing a new agent registration is a stretch goal.
- Provide a provenance view that separates human input, AI assistance, sources, revisions, and reviewers.
- Allow revocation without deleting historical evidence.
- Give one pilot community a reviewer workflow and lightweight dashboard.

### 4.2 Non-goals for MVP

- Token issuance, staking, rewards, or governance.
- Universal identity/KYC or proof of personhood.
- Perfect sybil resistance or AI-content detection.
- Cross-chain writes or bridged reputation. *(This is a scope boundary, not a contradiction of the "portable trust" positioning — portability in MVP means any community/app/agent can independently read and verify a Monad-anchored record, not that the record itself moves across chains. State this distinction explicitly wherever "portable" is used externally, so the promise isn't overread.)*
- Fully private onchain attestations.
- Autonomous spending or custody for AI agents.
- General-purpose social network, chat, or algorithmic engagement feed.
- Marketplace settlement or paid agent-to-agent tasks.
- Onchain reputation score storage.

### 4.3 North-star metric

**Verified Contribution Completion Rate (VCCR):** percentage of submitted contributions that receive the required structured attestations within seven days.

### 4.4 Supporting metrics

| Area | Metric | MVP target hypothesis |
|---|---|---:|
| Activation | New users who publish one contribution | ≥ 40% |
| Review | Invited reviewers who submit a decision | ≥ 50% |
| Speed | Median time from submission to first attestation | < 48 hours |
| Trust | Contribution pages with accessible evidence | ≥ 90% |
| Portability | Profile badge/API views from outside pilot workspace | Track baseline |
| Retention | Contributors who submit a second contribution, or whose profile is read/verified from a second workspace, within 60 days | Track baseline |
| Reliability | Successful onchain writes | ≥ 98% excluding user rejection |
| UX | Core journey completion in usability testing | ≥ 4/5 participants |
| Security | Critical/high unresolved findings before mainnet | 0 |

Targets are hypotheses, not evidence. Recalibrate after the pilot. Retention is the real test of the "portable trust" positioning — badge *views* prove curiosity, repeat use across a second community proves the record is actually trusted elsewhere.

---

## 5. Users, roles, and permissions

### 5.1 Primary personas

**Contributor** — human submitting research, code, design, contract deployment, or bounty work. Needs portable proof without exposing private data.

**Reviewer / Attester** — maintainer, organizer, client, or collaborator verifying a specific claim. Needs enough evidence, clear criteria, and reversible decisions.

**Community Admin** — DAO or hackathon operator who configures accepted claim types, reviewer membership, and analytics. Needs anti-spam controls and exports.

**Agent Operator** — person or team registering an AI agent and declaring its capabilities, endpoints, provenance, and permissions.

**Verifier / Consumer** — recruiter, DAO, application, or another agent reading a profile or verification API. No wallet required for public reads.

### 5.2 Role matrix

| Action | Visitor | Contributor | Reviewer | Community Admin | Agent Operator |
|---|---:|---:|---:|---:|---:|
| View public profile/evidence | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create profile |  | ✓ | ✓ | ✓ | ✓ |
| Submit contribution |  | ✓ | ✓ | ✓ | ✓ |
| Edit offchain draft before anchoring |  | Own | Own | Workspace | Own |
| Issue attestation |  | If eligible | ✓ | ✓ | If eligible |
| Revoke own attestation |  | Own | Own | Own | Own |
| Mark dispute |  | Subject | Subject | ✓ | Subject |
| Configure workspace schemas |  |  |  | ✓ |  |
| Register/update agent card |  |  |  |  | Own agent |
| Change declared permission policy |  |  |  | Optional review | Own agent |

Contract authorization—not UI visibility—must enforce protected writes.

---

## 6. Core user journeys

### Journey A — Human contribution verification

1. User opens Attestia without a wallet and can browse public records.
2. User connects a wallet or creates an embedded wallet.
3. User signs a nonce-based authentication message; no transaction is required for login.
4. User creates a profile containing public display metadata stored offchain.
5. User submits a contribution draft, uploads evidence, adds source links, names collaborators, and discloses AI involvement.
6. Backend canonicalizes metadata, calculates a SHA-256 file digest and keccak256 metadata digest, then returns a review screen.
7. User signs and broadcasts `registerContribution` on Monad Testnet.
8. App shows optimistic pending state, then confirms at finalized state; transaction hash is visible.
9. User invites eligible reviewers by link.
10. Reviewer inspects evidence and issues a structured attestation.
11. Indexer receives the event and recalculates the profile’s category score.
12. Public profile displays active attestation, evidence, confidence, and score explanation.

### Journey B — Revocation and dispute

1. Attester opens an attestation they issued.
2. They select a reason, optionally attach a replacement reference, and confirm revocation.
3. Contract emits `AttestationRevoked`; the original record remains queryable.
4. Indexer marks it inactive and recomputes derived scores.
5. Subject sees a clear change history and may open a dispute with supporting evidence.
6. MVP dispute status is workflow metadata; it does not erase or adjudicate onchain history.

### Journey C — AI agent registration

1. Operator connects a wallet and selects **Register agent**.
2. App creates an ERC-8004-compatible agent card with name, description, endpoint types, capabilities, operator, and trust model.
3. Operator reviews a declared policy: allowed actions, blocked actions, spending ceiling, approval threshold, expiry, and emergency pause contact.
4. Public agent profile resolves ERC-8004 identity and displays Attestia contributions and attestations through an adapter.
5. A research contribution can list both the human and agent as collaborators, with a provenance split stated as a claim.

### Journey D — External verification

1. Consumer opens `/verify/{profileId}` or calls the Verification API.
2. Response contains profile, active and historical claims, source chain, block/transaction references, score version, and freshness timestamp.
3. Consumer can independently query the contract or explorer.
4. API never labels a profile “trusted” as an absolute conclusion; it returns evidence and categorized signals.

### 6.5 Edge cases and failure states

Journeys A–D above are happy paths. Design and engineering should build against this consolidated list rather than discovering these cases individually during QA:

| Situation | Required behavior |
|---|---|
| Wallet rejects or times out mid-signature | Return to the prior step with state preserved; never show a false "confirmed" state |
| User switches connected wallet mid-composer | Re-validate signer against the profile/session; block submission with a clear reason if mismatched |
| Duplicate submit (double-click, retry) on the same contribution | Idempotency key prevents a second onchain write; UI shows the existing pending/confirmed record instead of erroring blindly |
| Session/auth nonce expires mid multi-step upload | Preserve the offchain draft; prompt re-auth without losing uploaded evidence or typed fields |
| RPC succeeds but the app misses the response (dropped connection) | Reconcile by transaction hash on reconnect/reload before allowing resubmission |
| Reviewer invite expires with no response | Contribution stays in a visible "awaiting review" state, not silently stuck; admin/contributor can re-invite |
| Indexer lag between confirmed write and projection update | Profile shows a "processing" freshness indicator rather than looking like the write failed |
| Evidence file fails malware/type scanning after digest was already computed | Reject before onchain registration; never anchor a digest for content that was rejected offchain |
| Two attesters race to issue the same active claim type on one contribution | Contract-level supersession rule (§Epic 4) resolves order; UI explains which record is active and why |

---

## 7. Functional requirements and acceptance criteria

### Epic 1 — Authentication and profiles

**Requirements**

- Privy React SDK is the MVP authentication and embedded-wallet provider. Enable email login and external EVM wallets; provision an embedded Ethereum wallet on login only for users without a wallet.
- Configure Monad Testnet (`10143`) as the default and only supported chain in testnet environments. Configure Monad Mainnet (`143`) separately for production; never allow one deployment to write to both.
- Keep Privy behind an application `WalletProvider` boundary and use `wagmi` + `viem` for contract interaction, so identity/session handling does not become the contract data layer.
- Backend authorization verifies the Privy access token, app/audience, expiry, and linked wallet ownership before accepting protected API writes. A direct external-wallet fallback uses a one-time SIWE-style nonce bound to domain, URI, chain ID, issued-at, expiration, and wallet.
- Public profile: display name, bio, skills, role, communities, wallet, agent/human type, metadata URI, and contribution summary.
- No email, legal name, Discord ID, access token, or private metadata written onchain.
- Profile ownership transfer is excluded from hackathon MVP; wallet recovery relies on the wallet provider.

**Acceptance criteria**

- A visitor can browse public profiles without connecting a wallet.
- A user without an existing wallet can authenticate and receive one Privy embedded EVM wallet; wallet creation is not repeated on later sessions.
- An external-wallet user can authenticate without creating an embedded wallet.
- The application waits for Privy and wallet readiness before rendering protected actions, and an expired session returns to authentication without losing an offchain draft.
- A fallback login nonce is one-time, expires, and is bound to domain and wallet.
- The composer blocks a signer on the wrong chain or a wallet that no longer matches the authenticated profile.
- A user cannot update another profile.
- A profile page shows chain ID, contract address, transaction hash, and metadata integrity status.
- Broken metadata produces an explicit degraded state, not a blank page.

### Epic 2 — Contribution registry

**Supported types:** research, pull request, design, smart contract, bounty, community task, other.

**Required fields:** title, type, summary, creator profile, artifact digest, metadata digest/URI, visibility, timestamp, provenance declaration, source links, collaborator list.

**Acceptance criteria**

- Identical creator + artifact digest cannot be silently registered twice; UI warns and links existing record.
- Public artifacts are retrievable and match the anchored digest.
- Private artifacts store only digest and classification onchain; unauthorized users cannot retrieve the file.
- Contribution state shows draft, pending transaction, confirmed, disputed, or archived.
- Source URLs are validated for scheme and rendered safely.

### Epic 3 — Provenance

**Provenance fields**

- Human contribution description.
- AI assistance level: none, assistive, substantial, agent-led, undisclosed/unknown.
- Tools/models voluntarily disclosed.
- Source references with title, URL, digest where available, and access date.
- Revision parent and changelog.
- Collaborator roles.

**Acceptance criteria**

- UI states that provenance is a signed claim, not automatic detection.
- A revision creates a new metadata digest and links to the parent; it does not rewrite history.
- Sensitive prompts and credentials are rejected from public metadata guidance.
- Graph distinguishes claimed relationships from attested relationships visually.

### Epic 4 — Structured attestations

**MVP claim types**

- `COMPLETION`: stated deliverable exists.
- `AUTHORSHIP`: subject materially contributed.
- `QUALITY`: work satisfies a defined rubric.
- `USAGE`: work was used, merged, deployed, or accepted.
- `PROVENANCE`: disclosure appears consistent with available evidence.

**Fields:** subject contribution ID, attester, claim type, result, rubric/version, evidence digest/URI, issuedAt, validUntil optional, supersedes optional.

**Rubric governance:** each workspace owns and versions its own `QUALITY` rubric per claim type (see Epic 6). Publishing a new rubric version never rewrites existing attestations — they retain the rubric version active at issuance, and the UI always shows which version a given attestation was judged against.

**Acceptance criteria**

- Only the attester can revoke their attestation in the base contract.
- Revocation emits an event and never deletes the original event.
- Expired, revoked, disputed, and active states are distinct.
- A self-attestation is labeled and receives zero external-reputation weight by default.
- An attester cannot create the same active claim type twice for the same contribution without superseding the earlier record.
- UI requires a reason/evidence for negative or revoked claims.

### Epic 5 — Reputation and graph

**Requirements**

- Calculate offchain category signals: Delivery, Authorship, Quality, Usage, Provenance.
- Weight by attester eligibility, community context, evidence completeness, recency, and outcome status.
- Version every algorithm and retain recomputation history.
- Show raw counts and confidence alongside scores.

**MVP reputation model — evidence counts first**

```text
category signal = count of active external attestations
outcome signal = count grouped by completion, authorship, quality, usage, provenance
confidence context = unique attesters + evidence coverage + claim status
```

The MVP must not weight an undefined notion of “attester quality” or compress different categories into a universal trust score. A weighted model may be tested after pilot data exists:

```text
future claim weight = result × documented attester eligibility × evidence completeness × recency
```

Any later weighting must be versioned, reproducible, community-configurable where appropriate, and presented as a derived policy—not objective truth.

**Acceptance criteria**

- Every category displays active claim count, unique attester count, evidence coverage, and lifecycle states.
- Revocation changes the active count after indexer processing while preserving historical totals.
- Historical projections can be reproduced from immutable events and versioned rules.
- Self-attestations are labeled and excluded from external-attestation counts.
- Mutual-attestation clusters are flagged for analysis but do not silently alter MVP counts.
- Graph remains usable with at least 100 nodes by clustering and progressive disclosure.

### Epic 6 — Community workspace

**MVP features**

- Workspace profile and public slug.
- Reviewer allowlist managed by admin in application database.
- Configurable accepted contribution and claim types.
- Rubric authoring and versioning per `QUALITY` claim type; admin-only edit, version history retained.
- Review queue and status filters.
- CSV/JSON export.

**Acceptance criteria**

- Non-reviewers cannot access private evidence.
- Admin changes are audited.
- A rubric edit creates a new version; it never alters the rubric reference stored on already-issued attestations.
- Workspace removal does not erase contributor-owned public records.
- Export identifies source chain, contract, record ID, block, and score version.

### Epic 7 — Agent identity and policy

**Requirements**

- Integrate official ERC-8004 Identity Registry where available; do not deploy a competing transferable agent NFT in MVP.
- Read ERC-8004 Reputation Registry feedback separately from Attestia work attestations.
- Attach Attestia contributions to an ERC-8004 agent ID through an adapter mapping.
- Register a policy digest containing declared capabilities and approvals.

**Acceptance criteria**

- Agent ownership is resolved from ERC-8004 at read/write time.
- UI clearly labels ERC-8004 feedback versus Attestia attestations.
- Validation Registry is shown as unavailable until actually deployed; no simulated “verified” badge.
- Permission dashboard says **declared policy** unless an enforcing account/gateway is connected.
- Policy changes create a new version and retain history.

### Epic 8 — Feed and discovery

**MVP feed ranking**

1. Workspace relevance.
2. Active verified outcomes.
3. Evidence completeness.
4. Attester diversity.
5. Freshness with bounded decay.

Follower count and likes are excluded from ranking.

**Acceptance criteria**

- Feed explains its ranking factors.
- Users can filter by contribution type, community, skill, claim status, and human/agent.
- Repeated self-attestations do not improve ranking.
- New contributors have a discovery path through category filters, not only prior reputation.

---

## 8. Information architecture and key screens

```text
Public
├── Home / verified contribution feed
├── Explore people, agents, communities
├── Profile
│   ├── Overview
│   ├── Contributions
│   ├── Attestations
│   ├── Reputation explanation
│   └── Provenance graph
├── Contribution detail
│   ├── Artifact and integrity
│   ├── Provenance
│   ├── Reviews
│   └── History
└── Verify record

Authenticated
├── Dashboard
├── New contribution
├── Review queue
├── Attestation composer
├── Agent registration / policy
├── Workspace settings
└── Notifications
```

### Screen-level requirements

**Dashboard:** activation checklist, pending writes, review requests, score changes, recent contributions.  
**Contribution composer:** save draft offchain, visibility warning, file hashing progress, source and AI disclosure, transaction review.  
**Contribution detail:** evidence first, claim status, integrity check, collaborators, timeline, explorer links.  
**Attestation composer:** claim type, decision, rubric, evidence, expiry, conflict-of-interest disclosure, irreversible-public-action warning.  
**Profile:** categorized signals, confidence, claim counts, graph, badges, API/share link.  
**Agent policy:** owner, capabilities, allowed/blocked operations, monetary ceiling, approval requirement, expiry, enforcement status.

### Transaction UX states

`Draft → Awaiting signature → Submitted → Proposed → Finalized → Indexed`

- The UI may show fast feedback after a receipt is available, but marks it pending until the chosen confirmation threshold.
- For normal Attestia writes, mark final at Monad `Finalized` state.
- If future business logic triggers offchain financial consequences, wait for `Verified` state-root finality.
- Provide retry and reconciliation when RPC succeeds but the app misses the response.

---

## 9. Technical architecture

### 9.1 Recommended stack

| Layer | Selection | Rationale |
|---|---|---|
| Web app | Next.js 15+, React, TypeScript | Fast solo delivery, server rendering, API routes |
| UI | Tailwind CSS, shadcn/ui, Radix primitives | Accessible primitives and rapid iteration |
| Contract client | wagmi + viem `>=2.40.0` | Monad-compatible reads/writes, typed contract calls, and external-wallet interoperability |
| Auth + embedded wallet | **Privy React SDK (`@privy-io/react-auth`)** behind `WalletProvider` | Selected MVP stack: email/external-wallet login, sessions, and embedded EVM wallets for users without a wallet |
| Session verification | Privy access-token verification + secure HTTP-only application session; SIWE fallback for direct external-wallet login | Server-authorized writes, expiry, audience/domain binding, and recoverable sessions |
| Contracts | Solidity 0.8.x, OpenZeppelin pinned release | Standard access control, pause, EIP-712 helpers |
| Contract tooling | Official Foundry `>=1.8`, `network = "monad"` | Reproduces Monad execution/gas behavior |
| Chain | Monad Testnet (`10143`) then Mainnet (`143`) | Safe staged deployment |
| Indexer | Envio HyperIndex | TypeScript, GraphQL, event-focused and officially documented for Monad |
| Application DB | PostgreSQL (Supabase or managed Postgres) | Workspaces, access control, drafts, notifications, algorithm versions |
| Public artifacts | IPFS-compatible pinning | Content-addressed public evidence |
| Private artifacts | Cloudflare R2/S3 + KMS + signed URLs | Deletion/access controls; digest anchored onchain |
| Queue | Inngest / Trigger.dev / managed queue | Event reconciliation, notifications, retries |
| Cache/rate limit | Redis-compatible managed store | Nonces, sessions, API quotas, idempotency |
| Monitoring | Sentry + OpenTelemetry + uptime checks | Frontend/backend/indexer observability |
| CI/CD | GitHub Actions, Vercel preview, Foundry CI | Reproducible gates and preview environments |
| Analytics | PostHog with privacy controls | Funnel and product metrics, not reputation inputs |

### 9.2 System context

```text
Browser / Privy / Wallet
       │
       ├── reads ───────────────► Next.js Web + API
       │                              │
       │                              ├── PostgreSQL (drafts, ACL, workspaces)
       │                              ├── R2/IPFS (artifacts and metadata)
       │                              └── Redis/Queue (sessions, jobs, retries)
       │
       └── signed transactions ─► Monad RPC
                                      │
                         ┌────────────┼────────────┐
                         │            │            │
                  ProfileRegistry  Contribution  Attestation
                         │          Registry       Registry
                         └────────────┼────────────┘
                                      │ events
                                      ▼
                                Envio Indexer
                                      │ GraphQL
                                      ▼
                            API / reputation engine

ERC-8004 Identity + Reputation Registries ──► Agent adapter/read model
```

### 9.3 Architectural rules

- Blockchain is the integrity and authorization layer, not the query database.
- Events are the canonical history; indexer projections are rebuildable.
- PostgreSQL data never overrides an onchain owner or lifecycle state.
- Writes use idempotency keys and reconcile by transaction hash.
- Contract addresses, chain IDs, deployment blocks, ABI hashes, and version are environment configuration.
- Public RPC endpoints are acceptable for demos but production uses a provider with SLA and fallback.
- Avoid polling historical logs per page request; query the indexer.

### 9.4 Gas sponsorship and account abstraction

Privy is the selected MVP sponsorship path. Its current documentation lists app-paid gas sponsorship for Monad Mainnet and Monad Testnet and describes an EIP-7702/paymaster flow for EVM wallets. This documented capability is a dependency claim, not proof that Attestia's account and contract configuration works; Phase 1 must demonstrate it end to end.

- **Mechanism:** use Privy app-paid gas sponsorship for eligible EVM transactions. The client requests sponsorship explicitly; Attestia does not operate a custom bundler or paymaster in MVP.
- **Sponsorship scope:** sponsor only profile creation, `registerContribution`, `attest`, and `revoke` calls tied to an authenticated session and an allowlisted Attestia deployment. Never sponsor arbitrary targets or calldata.
- **Abuse prevention:** per-wallet daily sponsored-transaction cap, per-workspace monthly sponsorship budget, and a kill switch that falls back to self-paid gas without blocking the flow if the budget is exhausted.
- **Fallback UX:** if sponsorship is unavailable (budget exhausted, relayer down, or user is on an unsupported wallet), the app degrades to a normal self-paid transaction with a clear explanation — it never silently fails the write.
- **Acceptance:** two independent Privy users complete sponsored profile/contribution/attestation writes on Monad Testnet; the same flow succeeds self-paid when sponsorship is disabled; rejected signatures, wrong-chain wallets, duplicate requests, and provider outages preserve state and do not create duplicate records.
- **Cost visibility:** track sponsored-gas spend as an operating cost against the unit-economics model in §20; this is real MON spend against a live-mainnet price, not a testnet-only convenience (see §13).

### 9.5 Privy integration boundary

- Initialize `PrivyProvider` near the application root and render protected actions only after both authentication and wallet state report ready.
- Set explicit `defaultChain` and `supportedChains`; never rely on Privy's default network list. Testnet and production use separate Privy app clients, allowed origins, chain configuration, sponsorship budgets, and secrets.
- Create an embedded Ethereum wallet on login only for users without a wallet. Preserve the external-wallet path and never create an additional wallet silently.
- Keep Privy app secret and token verification server-side. The browser receives only the public app/client identifiers.
- Apply Privy's required CSP origins narrowly alongside Attestia's own `connect-src`, `frame-src`, and `child-src` requirements. Production CSP and allowed domains are release-gated configuration.
- Do not use Privy user IDs or login identifiers as onchain profile IDs. The profile remains wallet-owned and portable outside Privy.

### 9.6 Monad Execution Events decision

The Monad Execution Events SDK is not part of the MVP web stack. The official getting-started path offers C and Rust SDKs, supports historical-data exercises on macOS, and requires a self-hosted Monad node on Linux for real-time events. That operational footprint is disproportionate for the solo-builder MVP, so Envio remains the indexer in Phases 1–3.

Re-evaluate Execution Events during pilot hardening if Attestia needs lower-latency projections, independent event reconstruction, or analytics unavailable through the hosted indexer. Adoption requires a Linux node, replay/checkpoint design, equivalence tests against contract logs, monitoring, and a documented fallback to the canonical onchain event history.

---

## 10. Smart-contract design

### 10.1 Contract boundaries

**AttestiaProfileRegistry**

```solidity
createProfile(bytes32 profileId, string metadataURI, bytes32 metadataDigest)
updateProfile(bytes32 profileId, string metadataURI, bytes32 metadataDigest)
setDelegate(bytes32 profileId, address delegate, bool allowed)
```

Stores owner, active metadata pointer/digest, timestamps, and delegates. Profile IDs are deterministic or collision-checked. Do not store names or PII directly.

**ContributionRegistry**

```solidity
registerContribution(
  bytes32 contributionId,
  bytes32 creatorProfileId,
  bytes32 artifactDigest,
  bytes32 metadataDigest,
  string metadataURI,
  bytes32 parentId
)
archiveContribution(bytes32 contributionId)
```

Stores compact integrity fields and creator relationship. Collaborators, sources, AI disclosure, and type live in canonical metadata and emitted events; use mappings only for authorization-critical state.

**AttestationRegistry**

```solidity
attest(
  bytes32 attestationId,
  bytes32 contributionId,
  bytes32 claimType,
  int8 result,
  bytes32 evidenceDigest,
  string evidenceURI,
  uint64 validUntil,
  bytes32 supersedes
)
revoke(bytes32 attestationId, bytes32 reasonDigest, string reasonURI)
```

Stores issuer, subject, claim type, state, timestamps, and evidence integrity. Revocation is issuer-controlled. Organization arbitration can add dispute labels offchain in MVP; contract-level arbitration requires a separate reviewed design.

**AgentPolicyRegistry or profile extension**

```solidity
setAgentPolicy(uint256 erc8004AgentId, bytes32 policyDigest, string policyURI)
pausePolicy(uint256 erc8004AgentId)
```

Only current ERC-8004 agent owner/operator can update. This is a declared policy record until enforcement is connected.

### 10.2 Events

- `ProfileCreated`, `ProfileUpdated`, `DelegateChanged`
- `ContributionRegistered`, `ContributionArchived`
- `AttestationCreated`, `AttestationRevoked`, `AttestationSuperseded`
- `AgentPolicyUpdated`, `AgentPolicyPaused`

Each event includes indexed identifiers needed for profile, contribution, attester, and workspace projections. Avoid dynamic arrays in event filters; include metadata digest and URI for reconstruction.

### 10.3 Upgrade and administration strategy

**Hackathon recommendation:** immutable, versioned contracts with no proxy. If a schema changes, deploy V2 and update a public deployment registry/config. This reduces proxy and admin-key risk.

**Post-pilot option:** only adopt UUPS/transparent proxies if migration costs demonstrably exceed governance risk. Require multisig, timelock, storage-layout checks, upgrade simulations, and emergency documentation.

Use role separation only where needed:

- `PAUSER_ROLE` for emergency stopping of new writes.
- No admin ability to rewrite or delete attestations.
- Contract pause must not block reads or issuer revocation unless explicitly justified.

### 10.4 ERC-8004 integration decision

Use ERC-8004 for **agent identity and its native interaction feedback**, while Attestia owns **contribution-centric records and provenance**.

```text
ERC-8004 agentId
   ├── owner + agent card
   ├── ERC-8004 reputation feedback
   └── Attestia adapter
          ├── contributions
          ├── provenance
          ├── structured work attestations
          └── declared permission policies
```

Do not merge ERC-8004 feedback and Attestia scores silently. The Monad guide states that its Validation Registry is “coming soon”; therefore it is a future integration, not an MVP dependency.

**Spec-volatility risk:** ERC-8004 remains a Draft-status EIP as of the research cut-off, not a finalized standard — its Identity and Reputation Registry interfaces can still change before broader adoption settles. Pin the exact spec revision and registry address used per environment in the deployment manifest (§10.1), isolate all ERC-8004 calls behind the adapter described above so an interface change is a one-file fix, and budget re-integration time in any post-MVP roadmap rather than assuming the current interface is final.

---

## 11. Data model

### 11.1 Canonical entities

| Entity | Key fields |
|---|---|
| Profile | id, chainId, owner, type, metadataDigest/URI, createdAt |
| AgentLink | profileId, ERC-8004 agentId, registry address, owner snapshot |
| Contribution | id, creatorProfileId, artifactDigest, metadataDigest/URI, parentId, state |
| Collaborator | contributionId, profileId/address, role, claimed share, acceptance state |
| Source | contributionId, kind, URL, digest, accessedAt |
| Provenance | contributionId, AI level, tools, human input, revision notes, disclosure version |
| Attestation | id, contributionId, attester, claim type, result, evidence, validity, state |
| Workspace | id, slug, metadata, plan, policy version |
| ReviewerMembership | workspaceId, profileId, role, start/end, audit fields |
| ScoreSnapshot | profileId, category, value, confidence, algorithmVersion, source block |
| AgentPolicy | agentId, version, digest/URI, enforcement type, active/paused |
| Dispute | target type/id, opener, reason, evidence, status, resolution metadata |

### 11.2 Public metadata example

```json
{
  "schema": "attestia.contribution.v1",
  "title": "Monad research report",
  "type": "research",
  "summary": "...",
  "artifact": {"uri": "ipfs://...", "sha256": "..."},
  "creatorProfileId": "0x...",
  "collaborators": [{"profileId": "0x...", "role": "reviewer"}],
  "provenance": {
    "aiAssistance": "substantial",
    "humanInput": "Scope, source selection, review, and final edits",
    "tools": ["model/provider as disclosed"],
    "sources": [{"url": "https://docs.monad.xyz", "accessedAt": "..."}]
  },
  "revision": {"parentId": null, "notes": "Initial version"}
}
```

Canonicalize JSON before hashing. Define UTF-8 encoding, key ordering, number representation, excluded fields, and digest algorithm in a public schema document.

### 11.3 Onchain versus offchain

| Onchain | Offchain |
|---|---|
| IDs, owners, digests, compact status, timestamps | Titles, descriptions, images, files, detailed rubrics |
| Contribution/attestation lifecycle events | Search index, graph projection, notifications |
| Revocation/supersession references | Drafts, private workspace evidence, ACLs |
| Agent policy digest and version | Human-readable policy and approval context |
| Contract version/deployment provenance | Reputation calculations and algorithm versions |

---

## 12. API requirements

### Public endpoints

- `GET /api/v1/profiles/{id}`
- `GET /api/v1/profiles/{id}/contributions`
- `GET /api/v1/contributions/{id}`
- `GET /api/v1/contributions/{id}/attestations`
- `GET /api/v1/agents/{chainId}/{agentId}`
- `GET /api/v1/verify/{recordType}/{id}`
- `GET /api/v1/feed?type=&community=&status=&cursor=`

### Authenticated endpoints

- `POST /api/auth/nonce`, `POST /api/auth/verify`, `POST /api/auth/logout`
- `POST /api/v1/uploads/presign`
- `POST /api/v1/contributions/draft`
- `POST /api/v1/review-invitations`
- `POST /api/v1/disputes`
- Workspace reviewer and policy endpoints.

### Response integrity envelope

```json
{
  "data": {},
  "source": {
    "chainId": 10143,
    "contract": "0x...",
    "recordId": "0x...",
    "transactionHash": "0x...",
    "blockNumber": "...",
    "confirmation": "finalized",
    "indexedAt": "..."
  },
  "score": {
    "algorithmVersion": "reputation-v1",
    "computedAt": "..."
  }
}
```

Use cursor pagination, ETags, documented rate limits, API keys for paid plans, and separate quotas for public and organization APIs.

---

## 13. Monad and Ethereum implementation notes

### 13.1 EVM compatibility

Monad uses Ethereum’s address space and familiar transaction envelopes, supporting transaction types 0, 1, 2, and 4. Type 3 blob transactions are not supported. Attestia does not require blobs.

### 13.2 Monad-specific behavior that affects Attestia

- Use official Foundry v1.8+ with `network = "monad"`; older tools do not reproduce current Monad execution behavior.
- Monad charges the transaction’s **gas limit**, not actual gas used. Set realistic explicit limits after measurement; avoid oversized limits.
- Storage access is warmed in 128-slot pages. Keep related state contiguous, but prioritize clarity and security over speculative micro-optimization.
- Blocks are frequent; multiple blocks can share the same second-level `block.timestamp`. Never use timestamp alone for unique IDs or ordering.
- No global mempool. The product should not depend on pending-transaction subscriptions.
- Full nodes do not expose arbitrary historical state indefinitely. Persist event projections and source block metadata with an indexer.
- Public RPCs are rate-limited. Batch reads, cache immutable records, and use production RPC fallback.
- Standard Solidity semantics remain serially equivalent despite parallel execution. Do not add unsafe concurrency assumptions to contracts.
- **Mainnet is a live, real-value network, not a future target.** Monad mainnet has been running since late November 2025 with a real MON token; treat every mainnet deployment decision (gas limits, sponsorship budget, upgrade timing) as a real-money decision from Phase 5 onward, not a low-stakes formality. The network has an active upgrade/hard-fork cadence — re-verify current gas/execution assumptions against the live fork immediately before each mainnet deploy, not just once at design time.

### 13.3 Confirmation policy

- **Proposed/receipt available:** show fast pending feedback.
- **Finalized:** mark normal profile, contribution, and attestation writes complete.
- **Verified:** required only if a future action triggers material offchain financial/legal consequences.

### 13.4 Pre-deploy verification checklist (recurring, not one-time)

At the research cut-off, Monad’s deployment summary and gas-pricing pages show different block gas limits (150M versus 200M). Attestia should not hardcode block-level capacity assumptions; read network behavior through current tooling and pin documentation/tool versions in release notes. Given Monad's active upgrade cadence (§13.2), treat this as a **recurring gate**, not a one-time check:

- Re-read current gas-limit and execution-mode documentation immediately before every mainnet deployment or contract redeploy.
- Check for announced or recent hard forks/network upgrades in the weeks around any deploy window; exchanges and infra providers pausing deposits/withdrawals is a visible signal an upgrade is imminent.
- Re-verify the ERC-8004 registry address and interface version for the target environment (§10.4) at the same time, since both are moving targets.

### 13.5 Ethereum design baseline

Follow Ethereum’s established model for accounts, signed transactions, smart contracts, events/logs, JSON-RPC, offchain storage, contract testing, source verification, and secure development. Treat contract code and public chain data as permanent and adversarially accessible.

---

## 14. Security, privacy, and abuse prevention

### 14.1 Threat model

| Threat | Control |
|---|---|
| Fake profiles / sybils | Workspace reviewer eligibility, wallet age/context signals, quotas, no self-score weight |
| Mutual-attestation rings | Graph clustering, reciprocal-edge flags, attester diversity limits |
| False authorship | Source evidence, collaborator acceptance, challenge/dispute, issuer history |
| Malicious metadata/URLs | Allowlisted schemes, escaping, CSP, malware scanning, no inline HTML |
| Signature replay | Domain, URI, chain ID, nonce, issued-at, expiration; consume nonce atomically |
| Contract authorization bypass | Owner/delegate checks, invariant/fuzz tests, least privilege |
| Revocation censorship | Issuer-controlled direct contract call remains available even if UI fails |
| Private evidence leak | KMS encryption, signed URLs, per-workspace ACL, audit logs, no public IPFS |
| Hash ambiguity | Canonical JSON and documented digest algorithms |
| Indexer inconsistency | Idempotent `(chainId, txHash, logIndex)` IDs; reorg/finality reconciliation |
| RPC outage | Provider fallback, retry with backoff, transaction-hash reconciliation |
| Admin compromise | Multisig for production roles; no admin mutation of user claims |
| Agent overreach | Clearly label declared versus enforced permissions; default deny in future gateway |
| API scraping / abuse | Tiered quotas, rate limits, anomaly monitoring, privacy-safe exports |

### 14.2 Smart-contract controls

- Checks-effects-interactions; minimize external calls.
- Custom errors, explicit bounds, zero-address checks, collision checks.
- Reentrancy guard only where external calls exist; avoid unnecessary complexity.
- No arbitrary `delegatecall`, unbounded loops, or user-controlled external execution.
- EIP-712 typed signatures only if meta-transactions are introduced; include chain ID and verifying contract.
- Invariant tests for ownership, uniqueness, revocation, supersession, and immutability.
- Static analysis with Slither and manual review before mainnet.
- Verify source and publish deployment manifest.

### 14.3 Privacy rules

- Assume every onchain value and public IPFS object is permanent.
- Never upload secrets, access tokens, private prompts, legal documents, private emails, health data, or unredacted personal data.
- Hashes of low-entropy sensitive data can still be guessed; salt or avoid anchoring such data.
- Public profile deletion means hiding offchain presentation and stopping future use; it cannot erase onchain history.
- Consent and retention policies apply to private organization evidence.

### 14.4 Content moderation and disputes

MVP supports report, hide-from-default-view, dispute, and revocation. It does not promise decentralized adjudication. Illegal-content takedown affects hosted metadata/storage and UI, while the chain digest remains. Publish clear terms describing this boundary.

### 14.5 Legal and regulatory considerations

These risks are named in §22 but need a concrete product/process answer, not just a mitigation label:

- **GDPR right-to-erasure vs. immutable digests.** A `keccak256` digest of low-entropy or guessable personal data may still be considered personal data under some interpretations even though it isn't reversible in practice. Before any EU user data is anchored, get an explicit legal position on why digests of the specific fields Attestia anchors are not personal data (or salt/avoid anchoring the ones that are) — do not rely on "it's just a hash" as an unreviewed assumption.
- **Defamation exposure from negative or failed attestations.** A public `QUALITY: fail` or disputed `AUTHORSHIP` claim is a hosted, indexed, scored statement about an identifiable person. Add a legal-review gate specifically before negative/failed claim types go live in a public pilot — this is narrower and more urgent than the general "counsel before scale" note in §22.
- **Terms of service and liability posture.** Publish terms that clearly state Attestia hosts and indexes third-party claims rather than asserting them as its own, mirroring the "declared, not enforced" language already used for agent permissions (§Epic 7). Draft this alongside the moderation/retention policies required by the mainnet-pilot release checklist (§21).
- **Sanctions/basic wallet screening.** Before onboarding the first paid Enterprise/API customer, add lightweight sanctions-list screening for organization accounts and payment paths — this is a standard compliance expectation for any paid B2B product touching wallets, independent of Attestia's Web3-specific risks.

---

## 15. Non-functional requirements

| Category | Requirement |
|---|---|
| Availability | 99.5% pilot target for web/API, excluding chain/RPC incidents |
| Performance | LCP <2.5s p75; cached profile API <500ms p95; indexed update visible <10s target |
| Accessibility | WCAG 2.2 AA for core flows; keyboard, focus, contrast, reduced motion |
| Responsiveness | Mobile-first; full functionality at 360px width |
| Reliability | At-least-once event ingestion with idempotent materialization |
| Consistency | Onchain state wins; stale index state displays freshness and resync option |
| Observability | Correlation ID from API request to tx hash/indexer event; alerts on lag/failures |
| Portability | Export JSON/CSV; stable IDs and versioned schemas |
| Internationalization | English MVP; externalize strings from day one |
| Browser support | Current and previous major Chrome, Safari, Firefox, Edge |
| Recovery | Daily DB backups; documented index rebuild from deployment blocks |
| Support | One published channel (email or Discord) for abuse reports, disputes, and support requests; target first response within 2 business days during pilot |

---

## 16. Testing strategy

### Smart contracts

- Unit tests for every write, revert, state transition, and event.
- Fuzz tests for IDs, metadata lengths, validity windows, duplicate/supersession sequences.
- Invariants: owner cannot be overwritten; revoked record cannot reactivate; history cannot disappear; unauthorized user cannot mutate.
- Gas snapshots using Monad execution mode.
- Fork/testnet integration tests and explorer/source verification.
- Slither, dependency audit, and independent human review.

### Web/API

- Unit tests for canonicalization, hash verification, scoring, auth nonce handling.
- Privy integration tests for email and external-wallet login, one-time embedded-wallet provisioning, access-token rejection, session expiry, wallet/profile mismatch, and explicit Monad chain configuration.
- Sponsored-transaction tests for success, user rejection, budget exhaustion, provider failure, idempotent retry, and the self-paid fallback.
- Integration tests against local Anvil `--network monad`.
- Contract/API schema tests from generated ABIs.
- Playwright end-to-end: connect/login, submit, attest, revoke, verify.
- Permission and private-file tests with negative cases.
- Accessibility tests using axe plus manual keyboard/screen-reader checks.

### Indexer and data

- Replay fixtures, duplicate event ingestion, delayed events, malformed metadata.
- Finality/reconciliation test and full projection rebuild.
- Score determinism: same event set + same algorithm version = same output.
- Load test feed and graph queries with synthetic data, not mainnet user data.

### Usability test tasks

1. Publish one contribution and explain what is public.
2. Review evidence and issue an authorship attestation.
3. Locate the transaction and verify its status.
4. Revoke an attestation and explain what changed.
5. Compare claimed versus attested provenance.

Collect completion, errors, time-on-task, confidence, and qualitative confusion. Five participants are sufficient for an early directional round, not statistical proof.

---

## 17. Development phases

### Track A — 10-day hackathon build

| Day | Focus | Deliverable / exit gate |
|---:|---|---|
| 1 | Scope and design | Locked schemas, claim taxonomy, wireflow, threat model |
| 2 | Contract skeleton | Profile, contribution, attestation interfaces; failing tests |
| 3 | Contract implementation | Unit/fuzz tests pass in Monad execution mode |
| 4 | App foundation | Next.js shell, Privy auth/embedded wallet, explicit Monad chain config, design system |
| 5 | Contribution flow | Artifact hashing, metadata upload, register transaction |
| 6 | Attestation flow | Review invite, attest, revoke, explorer links |
| 7 | Indexer and reputation | Envio projection, v1 transparent score, refresh handling |
| 8 | Agent integration | ERC-8004 agent read/register path and declared policy |
| 9 | QA and hardening | E2E, accessibility, security checks, failure states |
| 10 | Demo and submission | Seeded narrative, verified contracts, README, video, fallback recording |

**Hackathon cut line:** the non-negotiable release is identity → contribution → provenance → attestation → revocation → updated active counts. If behind schedule, drop workspace private evidence, feed ranking, embedded wallet, disputes, and the agent permission dashboard before dropping that core loop. ERC-8004 agent identity may remain a read-only integration if its write flow threatens the release gate.

### Track B — Production-minded roadmap

#### Phase 0 — Discovery and architecture (Week 1)

- Optionally interview 3–5 design-partner stakeholders; this is research, not an exit requirement.
- Optionally validate claim taxonomy and reviewer incentives with stakeholders.
- Define public/private evidence policy and canonical schemas.
- Produce wireframes, threat model, ADRs, analytics plan.

**Gate (updated 12 September 2026):** engineering specification, schemas, architecture, threat model, wireflow, tests, and Phase 1 handoff are complete. The former partner-commitment, interview, and privacy-review exit requirements are deprecated and non-blocking.

#### Phase 1 — Onchain core (Weeks 2–3)

- Implement versioned immutable registries.
- Foundry tests, fuzzing, invariants, gas snapshots.
- Deployment scripts and manifest.
- Deploy and verify on Monad Testnet.

**Gate:** all contract CI passes; no critical/high internal findings; manual revoke works through Cast.

#### Phase 2 — Contributor/reviewer MVP (Weeks 4–5)

- Privy auth, embedded/external wallets, profiles, contribution composer, artifact integrity.
- Attestation/revocation flow and explorer links.
- Envio indexer and public read API.
- Transaction recovery and error handling.

**Gate:** complete end-to-end flow works from two independent wallets.

#### Phase 3 — Reputation, graph, and agent (Weeks 6–7)

- Versioned category scoring and explanation UI.
- Provenance graph with claimed/attested distinction.
- ERC-8004 adapter and agent policy declaration.
- Basic feed and filters.

**Gate:** revoke event updates score and graph; agent ownership is resolved from registry.

#### Phase 4 — Pilot hardening (Week 8)

- Workspace reviewer controls, private evidence ACL, export.
- Security review, accessibility/usability test, load test.
- Monitoring, backups, incident playbook, privacy/terms draft.

**Gate:** pilot checklist signed; known limitations published; rollback and index rebuild tested.

#### Phase 5 — Mainnet pilot (Weeks 9–10)

- Multisig/admin setup, production RPC and storage.
- Mainnet deploy/verify, capped invitation pilot.
- Measure activation, review conversion, and indexing reliability.

**Gate:** two-week stable pilot before open signup; zero unresolved critical/high issues.

#### Phase 6 — Organization monetization (Post-pilot)

- Billing, API keys/quotas, organization analytics, custom rubrics.
- White-label/embed SDK only after repeated demand.
- Agent enforcement gateway and stronger validation only after separate security design.

---

## 18. Team, environments, and delivery process

### Solo-builder responsibilities

- Product/design, frontend, contracts, backend/indexer, QA, and DevOps are one owner; therefore scope discipline is a release requirement.
- Use managed infrastructure and generated clients where possible.
- Request independent contract review before mainnet even if formal audit is unavailable.

### Succession and key-person risk

A product whose value proposition is durable, portable trust cannot credibly run on a single point of failure indefinitely. Before the mainnet pilot (§17 Phase 5):

- Add at least one additional multisig signer beyond the solo builder (a co-founder, advisor, or trusted community member) so pause/admin actions don't depend on one person's availability.
- Document a dead-man's-switch or handoff process: who gets signer access, deployment credentials, and DNS/infra control if the solo builder is unreachable for an extended period.
- Treat this as a real diligence question from any design partner or investor, not an edge case — answer it in writing rather than leaving it implicit.

### Environments

| Environment | Chain | Purpose |
|---|---|---|
| Local | Anvil `--network monad` | Fast contract/integration tests |
| Preview | Monad Testnet | Per-branch app preview, shared test contracts or isolated deployment |
| Staging | Monad Testnet | Stable demo, seeded test identities |
| Production | Monad Mainnet | Invitation-only pilot, then public |

### CI quality gates

1. Formatting, lint, typecheck.
2. Web/API unit tests.
3. `forge test --network monad` with fuzz/invariants.
4. Static analysis and dependency/license scan.
5. Contract size and gas snapshot diff.
6. Build, preview deployment, Playwright smoke tests.
7. Manual approval for contract deployment.

Never place deployer keys in repository or preview environment. Use protected secrets and a hardware/multisig signing process for production.

---

## 19. Analytics and experiment plan

### Event taxonomy

- `wallet_connected`, `auth_verified`, `profile_created`
- `contribution_draft_started`, `artifact_hashed`, `transaction_submitted`, `contribution_confirmed`
- `review_invited`, `review_opened`, `attestation_submitted`, `attestation_revoked`
- `score_explanation_opened`, `profile_shared`, `verification_api_called`
- `agent_registered`, `policy_published`
- `second_contribution_submitted`, `profile_verified_from_new_workspace` (retention signal, §4.4)

Do not send wallet addresses, evidence contents, or private metadata to generic analytics. Use pseudonymous internal IDs and consent controls.

### Initial experiments

1. **Reviewer request framing:** evidence checklist versus open request; measure completion.
2. **Wallet timing:** connect at entry versus only before publish; measure activation.
3. **Score presentation:** category bars + evidence counts versus single score; measure comprehension, not clicks.
4. **Badge utility:** public badge on bounty applications; measure external verification views.
5. **Retention driver:** prompt for a second contribution immediately after first attestation versus a delayed nudge; measure 60-day repeat-submission rate (§4.4).

---

## 20. Business model implementation

### Packaging hypothesis

**Individual — Free**
- Public profile, contributions, basic attestations, badge, export.

**Community — $29–$99/month hypothesis**
- One workspace, reviewer roles, private review queue, custom rubric, basic analytics.

**Organization — $199–$499/month hypothesis**
- Multiple workspaces, SSO later, advanced rules, private evidence, audit exports, priority support.

**API — Usage based**
- Verification and provenance queries, webhooks, higher rate limits.

**Enterprise — Custom**
- Dedicated indexing, compliance controls, retention policies, white-label embed.

Do not monetize attestation issuance itself in MVP; pay-to-attest creates trust and spam conflicts. If premium verification is explored, charge for workflow/service-level guarantees, not for a positive result.

### Unit economics and willingness-to-pay validation

Every price above is a hypothesis with zero supporting evidence. Before committing engineering time to billing infrastructure:

- **Cost baseline first.** Estimate solo-builder monthly infra cost at expected pilot scale — RPC/indexer hosting (Envio), IPFS pinning, KMS + private object storage, and sponsored-gas spend (§9.4) — to know how many free-tier users the model can absorb before the free tier becomes a net cost problem.
- **Validate willingness-to-pay before pricing pages exist.** During Phase 0 discovery interviews (§17), explicitly ask design-partner admins what they currently pay for reviewer/workflow tooling and whether $29–$499/month is plausible for their org size — do not wait until Phase 6 to learn the pricing was wrong.
- **No market-sizing claim yet.** This PRD makes no TAM/SAM/SOM claim for DAO/hackathon reputation tooling; treat that as an open research task for whoever owns fundraising or investor conversations, not an assumption baked into the roadmap.

### Go-to-market sequence

1. One hackathon/DAO design partner.
2. Seed 10–20 credible reviewers and import/link verifiable GitHub outcomes.
3. Publish portable profiles and badges.
4. Measure whether another community actually uses the record.
5. Sell workspace workflow and API reliability—not speculative token upside.

---

## 21. Release checklist

### Testnet demo

- [ ] Three registries deployed and source verified.
- [ ] Privy login works for a walletless user and an external-wallet user; embedded-wallet creation occurs only when needed.
- [ ] Monad Testnet is explicitly configured as the allowed chain; wrong-chain submission is blocked.
- [ ] One sponsored write and the self-paid fallback both succeed end to end.
- [ ] Deployment manifest includes chain, address, block, compiler, commit, ABI hash.
- [ ] Human profile, agent, contribution, two attestations, and revocation visible.
- [ ] Metadata digest verification succeeds.
- [ ] Revocation updates score and graph.
- [ ] Explorer links and API envelope work.
- [ ] Demo can recover from rejected signature and RPC delay.
- [ ] README explains privacy and limitations.

### Mainnet pilot

- [ ] Independent contract review complete.
- [ ] No unresolved critical/high findings.
- [ ] Multisig and pause runbook tested.
- [ ] Production RPC fallback, monitoring, backups, and index rebuild tested.
- [ ] Terms, privacy notice, moderation, dispute, and retention policies published.
- [ ] Gas limits measured under Monad execution mode.
- [ ] Accessibility and five-person usability round complete.
- [ ] Incident owner and communication channel assigned.

---

## 22. Risks, dependencies, and open questions

### Major risks

| Risk | Severity | Product response |
|---|---|---|
| Cold-start trust graph | High | Begin with one bounded community and credible reviewer set |
| Reputation gaming | High | Evidence, diversity, graph signals, transparent categories; no universal score |
| Permanent privacy mistakes | Critical | Data classification, warnings, private store, pre-publish review |
| Agent permission overclaim | High | Label declaration/enforcement status; no autonomous spend in MVP |
| Reviewer fatigue | High | Specific rubrics, reminders, compact flow, no unnecessary transactions |
| Indexer/vendor dependency | Medium | Event-rebuild path, provider abstraction, source blocks |
| Contract immutability bugs | Critical | Minimal contracts, tests, review, testnet, versioned redeploy |
| Metadata availability | Medium | Pinning redundancy, integrity state, export |
| Regulatory/defamation concerns | High | Structured factual claims, evidence, disputes, moderation, and a specific pre-publish legal gate for negative claims and EU personal data (§14.5) |
| ERC-8004 spec volatility | Medium | Draft-status EIP; pin spec revision, isolate calls behind adapter, budget re-integration time (§10.4) |
| Solo-builder key-person risk | High | Second multisig signer and documented handoff process before mainnet pilot (§18) |
| Design partner fails to materialize | Medium | Have a self-seeded fallback community/reviewer set ready rather than blocking the pilot entirely on one relationship |

### Dependencies

- Monad Testnet/Mainnet RPC and explorers.
- Privy React SDK, app/client configuration, allowed domains, token verification, embedded-wallet availability, and Monad sponsorship support; pin the tested SDK version and keep self-paid writes available.
- Official Foundry v1.8+ and viable viem version.
- ERC-8004 registry availability/address verification per environment — re-verify per §13.4, since the spec is still Draft status.
- Indexer support and hosted limits.
- IPFS pinning and private object storage.
- A real pilot organization and reviewers — treat as a soft dependency with the fallback above, not a hard blocker.

### Open product decisions

1. Can anyone attest, or only workspace-approved reviewers for scored claims?
2. Should subjects explicitly accept authorship/collaboration links?
3. Which evidence types can be public by default?
4. How are negative claims moderated without hiding legitimate criticism?
5. Which organization identity proof is sufficient for reviewer weighting?
6. Does a profile remain wallet-bound or support social recovery/delegates at launch?
7. What exact events count as `USAGE`: merged PR, deployed contract, accepted bounty, or organizer confirmation?
8. Is private evidence needed for the first pilot, or should MVP be public-only?
9. Which fields are portable standards versus Attestia-specific extensions?
10. Who owns and versions reputation policy: Attestia, each community, or both?

---

## 23. Definition of MVP done

The MVP is done only when a fresh evaluator can, using two wallets and no developer intervention:

1. Create a human profile.
2. Resolve and display one existing ERC-8004 agent as a linked identity; new agent registration is a stretch criterion.
3. Publish a contribution with inspectable provenance and valid hash.
4. Issue two different structured attestations.
5. Revoke one and observe an explainable change in active category counts.
6. Verify all writes through Monad explorer links.
7. Export or query the same record through a versioned API.
8. Understand which claims are self-declared, reviewer-attested, active, revoked, or disputed.

A beautiful profile with mocked transactions does not satisfy this definition.

---

## 24. Recommended next actions

1. Confirm the MVP wedge and choose one pilot contribution type.
2. Decide whether MVP evidence is public-only; this can remove major ACL scope.
3. Document the build-vs-integrate decision against EAS (§2.4) before freezing contract interfaces — don't let it surface for the first time in a design-partner or investor conversation.
4. Validate ERC-8004 addresses and interface version on the target testnet before implementation, and re-check given its Draft-EIP status (§10.4).
5. Freeze `attestia.contribution.v1` and five claim-type schemas.
6. Wireframe the contribution, attestation, revocation, and score-explanation flows.
7. Create separate Privy testnet and production app clients, then prove authentication, embedded-wallet creation, one sponsored write, and the self-paid fallback on Monad Testnet (§9.4–9.5).
8. Start contract development test-first in official Monad Foundry mode.
9. Run Phase 0 discovery interviews with an explicit willingness-to-pay question (§20), not just workflow validation.
10. Get an explicit legal read on the GDPR digest question and the defamation-gate design (§14.5) before any public negative-claim pilot.
11. Add a second multisig signer and document the succession/handoff process (§18) before the mainnet pilot gate.
12. Build a seeded demo narrative only after the real end-to-end path works.

---

## 25. References

### Source document

- *Attestia — Business and Product Model*, supplied PDF, 4 pages.

### Monad official documentation

- [Monad Documentation](https://docs.monad.xyz/)
- [Deployment Summary for Developers](https://docs.monad.xyz/developer-essentials/summary)
- [Differences between Monad and Ethereum](https://docs.monad.xyz/developer-essentials/differences)
- [Transactions](https://docs.monad.xyz/developer-essentials/transactions)
- [Gas Pricing](https://docs.monad.xyz/developer-essentials/gas-pricing)
- [Best Practices for High Performance Apps](https://docs.monad.xyz/developer-essentials/best-practices)
- [Foundry on Monad](https://docs.monad.xyz/tooling-and-infra/toolkits/foundry)
- [Indexing Frameworks](https://docs.monad.xyz/tooling-and-infra/indexers/indexing-frameworks)
- [ERC-8004 Trustless Agents on Monad](https://docs.monad.xyz/guides/erc-8004)
- [Monad Execution Events — Getting Started](https://docs.monad.xyz/execution-events/getting-started/index)
- [Monad Mainnet Information](https://docs.monad.xyz/developer-essentials/network-information)
- [Monad Testnet Information](https://docs.monad.xyz/developer-essentials/testnet)

### Privy and Metropolis

- [Metropolis — Privy track](https://hackathon.monad.xyz/tracks/privy) — participant authentication is required to view the full current bounty detail; re-check its criteria before submission.
- [Privy documentation](https://docs.privy.io/)
- [Privy React quickstart](https://docs.privy.io/basics/react/quickstart)
- [Privy access tokens](https://docs.privy.io/authentication/user-authentication/access-tokens)
- [Configure EVM networks](https://docs.privy.io/basics/react/advanced/configuring-evm-networks)
- [Privy chain support](https://docs.privy.io/wallets/overview/chains)
- [Privy gas sponsorship](https://docs.privy.io/wallets/gas-and-asset-management/gas/overview)
- [Privy content-security-policy guidance](https://docs.privy.io/security/implementation-guide/content-security-policy)

### Ethereum official documentation

- [Ethereum Developer Documentation](https://ethereum.org/developers/docs/)
- [Accounts](https://ethereum.org/developers/docs/accounts/)
- [Transactions](https://ethereum.org/developers/docs/transactions/)
- [Smart Contracts](https://ethereum.org/developers/docs/smart-contracts/)
- [Smart Contract Anatomy and Events](https://ethereum.org/developers/docs/smart-contracts/anatomy/)
- [Testing Smart Contracts](https://ethereum.org/developers/docs/smart-contracts/testing/)
- [Smart Contract Security](https://ethereum.org/developers/docs/smart-contracts/security/)
- [Authentication](https://ethereum.org/developers/docs/ethereum-stack/authentication/)
- [JSON-RPC](https://ethereum.org/developers/docs/apis/json-rpc/)
- [Storage](https://ethereum.org/developers/docs/storage/)
- [Blockchain Data Storage Strategies](https://ethereum.org/developers/docs/data-availability/blockchain-data-storage-strategies/)
- [Decentralized Identity](https://ethereum.org/decentralized-identity/)

### Attestation/reputation ecosystem (competitive landscape, §2.4) — added in v1.1

- [Ethereum Attestation Service](https://attest.org/) — [EAS documentation](https://docs.attest.org/)
- [ERC-8004: Trustless Agents (EIP draft)](https://eips.ethereum.org/EIPS/eip-8004) — canonical spec, distinct from the Monad integration guide above; confirm Draft status has not changed before relying on interface stability (§10.4)

### Monad network status verification — added in v1.1

- [Monad Foundation — mainnet and MON token launch announcement](https://www.monad.xyz/announcements/monads-mission-why-monad) — confirms public mainnet went live 24 November 2025, not a future target (§13.2)

> Network parameters, tooling versions, registry deployments, and third-party provider support can change. Re-check official documentation immediately before deployment. This applies with extra force to §2.4's competitive landscape and §10.4's ERC-8004 status: both areas move quickly and should be re-verified, not assumed stable, at each major build milestone.

---

## Appendix A — Glossary

| Term | Meaning in this document |
|---|---|
| **Attestation** (Attestia sense) | An application-level trust claim about a contribution (e.g., `QUALITY: pass`) — not an Ethereum proof-of-stake consensus attestation (§2.2). |
| **VCCR** | Verified Contribution Completion Rate — the north-star metric: % of submitted contributions receiving required attestations within 7 days (§4.3). |
| **Digest** | A hash (e.g., SHA-256 or keccak256) anchored onchain to prove integrity of offchain content, without storing the content itself (§11.2). |
| **Metadata URI / digest** | Pointer to and integrity check for the offchain JSON describing a profile, contribution, or attestation in detail. |
| **Declared vs. enforced (permission)** | "Declared" means an agent's policy is recorded and auditable; "enforced" means an external gateway/smart account actually blocks disallowed actions. MVP is declared-only (§2.2, Epic 7). |
| **ERC-8004** | Draft-status Ethereum standard providing Identity, Reputation, and Validation registries for AI agents (§10.4, §13). |
| **EAS** | Ethereum Attestation Service — a generic, prior-art onchain/offchain attestation protocol; see the build-vs-integrate discussion in §2.4. |
| **Supersession** | When a new attestation explicitly replaces an earlier one of the same claim type, rather than silently duplicating it (Epic 4). |
| **Rubric** | The workspace-defined criteria a `QUALITY` claim is judged against; versioned per workspace, never retroactively changed on existing attestations (Epic 4, Epic 6). |
| **Finalized / Verified (Monad confirmation states)** | Monad-specific confirmation thresholds; "Finalized" is sufficient for normal writes, "Verified" (state-root finality) is reserved for material offchain financial/legal consequences (§13.3). |
| **Portable (trust)** | In MVP, means portable *reads and verification* of a Monad-anchored record by any community/app/agent — not cross-chain presence (§3, §4.2). |
| **Sybil / sybil resistance** | Defense against one actor creating many fake identities to inflate reputation; MVP uses partial signals, not proof-of-personhood (§4.2, §14.1). |
| **ACL** | Access-control list — governs who can read private evidence within a workspace (§11.3, Epic 6). |
