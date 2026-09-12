# Phase 1 handoff and release gates

Status: Phase 0 and Phase 1 are complete against their acceptance criteria. The former Phase 0 design-partner, interview, and privacy-review exit gates are deprecated and non-blocking. Phase 1 contracts are deployed and source-verified on Monad Testnet, with two-wallet Cast smoke evidence.

## Read order

1. [Discovery and analytics](DISCOVERY.md): pilot assumptions, interview kit and metric definitions.
2. [Specification](SPECIFICATION.md): schema bundle, vectors, lifecycle and contract interface decisions.
3. [Architecture](ARCHITECTURE.md), [security](SECURITY.md), [dependency evidence](DEPENDENCIES.md).
4. [Requirement matrix](REQUIREMENTS.md), then [clickable wireflow](wireflow/index.html).

## Contract backlog, in dependency order

| ID | Build | Acceptance / evidence |
|---|---|---|
| P1-01 | Pin official Foundry 1.8.0, Solidity supported by target fork, exact OpenZeppelin release; add CI and Monad execution config | Version output, checksum, compiler lock, `forge test --network monad`; existing 1.7.1 cannot pass prerequisite |
| P1-02 | Scoped record identity, errors, interface structs and events from SPECIFICATION | Portable IDs include chain/contract/record context; random record IDs are reused on retry; ABI generated from source |
| P1-03 | Profile create/update/delegate registry | Owner immutable; unauthorized update, duplicate ID, zero address and removed delegate cases rejected; metadata version events reconstruct |
| P1-04 | Contribution registration/archive and parent revisions | Creator authorization; exact duplicates rejected; same-artifact metadata-only child allowed; parent exists and belongs to creator; bounded URIs |
| P1-05 | Structured attestations and immutable rubric-reference fields | All five claim types; result bounds and nonzero QUALITY references enforced onchain. Phase 2 validates published rubric content and equality before app issuance; direct-call invalid metadata stays visibly unverifiable |
| P1-06 | Supersession and revocation | Same-key current record required; other issuers coexist; revoked records cannot reactivate; reads and issuer revoke survive pause |
| P1-07 | Agent profile creation/link and policy registry integrated behind identity interface | Immutable registry link, current ERC-8004 owner authorized on each write; former owner/foreign agent denied; human-only delegates; policy version history and emergency pause; no enforcement claim |
| P1-08 | Test/fuzz/invariants/gas/static checks | Ownership, uniqueness, expiry boundary, immutable history, direct revoke, supersession races, URI limits, malicious callers and chain-specific gas snapshots |
| P1-09 | Deployment/source verification and public manifest scripts | Compiler/source/ABI/runtime hashes, chain, addresses, blocks, dependency revision, pause authority; configuration refuses mainnet without explicit release gate |
| P1-10 | Authorized Testnet deploy and Cast smoke run | Three core registries source verified; two independent wallets; direct issuer revoke; explorer references. Actual deploy uses manual PRD §18 approval |

No production contract may accept negative claims until separate legal review/deployment policy permits it. Disputes are audited offchain annotations and must not masquerade as chain revocation. Workspace membership does not gate global claims. Standardize current owner/delegate self-snapshot at issuance before tests are frozen.

## Gates and accountable roles

| Gate | Status | Owner role / required evidence |
|---|---|---|
| Phase 0 engineering artifacts | Delivered, see validation record in README | Builder: schema checks, prototype walkthrough, traceability and review |
| Stakeholder discovery | **Deprecated / non-blocking** | Optional research: 3–5 interviews with dated notes and disconfirming findings |
| Real pilot commitment | **Deprecated / non-blocking** | Optional pilot input: one partner, named coordinator, actual contribution and two reviewers/test window |
| Phase 0 privacy-review exit gate | **Deprecated / non-blocking** | Optional Phase 0 review; later production privacy controls retain their own phase-specific gates |
| Foundry compatibility | **Complete locally** with official 1.8.0 and CI pin | Builder: keep checksum, compiler, Monad mode, tests and snapshots reproducible |
| ERC-8004 | **Complete for Phase 1** | Official Monad Testnet registry address checked for bytecode immediately before deployment; ownership behavior covered by contract tests |
| Sponsorship | Documented candidate; **not integration-tested** | Builder/operator: account-backed acceptance in DEPENDENCIES |
| Testnet write/deployment | **Complete** | Three source-verified registries, public manifest, two wallets, two claims, rejected unauthorized revoke, and successful issuer revoke |
| Public negative claims | **Blocked for production** | Counsel/operator: specific PRD legal review gate; first production contract disallows negatives |
| Phase 4 pilot checklist | Future | Security/operator: ACL, export, independent review, load, backups and incident drill |
| Phase 5 mainnet pilot | Future | Operator: multisig + extra signer, funded services, approved policies, independent review, then two-week stability evidence |
| Phase 6 live billing | Future | Business owner: WTP, merchant eligibility, pricing, signed webhooks, compliance review |

No named legal/incident owner or support address has been invented. The self-seeded scenario enables engineering/usability rehearsal. The former real-world validation requirement is deprecated as a Phase 0 exit gate; any future interview or partner evidence must still be reported as observed rather than inferred.

## Phase 0 review rules

- Wireflow state, identity labels and export are synthetic; no contract or API integration is implied.
- Prototype logic illustrates a bounded narrative. Schemas and written invariants are the Phase 1 contract source; do not transplant localStorage authentication, timer finality or illustrative integrity checks into production.
- Reject unbounded loops, proxy upgrades, custom crypto, universal scores and extra providers without requirement/evidence. Keep security, validation, accessibility and requested lifecycle behavior.
- Preserve dated dependency snapshots; regenerate observations at next deployment review. Do not regenerate expected hash vectors automatically during normal tests.
