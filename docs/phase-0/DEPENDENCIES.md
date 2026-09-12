# Dependency verification

Checked 5 September 2026. **Documented**, **observed read-only**, and **integration-tested** are different evidence levels. No accounts were provisioned, no MON spent, and no transaction submitted. [Raw RPC observations](research/registry-observations.json) record the blocks used. Recheck before deployment; these findings are not an Attestia deployment manifest.

## Foundry: compatibility mismatch resolved as a tooling choice

- Existing global binary: Forge **1.7.1**, commit `4072e48705af9d93e3c0f6e29e93b5e9a40caed8`. Its Anvil help lists Ethereum/Optimism/Tempo, not Monad. It cannot satisfy the PRD Monad-mode gate.
- Official [Monad Foundry guide](https://docs.monad.xyz/tooling-and-infra/toolkits/foundry.md) requires **1.8+** and `network = "monad"`. The legacy Monad fork is unsuitable for current execution rules.
- [Official v1.8.0 release](https://github.com/foundry-rs/foundry/releases/tag/v1.8.0), published 2026-08-27, was downloaded into a task-specific temporary directory. SHA-256 matched the release checksum: `0599b28a19af97c3ae91fab12ad868a1922db7770c4adff6b6d26235862153d0` for `foundry_v1.8.0_darwin_arm64.tar.gz`.
- Executed binary reported **1.8.0**, commit `61ae26af36320d4fa1020f7db53785885e29eeb5`; Anvil help includes `monad`. Global tooling was not replaced. Temporary probe path was `/tmp/attestia-foundry-v1.8.0/` and is not a durable project dependency.
- Phase 1 CI pins official **1.8.0**, sets Monad network, and runs unit/fuzz/invariant/gas checks. Local Phase 1 verification used the checksum-matched binary above; 36 tests pass, including 4,096 invariant calls. This proves local contract behavior, not deployment readiness.

## Networks and ERC-8004

[Official network configuration](https://docs.monad.xyz/developer-essentials/testnet.md) identifies Testnet chain **10143**. The [Monad agent guide](https://docs.monad.xyz/guides/erc-8004.md) gives mainnet addresses; the [ERC-8004 deployment repository](https://github.com/erc-8004/erc-8004-contracts/blob/b9e466c250744a7e06b13dff9d3c2844ed64f825/README.md) distinguishes testnet deployments. Do not copy mainnet addresses into testnet config.

| Registry | Monad Testnet 10143 | Monad Mainnet 143 |
|---|---|---|
| Identity | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Reputation | `0x8004B663056A597Dffe9eCcC1965A193B7388713` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Validation | Unavailable in product | Unavailable in product |

Read-only JSON-RPC probe verified chain IDs, finalized block, nonempty proxy code, `getVersion()` returning `2.0.0`, EIP-1967 implementation slot and matching `getIdentityRegistry()` on both networks. Testnet block **59877922**; mainnet block **102157445**. This does not test agent registration, signing, all ABI methods or trustworthiness of an agent. No real agent metadata is seeded into the fictional wireflow.

Pinned integration references:

- ERC specification remains **Draft**, [revision `503591a6e80e6e1affdd6403341e25269141f046`](https://github.com/ethereum/ERCs/blob/503591a6e80e6e1affdd6403341e25269141f046/ERCS/erc-8004.md).
- Contract/ABI revision: `b9e466c250744a7e06b13dff9d3c2844ed64f825`.
- [Identity ABI](https://github.com/erc-8004/erc-8004-contracts/blob/b9e466c250744a7e06b13dff9d3c2844ed64f825/abis/IdentityRegistry.json) raw-file SHA-256: `cdb8e30f41a56ed53421126dab87551ff2a178b8463646f69f75bc5dc9620564`.
- [Reputation ABI](https://github.com/erc-8004/erc-8004-contracts/blob/b9e466c250744a7e06b13dff9d3c2844ed64f825/abis/ReputationRegistry.json) raw-file SHA-256: `867b7975a5f2f9fee38c4a148a84471b141f4de91409ccc0c6bebe3df4f04001`.

Adapter minimum: identity `ownerOf(uint256)`, `tokenURI(uint256)`, `register(string)`, `getVersion()`; reputation `getIdentityRegistry()`, `getClients(uint256)`, `readFeedback(...)`. Preserve native feedback fields and revocation status rather than mixing into Attestia counts. Registries are upgradeable dependencies: watch implementation/version changes and fail closed on incompatible writes. Attestia's own immutable deployment strategy does not make dependencies immutable.

Reproduce observations (read-only, requires network):

```sh
node docs/phase-0/scripts/probe-registries.mjs
```

The checked-in observation is a dated snapshot; rerunning prints a new observation without silently changing it. An unavailable endpoint produces `unverified`, never a fabricated address or verification result.

## Sponsorship: documented candidate, acceptance pending

Monad's [Next.js sponsored-transactions template](https://docs.monad.xyz/templates/next-serwist-privy-smart-wallet.md) documents Privy smart wallets with Pimlico on Monad Testnet, using Kernel and EntryPoint v0.7. That is evidence of an integration path, not proof for Attestia methods or every external wallet.

Default decision: self-paid external wallet flow first. Candidate for later sponsorship: managed ERC-4337 via Pimlico; embedded Privy path optional. Do not add account delegation or custom relayer infrastructure merely because it exists. Keep paymaster credentials and budget authorization server-side; do not copy example public-key patterns without restricting capabilities.

Before selecting/enabling candidate, demonstrate all of:

1. Funded testnet paymaster sponsors `registerContribution`, `attest`, `revoke` using Attestia ABI.
2. Authenticated signer maps to actual transaction sender/smart-account profile owner, including wallet switch and delegate revocation.
3. Arbitrary selectors, foreign registries, multicall bypass and unrelated value transfers rejected.
4. Concurrent daily cap/monthly budget enforcement and kill switch tested.
5. Rejected user operation, provider outage and exhausted budget recover through explicit self-paid review.
6. Store user-operation hash, transaction hash, actual billed amount and reconciliation evidence.

**Pending:** account credentials/funding and real method integration. Sponsor acceptance is not required to run Phase 0 or the self-paid local workflow; it is required before claiming sponsored onboarding works.

## Remaining infrastructure

| Dependency | Phase | Current evidence | Gate |
|---|---:|---|---|
| Node/pnpm | 0 | Local Node 26.7.0, pnpm 10.32.1; pinned development-only checker packages | Production runtime LTS selection in Phase 2 |
| Public RPC | 1 | Read calls succeeded today | SLA provider/fallback before Phase 5 |
| Envio | 2 | PRD selection | Run replay/reorg/finality fixture on target chain; confirm hosting quote |
| Supabase/Pinata | 2 | Public price pages reviewed; no account accessed | Region, credentials, IPFS entitlement, backups and scanning |
| Inngest/Upstash | 2 | Planned | Service limits, atomic nonce/budget operations, privacy review |
| S3/KMS | 4 | Planned | Encryption, access/retention tests, region and bill estimate |
| Stripe | 6 | Test-mode choice | Sandbox merchant account; signed webhook tests; live merchant eligibility/pricing gates |

No hidden `.env`, paid service, database, hosting project or deployment key is needed for this Phase 0 deliverable.
