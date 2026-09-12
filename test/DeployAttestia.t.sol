// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";

import { DeployAttestia } from "../script/DeployAttestia.s.sol";

contract DeployAttestiaTest is Test {
    DeployAttestia internal deployer;

    function setUp() public {
        deployer = new DeployAttestia();
    }

    function testAllowsLocalAndTestnet() public view {
        deployer.validateDeployment(31_337, true, false);
        deployer.validateDeployment(10_143, true, false);
    }

    function testMainnetRequiresExplicitApproval() public {
        vm.expectRevert(DeployAttestia.MainnetApprovalRequired.selector);
        deployer.validateDeployment(143, false, false);
    }

    function testMainnetAlwaysRejectsNegativeClaims() public {
        vm.expectRevert(DeployAttestia.NegativeClaimsForbiddenOnMainnet.selector);
        deployer.validateDeployment(143, true, true);
    }

    function testRejectsUnknownChain() public {
        vm.expectRevert(abi.encodeWithSelector(DeployAttestia.UnsupportedChain.selector, 1));
        deployer.validateDeployment(1, false, true);
    }
}
