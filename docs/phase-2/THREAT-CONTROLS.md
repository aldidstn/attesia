# Phase 2 threat controls

| Threat | Control | Negative evidence |
| --- | --- | --- |
| Replay | One-use nonce hash, expiry, consumed timestamp, SIWE domain and Monad chain | Reused/expired nonce rejected |
| Unauthorized writes | Privy token verification, HTTP-only opaque session, contract authorization | Missing session and wrong issuer rejected |
| Wrong wallet or chain | Chain 10143 switch before writes; operation records bind wallet and payload | Wrong chain/wallet cannot advance intent |
| Duplicate broadcast | Deterministic operation ID plus PostgreSQL unique constraint and onchain duplicate preflight | Duplicate intent returns existing row |
| Malicious upload | Text-only MIME allowlist, 4 MB cap, fatal UTF-8 decode, extension and credential checks | Executable, HTML, oversized, malformed, secret-like input rejected |
| URL/SSRF | HTTPS-only, no credentials, localhost or `.local` rejection; IPFS through configured gateway | Unsafe scheme/private host rejected |
| Permanent disclosure | Dedicated publication review and public-only warning before upload | Draft stays local until explicit publication |
| Reputation gaming | Self-claims visible with zero external weight; issuer-scoped supersession; history retained | Projection lifecycle tests |
| Stale projection | Onchain record and indexer freshness shown separately | Indexer lag does not masquerade as missing chain data |
| Private access boundary | Phase 2 accepts public evidence only | No private upload or ACL API exists |

Negative claims remain disabled by the deployed contract pending the production legal gate.
