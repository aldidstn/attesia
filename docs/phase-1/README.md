# Phase 1 — Onchain core

Status: **complete**. Contracts are implemented, tested, deployed, and source-verified on Monad Testnet. Two independent wallets completed the Cast smoke flow, including rejected unauthorized revocation and successful direct issuer revocation.

## Delivered

- `AttestiaProfileRegistry`: human and ERC-8004-linked agent profiles, human delegates, current agent-owner authorization, versioned declared policies, pause controls.
- `ContributionRegistry`: registration, archival, exact-duplicate rejection, and same-creator metadata revisions that may retain the artifact digest.
- `AttestationRegistry`: five claim types, evidence and rubric bindings, issuer-scoped supersession, expiry, direct issuer revocation during pause, and immutable negative-claim policy.
- Foundry unit, fuzz, invariant, gas, lint, formatting, size, and deployment-policy checks.
- Monad-aware deployment script, CI, and reproducible build/deployment manifest generator.

Three registries keep the Phase 1 boundary small. Agent policy declarations live in the profile registry because they share ERC-8004 identity ownership and authorization.

## Acceptance status

| Backlog | Status | Evidence |
| --- | --- | --- |
| P1-01 | Complete | Foundry 1.8.0, Solidity 0.8.28, OpenZeppelin 5.6.1, `network = "monad"`, CI |
| P1-02–P1-07 | Complete | Contracts and generated ABIs; unit/fuzz tests |
| P1-08 | Complete locally | Unit/fuzz/invariant suite, gas snapshot, Foundry lint and bytecode sizes |
| P1-09 | Complete | Deployment guard plus public manifest with chain, addresses, blocks, transactions, dependency revisions, and runtime hashes |
| P1-10 | **Complete** | Three source-verified registries, two independent wallets, two claims, rejected unauthorized revoke, direct issuer revoke, and explorer evidence |

The former Phase 0 stakeholder-interview, partner-commitment, and privacy-review exit gates are deprecated and non-blocking. Contract completion still does not validate those product assumptions.

## Local verification

Use official Foundry **1.8.0**.

```sh
forge fmt --check
forge lint src script --severity high med --deny warnings
forge test --network monad
forge snapshot --network monad --check
forge build --sizes
```

See [deployment instructions](DEPLOYMENT.md) for guarded dry runs and manifest generation.
The shared red→green workflow and requirement coverage matrix are documented in [TDD](../TESTING.md).
