# Phase 2 status

## Implemented

- pnpm workspace with Next.js web app and Envio HyperIndex app.
- DESIGN.md tokens, Manrope 500/600, responsive 360 px layouts, focus treatment, error summaries, and reduced motion.
- Generated typed ABIs and Monad Testnet addresses from Foundry artifacts and the deployment manifest.
- Privy email/external wallet login, wallet-only embedded wallet creation, Monad-only writes, server token verification, HTTP-only application sessions, and expiring one-use SIWE fallback.
- Drizzle schema and migration for sessions, nonces, drafts, deterministic transaction operations, invitations, and disputes. Envio checkpoints provide event idempotency.
- Profile creation, update, and public reads; contribution draft, public review, hashing, Pinata upload, duplicate preflight, revision parent, and submission.
- Public artifact limits and rejection for active content, invalid UTF-8, likely credentials, unsafe URLs, and files over 4 MB.
- Reviewer invitation, five claim choices, QUALITY rubric binding, GitHub PR requirement for USAGE, revocation, dispute annotation, explorer links, verification, and JSON export.
- Envio configuration from block 61841076 and handlers for profile, contribution, archive, attestation, supersession, and revocation lifecycle events.
- Envio Cloud development deployment `db48410` from the `envio` branch is active and fully synced on Monad Testnet. The application uses its tested public GraphQL endpoint and shows indexed claim counts and checkpoint blocks.
- Public/read and authenticated/write APIs with correlation IDs, structured errors, ETags where records are immutable, Retry-After on service outages, and opaque ID cursors.
- Privacy-safe analytics allowlist. Wallet addresses, evidence, source contents, and metadata fields are rejected.
- Privy-sponsored writes for the four allowlisted MVP actions, with an explicit self-paid fallback and no retry after user rejection or ambiguous provider failure.
- Vercel Neon compatibility through `DATABASE_URL` or the integration-provided `storage_DATABASE_URL`.

## Acceptance pending account interaction

Phase 2 remains **integration pending** until the real two-user Privy flow succeeds. The production deployment reads the migrated Neon database and hosted Envio projection successfully, and the Pinata credential authenticates. The optional local Envio runtime needs Docker and `ENVIO_API_TOKEN`; hosted GraphQL does not.

Credential-independent acceptance is green: Phase 0 has 68 schema checks and 13 browser tests; Phase 1 has 36 Foundry tests using official Foundry 1.8.0; Phase 2 has 17 web unit tests, 4 indexer projection tests, 5 browser tests, a disposable Anvil lifecycle run, lint, typecheck, Envio code generation, and a production Next.js build. The live Envio projection currently contains two profiles, one contribution, two attestations, and the expected revocation lifecycle from the Phase 1 smoke run.

Privy App Pays is enabled for Monad Testnet and accepts client-initiated requests. The remaining acceptance run must capture two independent users creating profiles, one contribution and provenance record, two claims, one revocation, the indexed count change, artifact/metadata/transaction/explorer verification, one sponsored write, and the self-paid mode separately.

## Boundaries

Public evidence only. Private evidence, workspace ACLs, reputation graph, agents, feed, mainnet, billing, and arbitrary binary uploads remain later-phase work.
