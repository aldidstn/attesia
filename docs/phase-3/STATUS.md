# Phase 3 status

## Implemented

- Deterministic `reputation-v1` category engine with lifecycle, evidence, outcome, self/dispute, and unique-attester signals.
- Envio agent-policy current/version projections and raw claim history for reproducible read-time scoring.
- Versioned reputation, graph, agent, and feed APIs with ETags, cursors, freshness, correlation IDs, and structured errors.
- Public profile reputation explanation and native SVG provenance graph with claimed/attested distinction and progressive disclosure.
- Live ERC-8004 Identity and Reputation Registry reads, separate trust-source display, agent linking, declared-policy publication, and pause flow.
- Ranked public feed with type, skill, community, status, and human/agent filters plus mutual-cluster annotation.
- Privacy-safe Phase 3 analytics dimensions and transaction idempotency for agent writes.

## Verified dependency

Monad Testnet Identity Registry `0x8004A818BFB912233c491871b3d84c89A494BD9e` has deployed bytecode. `ownerOf(1)`, `tokenURI(1)`, and `getAgentWallet(1)` returned successfully. The deployed Attestia profile registry points to that same immutable address. The canonical testnet Reputation Registry is `0x8004B663056A597Dffe9eCcC1965A193B7388713`.

## Release gate

Record unit, indexer, browser, production build, Vercel, Envio, and live revoke/agent-policy acceptance evidence here after the release commands finish. Do not mark Phase 3 complete before those results exist.
