# Phase 3 live acceptance — 8 October 2026

Network: Monad Testnet, chain 10143. Public test fixtures only. User selected the active Privy wallet `0xFdd98e2f0E331d6Eb645Bf1f480a559eb0d48cE0` for agent ownership. Transactions were approved through the existing Privy interface; no key was exported. Fees were paid in testnet MON.

## Confirmed transactions

| Action | Transaction |
| --- | --- |
| ERC-8004 registration, agent 2071 | `0x408b86f2f0e4b2cdde067f6ac7ab96077e2173789eb601cd5d47c5976242171b` |
| Link Attestia profile | `0xb1e64cd01ba5f66d069faee27a4f5a7f0e04f94627ec547680c5161fbebffcf1` |
| Publish declared policy v1 | `0xcef7945fd5ce89064eb0a889f3a8018f2ab9399fd5dd4005686f7e4d6ab3707f` |
| Publish declared policy v2 | `0x1f33c0d45e98db4e804b847967ab0997df4136002d4ca61345026690117be8ce` |
| Pause declared policy v2 | `0xe27199ffc664579640f3458708ed08d4155707a5ef9aa9f65ca89def651c33b6` |
| Register contribution | `0x46cd81959e229bd50c628e2f9c2de90ffdc35f7bd133c69899f4f798a192f9d6` |
| External Completion claim | recorded as `0x97f563310fc6963f105c7e8d4f05e4261a91280aa9f255be54a6808af02227c8` |
| External Provenance claim | `0x741d06cb4f258192996f72fc3753277fa2ef6968c6a6fb125f95442604834c98` |
| Revoke Provenance claim | `0x75bb6cda432102fdf5bc75b6cef6c756ade02f7b7e32fceccf01d4d197be82b2` |

Profile: `0x68b14aa3328a48a10602a401aaafcc80e71f5cf4b6c5cb98a3edb6cc2c81ac24`.
Contribution: `0x3eac97873259cafae332c5554bcff3fbb524e33d761ead9a188bf5d02312a99e`.

The agent page resolved live ownership, showed policy version 2 paused and both versions in history, and displayed zero native ERC-8004 feedback separately from Attestia claims. Envio returned version 2 paused and retained the first version. The contribution page showed Indexed and zero claims before reviewer login.

## Engineering verification

- Phase 0: 68 specification checks, 54 documentation links, environment-template validation and 13 browser tests passed.
- Phase 1: contract test suite, formatting/lint, gas snapshot and size commands exited successfully.
- Phase 2 Anvil profile → contribution → attest → revoke passed.
- Web: 37 unit/API/render tests and 9 Playwright tests passed; typecheck/lint passed.
- Indexer: 9 tests passed; codegen/typecheck passed. New tests invoke registered event handlers, not just projection helpers. They first failed for delayed duplicate creates wiping lifecycle, duplicate policy publication clearing pause, and old policy events replacing the latest actor. All three now pass.
- Graph: 150-node fixture verifies type clusters, separate claimed/attested/lifecycle edge counts, accessible HTML and progressive disclosure controls. Real browser regression covers keyboard, axe, reduced motion and 360px; this is not a 150-node browser interaction test.
- Event delivery assumes canonical Envio ordering for first-time events. Delayed duplicate events are tolerated; arbitrary first-time child events preceding their parent are not advertised as supported.

## Release

Source `97eaed3` pushed to `codex/phase-3` and `envio`. Envio release Active, synced 100%, endpoint `https://indexer.dev.hyperindex.xyz/e4eb908/v1/graphql`. Public GraphQL verified policy 2071 version 2 paused.

Vercel `dpl_9SnxyhpgtnYYVHSEjU3gTjzLbJMR` deployed code. Production `NEXT_PUBLIC_ENVIO_GRAPHQL_URL` then switched to the verified new endpoint; `dpl_3Bkj5W5SpGHaUjD7eiefC71QhbUm` reached READY and is aliased to https://attesia.vercel.app.

## Reviewer lifecycle acceptance — 10 October 2026

Reviewer wallet `0x37c6476C4621DC592BB8ba0ec56D499D8B1f2148` is distinct from agent owner `0xFdd98e2f0E331d6Eb645Bf1f480a559eb0d48cE0`. It issued external Completion and Provenance claims. Before revocation, the contribution API reported two active external claims. Provenance claim `0xffb2a42949265dcc5638c48c35db8618dd141c36ddd757b3d421d1d67b9a520a` was then revoked by its issuer.

Envio reflected the revoke in about five seconds:

- contribution counts changed from active/external `2/2` to `1/1`;
- `reputation-v1` retained Completion active=1 and changed Provenance to active=0, revoked=1, historical=1;
- the graph retained both attested relationships and marked the Provenance edge `revoked`;
- the feed retained the historical claim while recalculating activeExternal=1, uniqueAttesters=1 and evidenceCoverage=1;
- source/freshness blocks advanced through `69705669`.

The initial Provenance submission exposed a Privy stale-fee failure while Monad RPC gas price was 102 gwei. Source `4e5a628` now estimates gas and EIP-1559 fees immediately before each signature and applies a 20% buffer. The fix passed 38 web tests and typecheck, then Vercel production deployment `dpl_4ZkNQ49YN4xCpVewEfKEG5A5Dp5s` reached READY at https://attesia.vercel.app. The retried claim and subsequent revoke both succeeded.

## Result

The requested live flow is complete: agent ownership resolved from ERC-8004, linked profile and declared policy lifecycle remained visible, contribution received two external claims, one claim was revoked, and reputation/graph/feed changed after indexing. Phase 3 acceptance gates are satisfied on Monad Testnet.
