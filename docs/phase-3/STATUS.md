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

## Verified evidence — 3 October 2026 (Asia/Jakarta)

- Original implementation: `5c1aee6`, pushed to `codex/phase-3` and `envio`.
- Phase 0 specification checks: 68 checks and 54 documentation links passed in the implementation run.
- Phase 1 Foundry: 36 tests, formatting, lint, gas snapshot and contract size checks passed in the implementation run. Phase 2 Anvil lifecycle passed.
- Latest web unit/API tests: 28 passed. Indexer projection tests: 6 passed. Web typecheck and lint passed.
- Vercel production deployment `dpl_vKcRSvzWqUjmmeg46kaHjacijeWr` reached READY and was aliased to https://attesia.vercel.app. Hardening deployment `dpl_7Lfue7QVzGVHXsbSUQ4j1VEwvDPv` subsequently reached READY. Final graph accessibility patch is being released separately.
- Envio release `5c1aee6` is active at `https://indexer.dev.hyperindex.xyz/b4b7111/v1/graphql`. Its schema includes agent policy/version entities and attestation category/profile fields.
- Live reputation, graph, feed and agent APIs returned HTTP 200 with ETags. Profile `0x6390d5ac32ad1062bbfd9fdf21bf2cf5ae56e296e72610bf5fd93a63d3703a88` showed Completion active=0/revoked=1 and Authorship active=1. Graph returned 4 nodes/5 edges; feed returned 2 requested items.
- ERC-8004 agent 1 resolved owner `0x133603465aDdE7C39fa0E6E34b264E1573e1FD08` and 9 native feedback records, separate from Attestia claims.
- Quiet-chain expiry regression exposed the stale event-only checkpoint. Final implementation reads Envio `chain_metadata.latest_processed_block` and obtains that exact block's timestamp from Monad RPC. It never substitutes server wall-clock time. The intermediate periodic RPC block handler was removed to avoid expensive historical backfills.
- Metadata regression tests now enforce hash binding for Attestia profile/contribution metadata, bounded streaming/inline JSON and rejection of redirects. Missing or mismatched profile metadata is explicitly withheld.
- Owner actions check the connected wallet against registry ownership and require public disclosure review; contracts independently enforce live ownership.

## Remaining gates

Phase 3 is **not yet complete**. Existing historical revoke evidence is not a replacement for the requested new agent acceptance flow.

- Final graph accessibility patch deployment pending. Browser checks passed: six MVP tests in the regression run and both new Phase 3 tests in the focused rerun (score explanation, claimed/attested graph, live historical revoke, community filter, keyboard, axe, reduced motion and 360px). Earlier test failures caught and fixed graph overflow and an unfocusable scroll region.
- Supply an existing ERC-8004 Monad Testnet agent controlled by a test user's wallet. Four indexed Attestia profiles inspected were human profiles; no owned agent was inferred.
- Execute and document: existing agent → linked profile → declared policy → contribution → two independent claims → one revoke → changed reputation/graph/feed. Also publish a new policy version and pause it onchain.
- Large-graph clustering and comprehensive delayed-event handler replay/agent-wallet browser coverage remain release checks; the present graph offers bounded progressive disclosure and an accessible relationship list.
