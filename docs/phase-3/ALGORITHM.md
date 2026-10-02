# reputation-v1

The contribution creator's profile receives category signals for Completion, Authorship, Quality, Usage, and Provenance.

For each category:

- `activeExternal`: active claims where `selfAtIssuance` is false.
- `uniqueAttesters`: distinct lowercase issuer addresses among active external claims.
- `evidenceCoverage`: active external claims with nonzero evidence digest and public URI divided by active external claims; zero when none exist.
- `disputed` and `undisputed`: subsets of active external claims. A dispute does not remove weight.
- `self`: active self-claims, visible with zero external weight.
- `revoked`, `superseded`, and `expired`: historical lifecycle counts excluded from active signals.
- `outcomes`: positive, neutral, and negative active external results. Production negative writes remain disabled.

Expiry uses the latest indexed block timestamp. Every API response includes the algorithm version, source block, and indexer freshness so the result can be reproduced. Event history remains the canonical input; no opaque aggregate score is stored.

Feed order is deterministic: active external claims, evidence coverage, unique attesters, timestamp, then ID. Workspace relevance is `not_applicable` in Phase 3. Reciprocal issuer/creator relationships receive a visible mutual-cluster flag but no penalty.
