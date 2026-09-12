# Phase 0 — Discovery and architecture

Prepared 5 September 2026. This pack implements the approved Phase 0 plan. All product data in the wireflow/fixtures is fictional. Source documents remain at [PRD](../../Attestia-PRD.md) and [DESIGN](../../DESIGN.md); accepted clarifications are explicit in the decision log.

## Open and run

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

Open [interactive wireflow](http://127.0.0.1:4173/wireflow/) or the standalone [HTML](wireflow/index.html). `pnpm dev` serves only this documentation folder on loopback. Google Fonts is optional; system fallback preserves layout without network. All wallet/transaction/verification states are illustrative and labeled. LocalStorage stores this prototype's fictional draft and history; reset clears its own state only. Avoid entering actual private data.

## Pack contents

| Artifact | Purpose |
|---|---|
| [Discovery](DISCOVERY.md) | Synthetic merged-PR scenario, role assumptions, interviews, incentives, WTP, empty partner checklist and metric definitions |
| [Requirements](REQUIREMENTS.md) | PRD traceability: screen, interface, acceptance and phase; specification versus implemented behavior distinguished |
| [Specification](SPECIFICATION.md) | Metadata, lifecycle, rubric, self-claim, revision, dispute and proposed ABI rules |
| [Schema bundle](schemas/attestia.v1.schema.json) | JSON Schema 2020-12, strict metadata types and version discriminators |
| [Digest vectors](fixtures/digest-vectors.json) | Fixed canonical strings, artifact SHA-256 and metadata keccak256 expected values |
| [Invalid fixtures](fixtures/invalid-cases.json) | Reproducible mutations demonstrating required-field, URL and unknown-field rejection |
| [Architecture](ARCHITECTURE.md) | System/data flow, ADRs, API interface, event reconstruction, infrastructure and explicit cost assumptions |
| [Security](SECURITY.md) | Publication/retention policy, threats, negative tests, moderation and privacy gates |
| [Dependencies](DEPENDENCIES.md) | Verified official tooling, pinned ERC-8004 revisions/ABIs and sponsorship acceptance boundaries |
| [RPC observations](research/registry-observations.json) | Dated read-only network/dependency observations; not an Attestia deployment |
| [Handoff](HANDOFF.md) | Ordered Phase 1 backlog, review rules, owners and historical external-gate status |

## Walkthrough

1. Start the contribution draft with the illustrative PR and disclose human/AI work. Review publication details and acknowledge public visibility.
2. Publish through simulated signature/finality/indexing states. No wallet opens and no network transaction occurs.
3. Switch demo identity to each reviewer, issue completion and authorship claims, then inspect evidence and category counts.
4. Revoke one claim as its issuer; inspect unchanged history and reduced active count. Compare disputed/undisputed subsets without suppressing totals.
5. Open public verification and download the explicitly simulated export. Real integrity/chain verification is unavailable in this wireflow.
6. Use Prototype controls for rejected signature, expired session, wallet mismatch, duplicate submission, inaccessible evidence and indexer lag. Recover with draft preserved.

## Validation

```sh
pnpm check
pnpm exec playwright install chromium
pnpm test:phase0
```

The schema checker validates positive/negative fixtures, fixed digest vectors and executable lifecycle examples. It never rewrites expected vectors. Browser checks exercise the narrative, failure recovery, mobile layout, keyboard focus and axe rules. Test results are summarized in [validation record](VALIDATION.md).

These checks do not test Solidity, signatures, actual API endpoints, production scanning/ACL, real chain finality, sponsorship, or independent human usability. Phase 1+ acceptance is specified rather than fabricated.

## Current status

Phase 0 is complete against its engineering acceptance criteria. Its former partner, interview, and privacy-review exit gates are deprecated and non-blocking. Sponsorship has a documented candidate but no account-backed test. Phase 1 contract tests use pinned Foundry 1.8.0, and its Monad Testnet deployment and smoke run are complete. No paid infrastructure, mainnet activation, live billing, or outreach was performed.
