// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Script } from "forge-std/Script.sol";

import { AttestiaProfileRegistry } from "../src/AttestiaProfileRegistry.sol";
import { AttestationRegistry } from "../src/AttestationRegistry.sol";
import { ContributionRegistry } from "../src/ContributionRegistry.sol";

contract DeployAttestia is Script {
    uint256 internal constant LOCAL_CHAIN_ID = 31_337;
    uint256 internal constant MONAD_TESTNET_CHAIN_ID = 10_143;
    uint256 internal constant MONAD_MAINNET_CHAIN_ID = 143;

    error UnsupportedChain(uint256 chainId);
    error MainnetApprovalRequired();
    error NegativeClaimsForbiddenOnMainnet();

    function run()
        external
        returns (
            AttestiaProfileRegistry profiles,
            ContributionRegistry contributions,
            AttestationRegistry attestations
        )
    {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.envAddress("ATTESTIA_ADMIN");
        address identityRegistry = vm.envAddress("ERC8004_IDENTITY_REGISTRY");
        bool negativeClaims = vm.envOr("ATTESTIA_NEGATIVE_CLAIMS", false);
        bool mainnetApproved = vm.envOr("ATTESTIA_MAINNET_APPROVED", false);

        validateDeployment(block.chainid, negativeClaims, mainnetApproved);

        vm.startBroadcast(privateKey);
        profiles = new AttestiaProfileRegistry(admin, identityRegistry);
        contributions = new ContributionRegistry(admin, address(profiles));
        attestations = new AttestationRegistry(
            admin, address(profiles), address(contributions), negativeClaims
        );
        vm.stopBroadcast();
    }

    function validateDeployment(uint256 chainId, bool negativeClaims, bool mainnetApproved)
        public
        pure
    {
        if (
            chainId != LOCAL_CHAIN_ID && chainId != MONAD_TESTNET_CHAIN_ID
                && chainId != MONAD_MAINNET_CHAIN_ID
        ) revert UnsupportedChain(chainId);
        if (chainId == MONAD_MAINNET_CHAIN_ID && !mainnetApproved) {
            revert MainnetApprovalRequired();
        }
        if (chainId == MONAD_MAINNET_CHAIN_ID && negativeClaims) {
            revert NegativeClaimsForbiddenOnMainnet();
        }
    }
}
