// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";

import { AttestiaProfileRegistry } from "../src/AttestiaProfileRegistry.sol";
import { AttestationRegistry } from "../src/AttestationRegistry.sol";
import { ContributionRegistry } from "../src/ContributionRegistry.sol";
import { MockERC8004IdentityRegistry } from "./mocks/MockERC8004IdentityRegistry.sol";

contract AttestationHandler is Test {
    AttestationRegistry public immutable registry;
    bytes32 public immutable contributionId;
    bytes32 public immutable claimType;
    address public immutable issuer;

    bytes32[] private _issuedIds;
    bytes32 public currentId;
    uint256 private _sequence;

    constructor(AttestationRegistry registry_, bytes32 contributionId_, address issuer_) {
        registry = registry_;
        contributionId = contributionId_;
        issuer = issuer_;
        claimType = registry_.COMPLETION();
    }

    function step(uint256 seed) external {
        ++_sequence;
        bytes32 nextId = keccak256(abi.encode("invariant-attestation", _sequence, seed));

        if (currentId == bytes32(0)) {
            _issue(nextId, bytes32(0));
            return;
        }

        bool active = registry.isActive(currentId);
        if (active && seed % 2 == 0) {
            _issue(nextId, currentId);
        } else if (active) {
            vm.prank(issuer);
            registry.revoke(currentId, keccak256(abi.encode("reason", seed)), "ipfs://reason");
        } else {
            _issue(nextId, bytes32(0));
        }
    }

    function issuedCount() external view returns (uint256) {
        return _issuedIds.length;
    }

    function issuedId(uint256 index) external view returns (bytes32) {
        return _issuedIds[index];
    }

    function _issue(bytes32 id, bytes32 supersedes) private {
        vm.prank(issuer);
        registry.attest(
            id,
            contributionId,
            claimType,
            1,
            bytes32(0),
            bytes32(0),
            0,
            bytes32(0),
            keccak256(abi.encode("metadata", id)),
            "ipfs://claim",
            keccak256(abi.encode("evidence", id)),
            "ipfs://evidence",
            0,
            supersedes
        );
        _issuedIds.push(id);
        currentId = id;
    }
}

contract AttestationInvariantTest is Test {
    AttestationRegistry internal registry;
    AttestationHandler internal handler;

    function setUp() public {
        address admin = makeAddr("admin");
        address creator = makeAddr("creator");
        address issuer = makeAddr("issuer");
        bytes32 profileId = keccak256("profile");
        bytes32 contributionId = keccak256("contribution");

        MockERC8004IdentityRegistry identity = new MockERC8004IdentityRegistry();
        AttestiaProfileRegistry profiles = new AttestiaProfileRegistry(admin, address(identity));
        ContributionRegistry contributions = new ContributionRegistry(admin, address(profiles));
        registry = new AttestationRegistry(admin, address(profiles), address(contributions), true);

        vm.prank(creator);
        profiles.createProfile(profileId, "ipfs://profile", keccak256("profile-metadata"));
        vm.prank(creator);
        contributions.registerContribution(
            contributionId,
            profileId,
            keccak256("artifact"),
            keccak256("contribution-metadata"),
            "ipfs://contribution",
            bytes32(0)
        );

        handler = new AttestationHandler(registry, contributionId, issuer);
        targetContract(address(handler));
    }

    function invariantRevokedAndSupersededRecordsNeverReactivate() public view {
        uint256 count = handler.issuedCount();
        for (uint256 i; i < count; ++i) {
            bytes32 id = handler.issuedId(i);
            AttestationRegistry.Attestation memory record = registry.attestation(id);
            if (record.revokedAt != 0 || record.supersededBy != bytes32(0)) {
                assertFalse(registry.isActive(id));
            }
        }
    }

    function invariantAtMostOneActiveRecordForIssuerKey() public view {
        uint256 count = handler.issuedCount();
        uint256 active;
        for (uint256 i; i < count; ++i) {
            if (registry.isActive(handler.issuedId(i))) ++active;
        }
        assertLe(active, 1);
    }
}
