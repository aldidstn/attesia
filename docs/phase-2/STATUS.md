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

## Live acceptance evidence

The account-backed flow ran on [attesia.vercel.app](https://attesia.vercel.app) on 2026-09-15 with two independent Privy users:

- Contributor profile `0x6390d5ac32ad1062bbfd9fdf21bf2cf5ae56e296e72610bf5fd93a63d3703a88` was created in transaction `0xca45d79067155a7115b344a13a2686811d44a38fffe75a3f3e3e740b09a71e69`.
- Reviewer profile `0x37e800386927cf2a7f9e48062d37324b89da3041e43acb794c3ee22fcd0e1c18` was created in transaction `0xc240c3992901bda5cce09ba81caf554dc9edba3f03ad49d0854cc4accd686545`.
- Contribution `0xbb2b06b99e9c646ce7e71e854890162e9af802ef19f9f3b0256c54aefb15b426` was published in transaction `0x4e160287523f454fe9b4efe0a16e3dc524e897fa95395d3551737b6a575cf4ce` with AI provenance and a public GitHub source.
- Completion and authorship claims were issued in transactions `0x55d6d43e921d51266ccbbcb431f4f6b85e787d25d90c8990dace8d23b4e27aa6` and `0x0f04206bac605ea9e45378d7058200e356d2e4ecce5d976b9b3d04eaf22423c7`.
- The completion claim was revoked in transaction `0x33b36b2834a2b105edf5e1fc21114242aa58a2c6b96b402252e8012b3cd7fbca`. Envio changed the projection from two active external claims to one and retained the revoked record.
- The contribution metadata digest reproduced as `0x50226bc7b76b0494f4fb6272d32d34aea35d54e65edb2edcf32267efb5bbc628`. Its 298-byte Markdown artifact reproduced SHA-256 `0x76c362cd9880fe46cac57d8267a54eb7b558dcf97257ab5ca1ddb36655cf069e`.
- The public verification screen reports `verified` and exposes JSON export. The Vercel production gateway configuration was corrected and retested against Pinata.

The sponsorship probe claim and its cleanup revocation are recorded in transactions `0x8984c9323157fd5e96e540a8b70c4f12fe3b937811059e02a150343ef928bcad` and `0xb59f8c31d829d01931331f577a32a0c43769fa0212b49826b48e43d07695ee86`. Both were self-paid, and the temporary claim is historical rather than active.

## Remaining external gate

Phase 2 remains **sponsorship pending**. Privy has TEE execution enabled, Monad Testnet selected, client transactions enabled, and the application sends `sponsor: true`. The live probe still charged the reviewer wallet because the Privy dashboard has `$0.00` gas credit. A funded Privy gas-credit balance and one receipt showing no signer balance decrease are required before Phase 2 is marked complete. No payment has been initiated.

The production deployment reads the migrated Neon database and hosted Envio projection successfully. Pinata upload and retrieval authenticate. The optional local Envio runtime needs Docker and `ENVIO_API_TOKEN`; hosted GraphQL does not.

Credential-independent acceptance is green: Phase 0 has 68 schema checks and 13 browser tests; Phase 1 has 36 Foundry tests using official Foundry 1.8.0; Phase 2 has 20 web unit tests, 4 indexer projection tests, 5 browser tests, a disposable Anvil lifecycle run, lint, typecheck, Envio code generation, and a production Next.js build. Before final signoff, rerun the full suite and rotate the integration credentials used during interactive setup.

## Boundaries

Public evidence only. Private evidence, workspace ACLs, reputation graph, agents, feed, mainnet, billing, and arbitrary binary uploads remain later-phase work.
