# Test-driven development

Every behavior change follows red → green → refactor:

1. Add the smallest requirement-level test and confirm it fails for the expected reason.
2. Add the minimum implementation that makes the test pass.
3. Run the phase suite, lint, formatting, and existing regression tests.
4. Refactor only after the complete suite is green.

## Phase 0

| Boundary | Automated evidence |
| --- | --- |
| Canonical metadata | JSON Schema valid/invalid fixtures, RFC 8785 bytes, keccak256 and SHA-256 fixed vectors |
| Lifecycle rules | Self/external counts, disputes, expiry, revocation, supersession and revision examples |
| Publication | Explicit review, unsafe URL rejection, fictional state preservation and simulation labels |
| Wireflow | Primary flow, six failure/recovery paths, keyboard focus, 360px layout, reduced motion and axe checks |
| Repository safety | Documentation links and an empty private-key template with `.env` ignored |

Run:

```sh
pnpm test:phase0
```

Stakeholder interviews, partner commitment, privacy/legal review and human usability findings cannot be replaced by automated tests. These former Phase 0 exit gates are deprecated and remain optional research inputs rather than release blockers.

## Phase 1

| Boundary | Automated evidence |
| --- | --- |
| Profiles and agents | Owner/delegate authorization, ERC-8004 ownership transfer, fail-closed reads, policy version/pause lifecycle |
| Contributions | Identity/digest validation, duplicates, revisions, parent ownership, archive authorization/history |
| Attestations | Five types, result/evidence/rubric validation, expiry, self snapshot, issuer-scoped supersession and revocation |
| Operations | Paused-write rejection, readable history, direct issuer revoke, chain/mainnet deployment guards |
| State space | Fuzzed expiry/type inputs and invariants preventing multiple active issuer keys or historical reactivation |
| Release | Formatting, high/medium lint, gas snapshot, bytecode size and build/deployment manifest |

Run with Foundry 1.8.0:

```sh
pnpm test:phase1
```

Foundry coverage instrumentation cannot compile the intentionally wide `attest(...)` ABI: normal mode reports stack-too-deep and `--ir-minimum` reports a Yul stack exception. Requirement-level tests and invariants remain the acceptance evidence. This limitation does not waive Slither and independent review before mainnet.

## Phase 2

Vitest checks canonicalization, fixed hashes, URL/file/credential rejection, deterministic transaction intent and legal lifecycle transitions. Envio projection tests cover duplicate events, self claims, disputes, supersession, and revocation. HyperIndex code generation type-checks every configured event handler.

```sh
pnpm test:phase2
pnpm test:phase2:anvil
pnpm --filter @attestia/indexer codegen
pnpm --filter @attestia/indexer typecheck
pnpm --filter @attestia/web build
```

The Envio Cloud deployment is active and its GraphQL schema, chain checkpoint, and indexed lifecycle records have been queried successfully. The two-user Privy, PostgreSQL, Pinata, and wallet-paid Monad acceptance flow completed on 2026-09-15; its transaction evidence is recorded in `docs/phase-2/STATUS.md`.
