# Attestia v1 schema and contract specification

Status: Phase 0 specification with runnable examples. No registry, API, chain write, or live evidence is implemented here. Example identities, registry addresses, URLs, workspace, and rubric are synthetic. The schema `$id` uses the reserved `.example` domain and is an identifier, not a deployed endpoint.

## 1. Public metadata and canonical bytes

The [JSON Schema 2020-12 bundle](schemas/attestia.v1.schema.json) defines ten metadata types: profile, contribution, provenance, five structured claims, rubric, and declared agent policy. Each object rejects unknown fields. The `schema` discriminator selects its version and type; fields required by a published version remain required. Incompatible changes receive a new schema version and deployment decision.

| Data | v1 rule |
| --- | --- |
| Contribution types | `research`, `pull_request`, `design`, `smart_contract`, `bounty`, `community_task`, `other` |
| AI assistance | `none`, `assistive`, `substantial`, `agent-led`, `unknown`; “unknown” includes undisclosed involvement |
| Claims | `COMPLETION`, `AUTHORSHIP`, `QUALITY`, `USAGE`, `PROVENANCE` |
| Result | `1` means the statement is supported; `-1` means it is not supported. Abstaining creates no claim. |
| Addresses / digests | Lowercase `0x` hex; 20-byte addresses and 32-byte digests |
| Timestamps | Metadata uses UTC RFC 3339 strings ending in `Z`; chain timestamps remain authoritative for issuance and lifecycle. |
| Expiry | `validUntil` is integer Unix seconds; `0` means no expiry. The supported metadata range ends at year 9999. |
| Large values | Agent IDs and monetary base-unit amounts are unsigned decimal strings; no floating-point money. Validate the uint256 bound before ABI encoding. |
| Sources | HTTPS URLs, title, access timestamp, optional SHA-256 digest; digest and digest algorithm must either both exist or both be null. |
| Artifacts | HTTPS or IPFS URI, SHA-256 digest, media type, filename and exact byte length |
| Public evidence | v1 accepts only `visibility: "public"`. Private evidence is Phase 4 and requires a separate schema/privacy review. |

Human and organization profiles are wallet-bound. Agent profiles reference `(chainId, registry, agentId)`; an owner snapshot is explanatory metadata, never lasting authorization. Non-agent profiles cannot contain an agent link.

Canonicalization contract:

1. Accept valid I-JSON: reject duplicate object keys, unpaired Unicode surrogates, nonfinite numbers and unknown schema fields. Enforce size and depth limits at the API boundary. JSON Schema operates after parsing; raw duplicate-key detection is a separate ingestion requirement.
2. Validate against the exact schema version. Normalize UI inputs to the documented wire types before the review/signing screen, never after signing.
3. Serialize using [RFC 8785 JSON Canonicalization Scheme](https://datatracker.ietf.org/doc/html/rfc8785): UTF-16 property ordering, ECMAScript number rendering, preserved array ordering, no whitespace and no Unicode normalization.
4. Encode the canonical string as UTF-8. Compute `metadataDigest = keccak256(canonicalBytes)`. Keccak-256 is not SHA3-256.
5. Compute `artifactDigest = SHA256(rawFileBytes)`. File renaming, line-ending conversion or content decoding must not alter bytes during verification.

All schema fields participate in the metadata digest, including source URIs, evidence references, declarations, workspace and rubric references. There are no silently excluded payload fields. Transaction references, owner/delegate snapshots, signatures, derived state, integrity results, metadata URI and the digest itself live in a separate transport/chain envelope. An evidence URI is hashed as part of the containing claim metadata; the containing metadata's own location is outside that payload, avoiding a self-reference.

The [digest vectors](fixtures/digest-vectors.json) pin expected canonical strings and hashes. Known-answer `abc` vectors distinguish SHA-256 and Keccak-256. Number-rendering and UTF-16 ordering vectors check RFC 8785 behavior; their values need not themselves be Attestia metadata. [Integrity mismatch cases](fixtures/integrity-cases.json) deliberately pass structural validation while failing hash comparison.

Source URLs are references, not proof of content integrity. An absent source digest remains visible as unverified integrity. Evidence can include a downloaded snapshot whose digest is anchored. Production fetching must reject credentials, unsafe IP ranges and redirect/DNS rebinding paths, bound response size, and scan content before publication; the schema alone does not implement those controls.

## 2. Contribution versions and identity

Generate nonzero, cryptographically random `bytes32` record IDs before signing and reuse the same ID when reconciling/retrying an uncertain transaction. Registries reject existing IDs. Portable identity is the tuple `(chainId, registryAddress, recordId)`; a bare ID is not globally unique.

Root contribution uniqueness is `(creatorProfileId, artifactDigest)`. If that root exists, return and link the existing record rather than publishing another indistinguishable root.

A revision is a new immutable contribution with a new ID and an existing `parentId`. Only the parent creator's currently authorized owner/delegate may publish it. The creator profile must remain the same. A changed artifact is allowed; unchanged artifact bytes are also allowed when provenance or other metadata changes. Exact duplicate revision key `(creatorProfileId, parentId, artifactDigest, metadataDigest)` is rejected. The original contribution, evidence and claims remain unchanged; claims on a parent do not automatically attest to its child.

Archiving annotates a contribution; it does not erase its history, invalidate existing claims or lower counts. Disputed status is also an independent annotation. Transaction state is separate from both: Draft → Awaiting signature → Submitted → Proposed → Finalized → Indexed. Indexing lag cannot be shown as transaction failure.

Collaborator entries in metadata are always `relationship: "claimed"`. Only a separate signed acceptance by the referenced identity can produce a confirmed relationship in the UI. Collaborator acceptance creates no reputation claim. In v1, contribution claims accrue to the creator profile; attribution alone cannot distribute reputation to collaborators.

## 3. Claim, rubric and reputation rules

Every claim binds a contribution, issuer, result, evidence, creation timestamp, validity window, optional supersession, workspace context and conflict disclosure. The metadata issuer and ABI issuer must agree. Negative claims require a reason and evidence. Revocation also requires a reason and evidence reference. A claim cannot attest to an unknown contribution.

| Claim | Required assessment |
| --- | --- |
| `COMPLETION` | The stated deliverable and observation timestamp |
| `AUTHORSHIP` | Contributor role and basis for material contribution |
| `QUALITY` | Published workspace rubric reference and one result for every rubric criterion |
| `USAGE` | Explicit `merged`, `deployed`, `used` or `accepted` action, HTTPS reference and observation timestamp |
| `PROVENANCE` | Reviewed disclosure aspects and explanatory notes |

The pilot uses a merged GitHub PR as its `USAGE` example. This does not make all GitHub activity equivalent to usage. All seven contribution types remain valid.

`QUALITY` requires workspace ID plus immutable rubric ID, version, URI and digest. Other claim types use `rubric: null` in v1. Rubric publication is workspace-admin-only; each edit creates a new version linked by the previous version's digest. Criterion IDs are unique. A quality assessment must cover every criterion exactly once; its result is positive only when every criterion passes. Claims retain the exact rubric judged, even after later edits. A claim's workspace, rubric ID, version and digest must match the published rubric record; JSON Schema cannot validate these cross-record relationships.

All wallets may attest. Workspace membership controls workspace administration, review organization and later private access; it does not silently remove otherwise valid external claims from global counts. The fixed rubric reference does not prove that an issuer is an endorsed workspace reviewer; the UI presents reviewer membership separately.

One active claim per `(issuer, contributionId, claimType)` is permitted. This key deliberately excludes workspace. An issuer replacing an active claim must name that exact claim in `supersedes`; different issuers coexist. A cross-issuer, wrong-type, wrong-contribution or stale replacement target fails. When the previous record has expired or been revoked, a fresh claim can be issued without superseding it. Superseded records never reactivate when a replacement is revoked.

Represent lifecycle as independent facts: issuance, revocation, supersession, expiry and dispute history. A record is chain-active at time `t` when it has been issued, has not been revoked or superseded, and `validUntil == 0 || t < validUntil`. Expiry is effective at the exact timestamp boundary; it does not require an onchain event. Historical queries use facts effective at their requested block/time, never today's latest status flags.

Self identity is frozen at issuance from authoritative authorization state: the issuer is the creator-profile owner or an authorized delegate at that block. The contract computes and emits `selfAtIssuance`; it must not trust a client boolean. For an agent identity, authorization resolves the current ERC-8004 owner/operator through the pinned integration. Later delegate removal or agent ownership changes do not turn old self-claims into external claims. This rule identifies wallet/authorization relationships, not undisclosed common ownership of multiple wallets.

Reputation policy `attestia.counts.v1` has no weights and no universal score. For each profile and claim category, return:

- `rawActive`: all active external claims, including negative and disputed claims.
- `positive` / `negative`: raw active claims partitioned by result.
- `disputed` / `undisputed`: raw active claims partitioned by dispute state; opening or resolving a dispute never suppresses `rawActive`.
- `uniqueAttesters`: distinct issuers among raw active claims.
- Evidence coverage: accessible, digest-matching evidence count and the raw active denominator; show unavailable and mismatched evidence separately. Empty denominator displays “No active claims,” not 100%.
- Historical totals and lifecycle breakdowns, preserving revoked, expired, superseded and self-issued records visibly.

The identity `rawActive = positive + negative = disputed + undisputed` must hold. Self-issued, revoked, superseded and expired claims are excluded from raw active external counts. Evidence outages change coverage, not claim totals. Reciprocal patterns may be labelled, without hidden penalties.

Disputes live offchain in an append-only audit history with target, opener, reason/evidence reference, status changes, actor, server timestamp and monotonic sequence. A subject or authorized workspace moderator may open a dispute; issuers may respond, and workspace moderators resolve workspace disputes with a reason. For a workspace-free claim, the opener may withdraw their dispute; a platform moderator may resolve it with an auditable reason. No moderator can revoke someone else's chain claim. A target is disputed while any eligible dispute is open. Every score snapshot stores algorithm version, source chain block/hash, evaluation timestamp, dispute sequence/cutoff and evidence-observation timestamp; reproduction therefore needs chain history plus the retained offchain histories.

Negative issuance is testnet-only until legal approval. The first mainnet deployment must reject negative results by immutable deployment policy (`negativeClaimsEnabled = false`) so bypassing the hosted UI cannot bypass the gate. A legal-approved change requires a new versioned deployment; do not add an admin switch merely for convenience. Testnet enables negative examples. Public testnet examples remain synthetic or explicitly consented; testnet is still public and does not remove privacy or defamation risk.

## 4. ABI and event requirements for Phase 1

These signatures are specification text, not compiled or deployed Solidity. Preserve the PRD profile, contribution, archive, revoke and declared-policy operations. Extend attestation issuance so the onchain integrity commitment covers fields missing from the PRD example:

Agent ownership cannot be inferred from offchain `AgentLink` metadata. Add `createAgentProfile(bytes32 profileId, uint256 agentId, string metadataURI, bytes32 metadataDigest)` to the profile registry. Its identity-registry address is immutable environment configuration; creation requires that registry's current `ownerOf(agentId)`. Store the agent link onchain and emit it, with at most one profile per agent in this profile-registry deployment. Agent profile updates, contribution writes and self-classification resolve the current ERC-8004 owner each time and fail closed if the registry cannot be read. In v1 only that current owner operates an agent profile; `setDelegate` applies to human/organization profiles only. This prevents old owner/delegate access after agent transfer. Human `createProfile` remains wallet-bound. Metadata type cannot convert a human profile into an agent profile or change its onchain link. No competing agent NFT is created.

```solidity
attest(
  bytes32 attestationId,
  bytes32 contributionId,
  bytes32 claimType,
  int8 result,
  bytes32 workspaceId,
  bytes32 rubricId,
  uint32 rubricVersion,
  bytes32 rubricDigest,
  bytes32 metadataDigest,
  string metadataURI,
  bytes32 evidenceDigest,
  string evidenceURI,
  uint64 validUntil,
  bytes32 supersedes
)

revoke(bytes32 attestationId, bytes32 reasonDigest, string reasonURI)
```

`claimType = keccak256(UTF8(UPPERCASE_CLAIM_NAME))`; reject unknown types and results outside `-1`/`1`. Use zero `bytes32` for absent workspace, rubric and supersession; zero rubric version means absent. `QUALITY` requires nonzero workspace/rubric ID/digest/version. Non-quality claims require all rubric ABI fields to be zero. Signed metadata uses explicit nulls instead of zero sentinels, with one documented encoder translating between them.

Contract validation enforces these compact rules, IDs, authorization, expiry, paused-state policy, duplicate protection, active supersession target and negative-issuance deployment policy. Offchain publication validation verifies metadata/ABI equality, published rubric membership, canonical hashes and assessments. Contracts cannot inspect offchain rubric content: clients label missing, malformed, unpublished or mismatched metadata as invalid/unverifiable rather than claiming workspace endorsement. A registry-accepted external claim still contributes to raw active counts from its compact chain fields; invalid metadata reduces verifiable evidence coverage and prevents displaying its unverified details as established facts. Direct contract callers cannot be assumed to have passed hosted publication checks.

Required event payloads:

- Profile events preserve owner, metadata digest/URI and delegate changes; profile updates never overwrite historical events.
- `ContributionRegistered` includes contribution ID, creator profile, artifact digest, metadata digest/URI, parent ID, sender and timestamp; archive emits a separate event.
- `AttestationCreated` includes ID, contribution, issuer, claim type/result, workspace/rubric references, metadata digest/URI, evidence digest/URI, `issuedAt`, `validUntil`, `supersedes` and contract-computed `selfAtIssuance`. Index ID, contribution ID and issuer; retain workspace and claim type as event data for projection.
- Supersession emits old/new IDs; revocation emits record ID, issuer, timestamp and reason digest/URI. Repeated revocation rejects. An issuer may revoke a superseded or expired record without erasing either fact.
- Agent-policy events retain agent registry identity, digest/URI, monotonically increasing version, resolved owner/operator and active/paused declaration state.

Use immutable versioned contracts without proxies. Admin pause blocks new registration/issuance, not reads or issuer revocation. No admin can replace/delete user history. Registry addresses, exact ERC-8004 interfaces, deployment owner and Foundry/Monad versions remain deployment-manifest inputs verified before Phase 1 deployment; fixture addresses must never become production defaults.

## 5. Checks and remaining implementation obligations

Run `pnpm check` from the repository root. It validates 13 positive fixtures, structural rejection cases, fixed digest vectors, integrity mismatches and executable acceptance examples for lifecycle, raw/disputed subsets, rubric binding, supersession, self snapshots and revisions.

The checker is deliberately a small specification model. It does not prove contract authorization, ingestion duplicate-key rejection, RPC finality, server URL safety, consent, signature verification, secret detection, legal approval, or actual evidence availability. Those need implementation tests in their respective phases. No example file represents a real partner interview or real merged contribution.
