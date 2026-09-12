# Deployment and verification

## Monad Testnet deployment

P1-10 completed on 12 September 2026, chain `10143`, through block `61841857`.

| Contract | Address | Source verification |
| --- | --- | --- |
| AttestiaProfileRegistry | [`0x610b…A32E`](https://testnet.monadvision.com/address/0x610b0399d82d8cE68E558a4f7a8CE87d84BdA32E) | Sourcify `match` |
| ContributionRegistry | [`0x7BFB…6c65`](https://testnet.monadvision.com/address/0x7BFB7e4A6325FC7Dd9141A13039B978852AF6c65) | Sourcify `match` |
| AttestationRegistry | [`0xa948…0b71`](https://testnet.monadvision.com/address/0xa948F485d0ddEb514402B046B3707Dfc16830b71) | Sourcify `match` |

Deployment transaction references and runtime hashes are recorded in [`monad-testnet.json`](../../deployments/monad-testnet.json). The two-wallet profile, contribution, claim, authorization, and revocation evidence is recorded in [`monad-testnet-smoke.json`](../../deployments/monad-testnet-smoke.json). Private keys are excluded from both files.

No live deployment is performed by the repository checks. Deployment requires an approved funded wallet and current network/address verification.

## Configuration

Copy `.env.example` to `.env`, keep it untracked, and set:

- `PRIVATE_KEY`: deployer key.
- `ATTESTIA_ADMIN`: pause authority. Use the approved multisig for production.
- `ERC8004_IDENTITY_REGISTRY`: verified registry for the selected chain.
- `ATTESTIA_NEGATIVE_CLAIMS`: may be `true` on local/testnet only.
- `ATTESTIA_MAINNET_APPROVED`: explicit release gate; required on chain 143.

The script accepts only Anvil (31337), Monad Testnet (10143), and Monad Mainnet (143). Mainnet always rejects negative claims, even when approval is enabled.

## Dry run and broadcast

```sh
source .env
forge script script/DeployAttestia.s.sol:DeployAttestia \
  --rpc-url "$MONAD_TESTNET_RPC_URL" \
  --network monad
```

Review simulation output. Add `--broadcast` only after the manual deployment approval recorded in the PRD. Add explorer verification flags only after re-checking the current Monad explorer procedure.

## Manifest

Build contracts, then create an undeployed artifact manifest:

```sh
forge build
pnpm contracts:manifest
```

After deployment, create `deployments/monad-testnet.input.json`:

```json
{
  "status": "deployed",
  "chainId": 10143,
  "blockNumber": 123,
  "transactionHashes": ["0x..."],
  "pauseAuthority": "0x...",
  "erc8004IdentityRegistry": "0x...",
  "negativeClaimsEnabled": true,
  "contracts": {
    "AttestiaProfileRegistry": "0x...",
    "ContributionRegistry": "0x...",
    "AttestationRegistry": "0x..."
  }
}
```

`blockNumber` is the final deployment transaction block, when all three addresses contain code.

Generate the public manifest:

```sh
pnpm contracts:manifest -- \
  --deployment=deployments/monad-testnet.input.json \
  --rpc-url="$MONAD_TESTNET_RPC_URL" \
  --output=deployments/monad-testnet.json
```

The generator rejects malformed deployment data, reads each deployed contract with `eth_getCode`, and records its runtime hash. P1-10 used two independent wallets to register profiles and a contribution, issue two attestations, reject an unauthorized revoke, and directly revoke through the issuer wallet.
