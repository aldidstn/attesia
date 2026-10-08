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
- Vercel production deployment `dpl_vKcRSvzWqUjmmeg46kaHjacijeWr` reached READY and was aliased to https://attesia.vercel.app. Hardening deployment `dpl_7Lfue7QVzGVHXsbSUQ4j1VEwvDPv` subsequently reached READY. Final graph accessibility deployment `dpl_8YRJesF7gJqe4o5pKdg8R45BNZwt` reached READY and is aliased to the production URL. Source release: `5ebae6b`.
- Envio release `5c1aee6` is active at `https://indexer.dev.hyperindex.xyz/b4b7111/v1/graphql`. Its schema includes agent policy/version entities and attestation category/profile fields.
- Live reputation, graph, feed and agent APIs returned HTTP 200 with ETags. Profile `0x6390d5ac32ad1062bbfd9fdf21bf2cf5ae56e296e72610bf5fd93a63d3703a88` showed Completion active=0/revoked=1 and Authorship active=1. Graph returned 4 nodes/5 edges; feed returned 2 requested items.
- ERC-8004 agent 1 resolved owner `0x133603465aDdE7C39fa0E6E34b264E1573e1FD08` and 9 native feedback records, separate from Attestia claims.
- Quiet-chain expiry regression exposed the stale event-only checkpoint. Final implementation reads Envio `chain_metadata.latest_processed_block` and obtains that exact block's timestamp from Monad RPC. It never substitutes server wall-clock time. The intermediate periodic RPC block handler was removed to avoid expensive historical backfills.
- Metadata regression tests now enforce hash binding for Attestia profile/contribution metadata, bounded streaming/inline JSON and rejection of redirects. Missing or mismatched profile metadata is explicitly withheld.
- Owner actions check the connected wallet against registry ownership and require public disclosure review; contracts independently enforce live ownership.

- Browser checks passed: six MVP tests in the regression run and both new Phase 3 tests in the focused rerun (score explanation, claimed/attested graph, live historical revoke, community filter, keyboard, axe, reduced motion and 360px). Earlier test failures caught and fixed graph overflow and an unfocusable scroll region.

## Remaining gates

Phase 3 is **not yet complete**. Existing historical revoke evidence is not a replacement for the requested new agent acceptance flow.

- Register an agent through `/agents/new`, or supply an existing ERC-8004 Monad Testnet agent controlled by a test user's wallet. Four indexed Attestia profiles inspected were human profiles; no owned agent was inferred.
- Execute and document: existing agent → linked profile → declared policy → contribution → two independent claims → one revoke → changed reputation/graph/feed. Also publish a new policy version and pause it onchain.
- Large-graph clustering and comprehensive delayed-event handler replay/agent-wallet browser coverage remain release checks; the present graph offers bounded progressive disclosure and an accessible relationship list.

## Agent registration addition

- `/agents/new` adds Privy-authenticated registration through `register(string)` on the same Monad Testnet Identity Registry. Gas remains self-paid in MON; no new dependency, contract or database migration.
- Reviewed canonical metadata is uploaded through the existing authenticated Pinata endpoint. Optional URLs use the public HTTPS validator; credential checks run before publication. Identities start inactive with no claimed trust mechanism. The initial file has an empty `registrations` list because the ID is assigned by the registry; the confirmed receipt is the registration reference.
- Wallet-scoped local drafts survive reload. Anonymous drafts transfer into the first signed-in wallet. Publication review resets after edits/reload. Atomic database state comparison admits one signature attempt per intent. Explicit wallet rejection permits retry; ambiguous responses remain locked and expose transaction-hash recovery.
- Receipt confirmation checks success, registry address, owner and exact metadata URI before showing an ID/link. ERC-8004 registration is confirmed directly by RPC, not claimed as an Envio-indexed Attestia profile. Profile linking remains a separate transaction.
- Limits: clearing browser storage loses the draft recovery context; reverted/unknown transactions are not automatically rebroadcast. This screen creates one identity per wallet/draft and does not provide identity management or metadata updates.
- TDD: registration tests first failed with the missing implementation; 35 web unit/API tests now pass, including foreign/mismatched receipt rejection and concurrent-operation conflict handling. Typecheck and lint passed. All 9 Playwright regression tests passed, including draft reload, keyboard, axe, reduced motion and 360px. Ponytail review: no new dependencies or speculative layers.
- Live user-wallet registration has not been performed by the assistant. Phase 3 acceptance remains pending.
- Registration release: Vercel production `dpl_EWGBbUSR8vBKHAP47qv9pAKMuLa8` reached READY, including successful production build/typecheck, and was aliased to https://attesia.vercel.app. Entry point: https://attesia.vercel.app/agents/new.

## Update — 8 October 2026

See [live acceptance evidence](evidence/2026-10-08-acceptance.md). Agent 2071 was registered, linked, assigned declared policy versions 1/2 and paused; its contribution is published and indexed. Replay lifecycle regressions were fixed with failing-first handler tests. Graphs over 100 nodes now offer type clusters and progressive expansion. Source `97eaed3` is live on Vercel and Envio.

Remaining live gate: independent reviewer login → two external claims → revoke one → verify changed reputation/graph/feed. The earlier request to supply an agent is resolved. Phase 3 remains pending this reviewer flow; no completion is inferred from historical claims or synthetic tests.
