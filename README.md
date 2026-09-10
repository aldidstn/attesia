# Attestia

## What it does

Attestia is a contribution attestation platform designed to help people document their work, disclose human and AI provenance, and collect evidence-backed claims from reviewers.

The current **Phase 0 prototype** demonstrates contribution publication, authorship and completion claims, claim revocation, profile counts, and verification/export screens. All identities and transactions are simulated; no wallet, smart contract, backend, or payment integration is connected.

See the [Phase 0 guide](docs/phase-0/README.md) for specifications, architecture, and research. Stakeholder interviews, partner commitment, and privacy/legal review remain pending.

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

Monad smart contracts and ERC-8004 integration are planned in the [Phase 1 handoff](docs/phase-0/HANDOFF.md).
