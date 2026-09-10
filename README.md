# Attestia

Phase 0 discovery and architecture deliverable. Start with the [Phase 0 guide](docs/phase-0/README.md) for the specification, research evidence, tests and remaining gates.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

Open [the local wireflow](http://127.0.0.1:4173/wireflow/). It uses fictional identities and simulated transactions; no wallet, contract, backend or payment integration is connected. The HTML also opens directly from `docs/phase-0/wireflow/index.html`.

Run browser checks with `pnpm exec playwright install chromium`, then `pnpm test:ui`. Node ≥22, pnpm 10 and Python 3 are used for checks/local serving. The prototype itself has no runtime package dependencies.

[PRD](Attestia-PRD.md) · [Design reference](DESIGN.md) · [Phase 1 handoff](docs/phase-0/HANDOFF.md)

Interviews, partner commitment and legal/privacy review are pending. Phase 0 engineering artifacts are not evidence of a live product or a validated pilot.
