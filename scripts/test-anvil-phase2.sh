#!/usr/bin/env bash
set -euo pipefail

rpc="http://127.0.0.1:18547"
mnemonic="test test test test test test test test test test test junk"
admin_key="$(cast wallet private-key "$mnemonic" "m/44'/60'/0'/0/0")"
creator_key="$(cast wallet private-key "$mnemonic" "m/44'/60'/0'/0/1")"
reviewer_key="$(cast wallet private-key "$mnemonic" "m/44'/60'/0'/0/2")"
admin="$(cast wallet address --private-key "$admin_key")"
zero="0x$(printf '0%.0s' {1..64})"
anvil --silent --port 18547 >"${TMPDIR:-/tmp}/attestia-anvil.log" 2>&1 &
anvil_pid=$!
trap 'kill "$anvil_pid" 2>/dev/null || true; wait "$anvil_pid" 2>/dev/null || true' EXIT

for _ in {1..30}; do cast block-number --rpc-url "$rpc" >/dev/null 2>&1 && break; sleep .1; done

deploy() {
  forge create "$1" --rpc-url "$rpc" --private-key "$admin_key" --broadcast --json "${@:2}" | jq -r '.deployedTo'
}

identity="$(deploy test/mocks/MockERC8004IdentityRegistry.sol:MockERC8004IdentityRegistry)"
profiles="$(deploy src/AttestiaProfileRegistry.sol:AttestiaProfileRegistry --constructor-args "$admin" "$identity")"
contributions="$(deploy src/ContributionRegistry.sol:ContributionRegistry --constructor-args "$admin" "$profiles")"
attestations="$(deploy src/AttestationRegistry.sol:AttestationRegistry --constructor-args "$admin" "$profiles" "$contributions" true)"

profile_id="$(cast keccak 'phase2-profile')"
contribution_id="$(cast keccak 'phase2-contribution')"
artifact_digest="$(cast keccak 'phase2-artifact')"
metadata_digest="$(cast keccak 'phase2-metadata')"
claim_digest="$(cast keccak 'phase2-claim')"
evidence_digest="$(cast keccak 'phase2-evidence')"
claim_type="$(cast keccak 'COMPLETION')"
attestation_id="$(cast keccak 'phase2-attestation')"
revocation_digest="$(cast keccak 'phase2-revocation')"

cast send "$profiles" 'createProfile(bytes32,string,bytes32)' "$profile_id" ipfs://profile "$metadata_digest" --rpc-url "$rpc" --private-key "$creator_key" >/dev/null
cast send "$contributions" 'registerContribution(bytes32,bytes32,bytes32,bytes32,string,bytes32)' "$contribution_id" "$profile_id" "$artifact_digest" "$metadata_digest" ipfs://contribution "$zero" --rpc-url "$rpc" --private-key "$creator_key" >/dev/null
cast send "$attestations" 'attest(bytes32,bytes32,bytes32,int8,bytes32,bytes32,uint32,bytes32,bytes32,string,bytes32,string,uint64,bytes32)' "$attestation_id" "$contribution_id" "$claim_type" 1 "$zero" "$zero" 0 "$zero" "$claim_digest" ipfs://attestation "$evidence_digest" https://example.com/evidence 0 "$zero" --rpc-url "$rpc" --private-key "$reviewer_key" >/dev/null
cast send "$attestations" 'revoke(bytes32,bytes32,string)' "$attestation_id" "$revocation_digest" ipfs://revocation --rpc-url "$rpc" --private-key "$reviewer_key" >/dev/null

test "$(cast call "$contributions" 'contributionExists(bytes32)(bool)' "$contribution_id" --rpc-url "$rpc")" = "true"
test "$(cast call "$attestations" 'isActive(bytes32)(bool)' "$attestation_id" --rpc-url "$rpc")" = "false"
echo "Anvil Phase 2 lifecycle passed: profile → contribution → attest → revoke."
