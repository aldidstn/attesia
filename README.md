# Attestia

## What it does

Attestia is a contribution attestation platform designed to help people document their work, disclose human and AI provenance, and collect evidence-backed claims from reviewers.

The **Phase 0 prototype** demonstrates contribution publication, claims, revocation, profile counts, and verification/export screens. Its identities and transactions remain simulated. **Phase 1** adds tested and source-verified Solidity registries for profiles, contributions, attestations, revocation, and ERC-8004-linked agents on Monad Testnet.

See the [Phase 0 guide](docs/phase-0/README.md) for specifications, architecture, and research. The former Phase 0 interview, partner-commitment, and privacy-review exit gates are deprecated and non-blocking.
See the [Phase 1 guide](docs/phase-1/README.md) for contract scope, acceptance status, and deployment gates.

## How to run

Prerequisites: **Node.js 22+**, **pnpm 10.32.1**, and **Python 3**.

```sh
git clone https://github.com/aldidstn/attesia.git
cd attesia
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://127.0.0.1:4173/wireflow/**. Stop the server with `Ctrl+C`.

To run specification and browser checks:

```sh
pnpm exec playwright install chromium
pnpm test
```

Phase-specific TDD commands and the requirement coverage matrix are in [docs/TESTING.md](docs/TESTING.md).

## Demo

Run the prototype locally using the steps above, or open [index.html](docs/phase-0/wireflow/index.html) directly from your downloaded repository. No hosted demo is available yet.

1. Draft a contribution and disclose its provenance.
2. Review public evidence and simulate publication.
3. Switch reviewer identities and add completion/authorship claims.
4. Revoke a claim and inspect the changed profile counts.
5. Open public verification and export the simulated record.

Prototype controls also demonstrate rejected signatures, expired sessions, wallet mismatches, duplicates, inaccessible evidence, and indexer lag.

![Attestia Phase 0 dashboard](docs/phase-0/research/wireflow-desktop.png)

## Tech Stack

| Area | Current implementation |
| --- | --- |
| Interface | HTML, CSS, vanilla JavaScript; no framework or runtime package dependencies |
| Design | Violet surfaces, rounded panels, Manrope typography; [design reference](DESIGN.md) |
| Demo state | Browser localStorage with fictional records |
| Local server | Python HTTP server |
| Specification | JSON Schema 2020-12, Ajv, ajv-formats |
| Integrity checks | RFC 8785 canonicalization, keccak256 metadata hashes, SHA-256 artifact hashes; canonicalize and @noble/hashes |
| Testing | Playwright and axe-core accessibility checks |
| Tooling | Node.js and pnpm |
| Smart contracts | Solidity 0.8.28, Foundry 1.8.0, OpenZeppelin Contracts 5.6.1 |

Monad Testnet deployment, source verification, two-wallet Cast smoke checks, and direct issuer revocation are complete; see [deployment evidence](docs/phase-1/DEPLOYMENT.md).
