# Phase 2 API

All responses include `x-correlation-id`. Immutable public records return an `ETag`. Temporary dependency failures use HTTP 503 and `Retry-After: 30`. Errors use `{ "error": { "code", "message", "correlationId", "details" } }`.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/nonce` | Public | Issue a one-use SIWE nonce valid for ten minutes |
| POST | `/api/auth/verify` | Public | Verify Privy access token or SIWE signature and issue HTTP-only session |
| POST | `/api/auth/logout` | Session | Delete session |
| GET/POST | `/api/drafts` | Session | List or upsert contribution drafts |
| POST | `/api/artifacts` | Session | Validate and upload reviewed public evidence to Pinata |
| POST/PATCH | `/api/operations` | Session | Create idempotent transaction intent or advance its lifecycle |
| POST | `/api/operations/reconcile` | Session | Recover receipts and distinguish finalized from indexed state |
| POST | `/api/invitations` | Session | Create one hashed-recipient review invitation |
| GET/POST | `/api/disputes` | Public/session | List or add offchain dispute context without changing active chain counts |
| GET | `/api/profiles/:id` | Public | Read onchain profile |
| GET | `/api/profiles/:id/contributions` | Public | Read Envio projection with cursor pagination |
| GET | `/api/contributions/:id` | Public | Read onchain contribution |
| GET | `/api/contributions/:id/attestations` | Public | Read lifecycle claims and disputed/undisputed subsets |
| GET | `/api/attestations/:id` | Public | Read onchain attestation |
| GET/POST | `/api/verify` | Public | Reproduce metadata or artifact digest |
| POST | `/api/analytics` | Public | Accept allowlisted aggregate product events |

Agent and feed routes begin in Phase 3.
