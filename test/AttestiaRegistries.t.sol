// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

import { AttestiaProfileRegistry } from "../src/AttestiaProfileRegistry.sol";
import { AttestationRegistry } from "../src/AttestationRegistry.sol";
import { ContributionRegistry } from "../src/ContributionRegistry.sol";
import { MockERC8004IdentityRegistry } from "./mocks/MockERC8004IdentityRegistry.sol";

contract AttestiaRegistriesTest is Test {
    address internal admin = makeAddr("admin");
    address internal creator = makeAddr("creator");
    address internal delegate = makeAddr("delegate");
    address internal reviewer = makeAddr("reviewer");
    address internal reviewerTwo = makeAddr("reviewer-two");
    address internal agentOwner = makeAddr("agent-owner");
    address internal agentBuyer = makeAddr("agent-buyer");

    bytes32 internal constant PROFILE_ID = keccak256("profile");
    bytes32 internal constant OTHER_PROFILE_ID = keccak256("other-profile");
    bytes32 internal constant AGENT_PROFILE_ID = keccak256("agent-profile");
    bytes32 internal constant CONTRIBUTION_ID = keccak256("contribution");
    bytes32 internal constant ARTIFACT_DIGEST = keccak256("artifact");
    bytes32 internal constant METADATA_DIGEST = keccak256("metadata");
    bytes32 internal constant EVIDENCE_DIGEST = keccak256("evidence");
    bytes32 internal constant WORKSPACE_ID = keccak256("workspace");
    bytes32 internal constant RUBRIC_ID = keccak256("rubric");
    bytes32 internal constant RUBRIC_DIGEST = keccak256("rubric-metadata");
    uint256 internal constant AGENT_ID = 42;

    MockERC8004IdentityRegistry internal identity;
    AttestiaProfileRegistry internal profiles;
    ContributionRegistry internal contributions;
    AttestationRegistry internal attestations;

    function setUp() public {
        identity = new MockERC8004IdentityRegistry();
        identity.setOwner(AGENT_ID, agentOwner);
        profiles = new AttestiaProfileRegistry(admin, address(identity));
        contributions = new ContributionRegistry(admin, address(profiles));
        attestations =
            new AttestationRegistry(admin, address(profiles), address(contributions), true);

        vm.prank(creator);
        profiles.createProfile(PROFILE_ID, "ipfs://profile", METADATA_DIGEST);
        _registerContribution(
            creator, CONTRIBUTION_ID, ARTIFACT_DIGEST, METADATA_DIGEST, bytes32(0)
        );
    }

    function testCreateAndUpdateHumanProfile() public {
        AttestiaProfileRegistry.Profile memory record = profiles.profile(PROFILE_ID);
        assertEq(record.ownerSnapshot, creator);
        assertFalse(record.isAgent);

        bytes32 updateDigest = keccak256("profile-update");
        vm.prank(creator);
        profiles.updateProfile(PROFILE_ID, "ipfs://profile-v2", updateDigest);

        record = profiles.profile(PROFILE_ID);
        assertEq(record.metadataDigest, updateDigest);
        assertEq(record.metadataURI, "ipfs://profile-v2");
    }

    function testCannotCreateDuplicateOrUpdateForeignProfile() public {
        vm.prank(creator);
        vm.expectRevert(
            abi.encodeWithSelector(
                AttestiaProfileRegistry.ProfileAlreadyExists.selector, PROFILE_ID
            )
        );
        profiles.createProfile(PROFILE_ID, "ipfs://duplicate", keccak256("duplicate"));

        vm.prank(reviewer);
        vm.expectRevert(
            abi.encodeWithSelector(
                AttestiaProfileRegistry.Unauthorized.selector, PROFILE_ID, reviewer
            )
        );
        profiles.updateProfile(PROFILE_ID, "ipfs://stolen", keccak256("stolen"));
    }

    function testHumanDelegateCanWriteThenLosesAccess() public {
        vm.prank(creator);
        profiles.setDelegate(PROFILE_ID, delegate, true);

        bytes32 delegatedContribution = keccak256("delegated-contribution");
        _registerContribution(
            delegate,
            delegatedContribution,
            keccak256("delegated-artifact"),
            keccak256("delegated-metadata"),
            bytes32(0)
        );
        assertTrue(contributions.contributionExists(delegatedContribution));

        vm.prank(creator);
        profiles.setDelegate(PROFILE_ID, delegate, false);
        vm.prank(delegate);
        vm.expectRevert(
            abi.encodeWithSelector(ContributionRegistry.Unauthorized.selector, PROFILE_ID, delegate)
        );
        contributions.registerContribution(
            keccak256("blocked"),
            PROFILE_ID,
            keccak256("blocked-artifact"),
            keccak256("blocked-metadata"),
            "ipfs://blocked",
            bytes32(0)
        );
    }

    function testAgentAuthorizationFollowsCurrentERC8004Owner() public {
        vm.prank(agentOwner);
        profiles.createAgentProfile(
            AGENT_PROFILE_ID, AGENT_ID, "ipfs://agent", keccak256("agent-metadata")
        );
        assertTrue(profiles.isAuthorized(AGENT_PROFILE_ID, agentOwner));

        identity.setOwner(AGENT_ID, agentBuyer);
        assertFalse(profiles.isAuthorized(AGENT_PROFILE_ID, agentOwner));
        assertTrue(profiles.isAuthorized(AGENT_PROFILE_ID, agentBuyer));

        vm.prank(agentOwner);
        vm.expectRevert(
            abi.encodeWithSelector(
                AttestiaProfileRegistry.Unauthorized.selector, AGENT_PROFILE_ID, agentOwner
            )
        );
        profiles.updateProfile(
            AGENT_PROFILE_ID, "ipfs://old-owner", keccak256("old-owner-metadata")
        );

        vm.prank(agentBuyer);
        profiles.updateProfile(
            AGENT_PROFILE_ID, "ipfs://new-owner", keccak256("new-owner-metadata")
        );
    }

    function testAgentProfileFailsClosedWhenIdentityRegistryUnavailable() public {
        vm.prank(agentOwner);
        profiles.createAgentProfile(
            AGENT_PROFILE_ID, AGENT_ID, "ipfs://agent", keccak256("agent-metadata")
        );
        identity.setUnavailable(true);

        vm.expectRevert(
            abi.encodeWithSelector(
                AttestiaProfileRegistry.IdentityRegistryUnavailable.selector, AGENT_ID
            )
        );
        profiles.isAuthorized(AGENT_PROFILE_ID, agentOwner);
    }

    function testAgentCannotHaveHumanDelegate() public {
        vm.prank(agentOwner);
        profiles.createAgentProfile(
            AGENT_PROFILE_ID, AGENT_ID, "ipfs://agent", keccak256("agent-metadata")
        );

        vm.prank(agentOwner);
        vm.expectRevert(
            abi.encodeWithSelector(
                AttestiaProfileRegistry.HumanProfileRequired.selector, AGENT_PROFILE_ID
            )
        );
        profiles.setDelegate(AGENT_PROFILE_ID, delegate, true);
    }

    function testAgentPolicyVersionsAndPauses() public {
        vm.prank(agentOwner);
        profiles.createAgentProfile(
            AGENT_PROFILE_ID, AGENT_ID, "ipfs://agent", keccak256("agent-metadata")
        );

        vm.startPrank(agentOwner);
        profiles.setAgentPolicy(AGENT_ID, keccak256("policy-v1"), "ipfs://policy-v1");
        profiles.pausePolicy(AGENT_ID);
        AttestiaProfileRegistry.AgentPolicy memory policy = profiles.agentPolicy(AGENT_ID);
        assertEq(policy.version, 1);
        assertTrue(policy.paused);

        profiles.setAgentPolicy(AGENT_ID, keccak256("policy-v2"), "ipfs://policy-v2");
        vm.stopPrank();
        policy = profiles.agentPolicy(AGENT_ID);
        assertEq(policy.version, 2);
        assertFalse(policy.paused);
    }

    function testCannotPauseMissingAgentPolicy() public {
        vm.prank(agentOwner);
        profiles.createAgentProfile(
            AGENT_PROFILE_ID, AGENT_ID, "ipfs://agent", keccak256("agent-metadata")
        );

        vm.prank(agentOwner);
        vm.expectRevert(
            abi.encodeWithSelector(AttestiaProfileRegistry.PolicyNotFound.selector, AGENT_ID)
        );
        profiles.pausePolicy(AGENT_ID);
    }

    function testContributionRootAndMetadataOnlyRevision() public {
        bytes32 revisionId = keccak256("revision");
        bytes32 revisionMetadata = keccak256("revision-metadata");
        _registerContribution(
            creator, revisionId, ARTIFACT_DIGEST, revisionMetadata, CONTRIBUTION_ID
        );

        ContributionRegistry.Contribution memory revision = contributions.contribution(revisionId);
        assertEq(revision.parentId, CONTRIBUTION_ID);
        assertEq(revision.artifactDigest, ARTIFACT_DIGEST);
        assertEq(revision.metadataDigest, revisionMetadata);
    }

    function testRejectsDuplicateRootArtifactAndExactRevision() public {
        vm.prank(creator);
        vm.expectRevert(
            abi.encodeWithSelector(ContributionRegistry.DuplicateArtifact.selector, CONTRIBUTION_ID)
        );
        contributions.registerContribution(
            keccak256("duplicate-root"),
            PROFILE_ID,
            ARTIFACT_DIGEST,
            keccak256("different-metadata"),
            "ipfs://duplicate-root",
            bytes32(0)
        );

        vm.prank(creator);
        vm.expectRevert(
            abi.encodeWithSelector(ContributionRegistry.DuplicateRecord.selector, CONTRIBUTION_ID)
        );
        contributions.registerContribution(
            keccak256("exact-duplicate"),
            PROFILE_ID,
            ARTIFACT_DIGEST,
            METADATA_DIGEST,
            "ipfs://exact-duplicate",
            CONTRIBUTION_ID
        );
    }

    function testRevisionRequiresSameCreatorAndChangedMetadata() public {
        vm.prank(reviewer);
        profiles.createProfile(OTHER_PROFILE_ID, "ipfs://other", keccak256("other-profile"));

        vm.prank(reviewer);
        vm.expectRevert(
            abi.encodeWithSelector(
                ContributionRegistry.ParentCreatorMismatch.selector,
                CONTRIBUTION_ID,
                OTHER_PROFILE_ID
            )
        );
        contributions.registerContribution(
            keccak256("foreign-revision"),
            OTHER_PROFILE_ID,
            keccak256("foreign-artifact"),
            keccak256("foreign-metadata"),
            "ipfs://foreign",
            CONTRIBUTION_ID
        );

        vm.prank(creator);
        vm.expectRevert(
            abi.encodeWithSelector(ContributionRegistry.MetadataUnchanged.selector, CONTRIBUTION_ID)
        );
        contributions.registerContribution(
            keccak256("unchanged-revision"),
            PROFILE_ID,
            keccak256("new-artifact"),
            METADATA_DIGEST,
            "ipfs://unchanged",
            CONTRIBUTION_ID
        );
    }

    function testArchiveIsAuthorizedAndHistoricalRecordRemains() public {
        vm.prank(reviewer);
        vm.expectRevert(
            abi.encodeWithSelector(ContributionRegistry.Unauthorized.selector, PROFILE_ID, reviewer)
        );
        contributions.archiveContribution(CONTRIBUTION_ID);

        vm.prank(creator);
        contributions.archiveContribution(CONTRIBUTION_ID);
        assertTrue(contributions.contribution(CONTRIBUTION_ID).archivedAt != 0);
        assertTrue(contributions.contributionExists(CONTRIBUTION_ID));
    }

    function testPauseBlocksNewWritesButKeepsReadsAndIssuerRevocation() public {
        bytes32 claimId = keccak256("claim-before-pause");
        bytes32 completion = attestations.COMPLETION();
        bytes32 authorship = attestations.AUTHORSHIP();
        _attest(reviewer, claimId, completion, 1, 0, bytes32(0));

        vm.startPrank(admin);
        profiles.pause();
        contributions.pause();
        attestations.pause();
        vm.stopPrank();

        vm.prank(reviewer);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        profiles.createProfile(OTHER_PROFILE_ID, "ipfs://other", keccak256("other"));

        vm.prank(creator);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        contributions.registerContribution(
            keccak256("paused-contribution"),
            PROFILE_ID,
            keccak256("paused-artifact"),
            keccak256("paused-metadata"),
            "ipfs://paused",
            bytes32(0)
        );

        vm.prank(reviewerTwo);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        _callAttest(keccak256("claim-during-pause"), authorship, 1, 0, bytes32(0));

        assertEq(profiles.profile(PROFILE_ID).ownerSnapshot, creator);
        assertTrue(contributions.contributionExists(CONTRIBUTION_ID));
        vm.prank(reviewer);
        attestations.revoke(claimId, keccak256("reason"), "ipfs://reason");
        assertFalse(attestations.isActive(claimId));
    }

    function testAllFiveClaimTypesCanBeIssued() public {
        bytes32[5] memory types_ = [
            attestations.COMPLETION(),
            attestations.AUTHORSHIP(),
            attestations.QUALITY(),
            attestations.USAGE(),
            attestations.PROVENANCE()
        ];

        for (uint256 i; i < types_.length; ++i) {
            bytes32 id = keccak256(abi.encode("claim", i));
            if (types_[i] == attestations.QUALITY()) {
                _attestQuality(reviewer, id, 1, bytes32(0));
            } else {
                _attest(reviewer, id, types_[i], 1, 0, bytes32(0));
            }
            assertTrue(attestations.isActive(id));
        }
    }

    function testQualityRequiresFullImmutableRubricReference() public {
        bytes32 quality = attestations.QUALITY();
        vm.prank(reviewer);
        vm.expectRevert(AttestationRegistry.InvalidRubricBinding.selector);
        attestations.attest(
            keccak256("bad-quality"),
            CONTRIBUTION_ID,
            quality,
            1,
            bytes32(0),
            bytes32(0),
            0,
            bytes32(0),
            METADATA_DIGEST,
            "ipfs://claim",
            EVIDENCE_DIGEST,
            "ipfs://evidence",
            0,
            bytes32(0)
        );
    }

    function testNonQualityRejectsRubricReference() public {
        bytes32 completion = attestations.COMPLETION();
        vm.prank(reviewer);
        vm.expectRevert(AttestationRegistry.UnexpectedRubricBinding.selector);
        attestations.attest(
            keccak256("bad-completion"),
            CONTRIBUTION_ID,
            completion,
            1,
            WORKSPACE_ID,
            RUBRIC_ID,
            1,
            RUBRIC_DIGEST,
            METADATA_DIGEST,
            "ipfs://claim",
            EVIDENCE_DIGEST,
            "ipfs://evidence",
            0,
            bytes32(0)
        );
    }

    function testSelfRelationshipIsSnapshottedAtIssuance() public {
        bytes32 selfClaim = keccak256("self-claim");
        _attest(creator, selfClaim, attestations.AUTHORSHIP(), 1, 0, bytes32(0));
        assertTrue(attestations.attestation(selfClaim).selfAtIssuance);

        bytes32 externalClaim = keccak256("external-claim");
        _attest(reviewer, externalClaim, attestations.AUTHORSHIP(), 1, 0, bytes32(0));
        assertFalse(attestations.attestation(externalClaim).selfAtIssuance);
    }

    function testDifferentIssuersCoexist() public {
        bytes32 first = keccak256("reviewer-one");
        bytes32 second = keccak256("reviewer-two");
        _attest(reviewer, first, attestations.COMPLETION(), 1, 0, bytes32(0));
        _attest(reviewerTwo, second, attestations.COMPLETION(), 1, 0, bytes32(0));

        assertTrue(attestations.isActive(first));
        assertTrue(attestations.isActive(second));
    }

    function testSameIssuerMustSupersedeActiveClaim() public {
        bytes32 first = keccak256("first");
        bytes32 second = keccak256("second");
        bytes32 completion = attestations.COMPLETION();
        _attest(reviewer, first, completion, 1, 0, bytes32(0));

        vm.prank(reviewer);
        vm.expectRevert(
            abi.encodeWithSelector(AttestationRegistry.ActiveClaimExists.selector, first)
        );
        _callAttest(second, completion, 1, 0, bytes32(0));

        _attest(reviewer, second, completion, 1, 0, first);
        assertFalse(attestations.isActive(first));
        assertTrue(attestations.isActive(second));
        assertEq(attestations.attestation(first).supersededBy, second);
    }

    function testSupersededClaimNeverReactivatesWhenReplacementRevoked() public {
        bytes32 first = keccak256("first");
        bytes32 second = keccak256("second");
        _attest(reviewer, first, attestations.COMPLETION(), 1, 0, bytes32(0));
        _attest(reviewer, second, attestations.COMPLETION(), 1, 0, first);

        vm.prank(reviewer);
        attestations.revoke(second, keccak256("reason"), "ipfs://reason");
        assertFalse(attestations.isActive(first));
        assertFalse(attestations.isActive(second));
    }

    function testExpiredClaimAllowsFreshClaimWithoutSupersession() public {
        bytes32 first = keccak256("expiring");
        bytes32 second = keccak256("fresh");
        uint64 expiry = uint64(block.timestamp + 10);
        _attest(reviewer, first, attestations.COMPLETION(), 1, expiry, bytes32(0));
        vm.warp(expiry);
        assertFalse(attestations.isActive(first));

        _attest(reviewer, second, attestations.COMPLETION(), 1, 0, bytes32(0));
        assertTrue(attestations.isActive(second));
    }

    function testOnlyIssuerCanRevokeAndIssuerCanRevokeDuringPause() public {
        bytes32 id = keccak256("revocable");
        _attest(reviewer, id, attestations.COMPLETION(), 1, 0, bytes32(0));

        vm.prank(reviewerTwo);
        vm.expectRevert(
            abi.encodeWithSelector(
                AttestationRegistry.UnauthorizedRevocation.selector, id, reviewerTwo
            )
        );
        attestations.revoke(id, keccak256("wrong"), "ipfs://wrong");

        vm.prank(admin);
        attestations.pause();
        vm.prank(reviewer);
        attestations.revoke(id, keccak256("reason"), "ipfs://reason");
        assertFalse(attestations.isActive(id));
    }

    function testProductionRegistryRejectsNegativeClaim() public {
        AttestationRegistry production =
            new AttestationRegistry(admin, address(profiles), address(contributions), false);
        bytes32 quality = production.QUALITY();

        vm.prank(reviewer);
        vm.expectRevert(AttestationRegistry.NegativeClaimsDisabled.selector);
        production.attest(
            keccak256("negative"),
            CONTRIBUTION_ID,
            quality,
            -1,
            WORKSPACE_ID,
            RUBRIC_ID,
            1,
            RUBRIC_DIGEST,
            METADATA_DIGEST,
            "ipfs://negative",
            EVIDENCE_DIGEST,
            "ipfs://evidence",
            0,
            bytes32(0)
        );
    }

    function testNegativeClaimRequiresEvidence() public {
        bytes32 quality = attestations.QUALITY();
        vm.prank(reviewer);
        vm.expectRevert(AttestationRegistry.InvalidEvidence.selector);
        attestations.attest(
            keccak256("negative-no-evidence"),
            CONTRIBUTION_ID,
            quality,
            -1,
            WORKSPACE_ID,
            RUBRIC_ID,
            1,
            RUBRIC_DIGEST,
            METADATA_DIGEST,
            "ipfs://negative",
            bytes32(0),
            "",
            0,
            bytes32(0)
        );
    }

    function testRejectsInvalidResultExpiryAndEvidencePair() public {
        bytes32 completion = attestations.COMPLETION();

        vm.prank(reviewer);
        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.InvalidResult.selector, 0));
        _callAttest(keccak256("zero-result"), completion, 0, 0, bytes32(0));

        uint64 expiredAt = uint64(block.timestamp);
        vm.prank(reviewer);
        vm.expectRevert(
            abi.encodeWithSelector(AttestationRegistry.InvalidExpiry.selector, expiredAt)
        );
        _callAttest(keccak256("expired-at-issuance"), completion, 1, expiredAt, bytes32(0));

        vm.prank(reviewer);
        vm.expectRevert(AttestationRegistry.InvalidEvidence.selector);
        attestations.attest(
            keccak256("unpaired-evidence"),
            CONTRIBUTION_ID,
            completion,
            1,
            bytes32(0),
            bytes32(0),
            0,
            bytes32(0),
            METADATA_DIGEST,
            "ipfs://claim",
            EVIDENCE_DIGEST,
            "",
            0,
            bytes32(0)
        );
    }

    function testDuplicateAttestationAndRepeatRevocationAreRejected() public {
        bytes32 id = keccak256("single-use-id");
        bytes32 completion = attestations.COMPLETION();
        bytes32 authorship = attestations.AUTHORSHIP();
        _attest(reviewer, id, completion, 1, 0, bytes32(0));

        vm.prank(reviewerTwo);
        vm.expectRevert(
            abi.encodeWithSelector(AttestationRegistry.AttestationAlreadyExists.selector, id)
        );
        _callAttest(id, authorship, 1, 0, bytes32(0));

        vm.startPrank(reviewer);
        attestations.revoke(id, keccak256("reason"), "ipfs://reason");
        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.AlreadyRevoked.selector, id));
        attestations.revoke(id, keccak256("second-reason"), "ipfs://second-reason");
        vm.stopPrank();
    }

    function testProfileAndContributionRejectInvalidIdentifiersAndRepeatArchive() public {
        vm.prank(reviewer);
        vm.expectRevert(AttestiaProfileRegistry.InvalidId.selector);
        profiles.createProfile(bytes32(0), "ipfs://profile", METADATA_DIGEST);

        vm.prank(creator);
        vm.expectRevert(ContributionRegistry.InvalidDigest.selector);
        contributions.registerContribution(
            keccak256("invalid-contribution"),
            PROFILE_ID,
            bytes32(0),
            METADATA_DIGEST,
            "ipfs://invalid",
            bytes32(0)
        );

        vm.startPrank(creator);
        contributions.archiveContribution(CONTRIBUTION_ID);
        vm.expectRevert(
            abi.encodeWithSelector(ContributionRegistry.AlreadyArchived.selector, CONTRIBUTION_ID)
        );
        contributions.archiveContribution(CONTRIBUTION_ID);
        vm.stopPrank();
    }

    function testWrongSupersessionTargetIsRejected() public {
        bytes32 first = keccak256("current-claim");
        bytes32 wrong = keccak256("wrong-claim");
        bytes32 next = keccak256("next-claim");
        bytes32 completion = attestations.COMPLETION();
        _attest(reviewer, first, completion, 1, 0, bytes32(0));

        vm.prank(reviewer);
        vm.expectRevert(
            abi.encodeWithSelector(AttestationRegistry.ActiveClaimExists.selector, first)
        );
        _callAttest(next, completion, 1, 0, wrong);
    }

    function testFuzzExpiryBoundary(uint64 lifetime) public {
        lifetime = uint64(bound(lifetime, 1, type(uint32).max));
        bytes32 id = keccak256(abi.encode("expiry", lifetime));
        uint64 expiry = uint64(block.timestamp) + lifetime;
        _attest(reviewer, id, attestations.COMPLETION(), 1, expiry, bytes32(0));

        vm.warp(expiry - 1);
        assertTrue(attestations.isActive(id));
        vm.warp(expiry);
        assertFalse(attestations.isActive(id));
    }

    function testFuzzUnknownClaimTypeRejected(bytes32 claimType) public {
        vm.assume(
            claimType != attestations.COMPLETION() && claimType != attestations.AUTHORSHIP()
                && claimType != attestations.QUALITY() && claimType != attestations.USAGE()
                && claimType != attestations.PROVENANCE()
        );
        vm.prank(reviewer);
        vm.expectRevert(
            abi.encodeWithSelector(AttestationRegistry.InvalidClaimType.selector, claimType)
        );
        _callAttest(keccak256(abi.encode("unknown", claimType)), claimType, 1, 0, bytes32(0));
    }

    function testOversizedURIsRejected() public {
        string memory oversized = new string(attestations.MAX_URI_LENGTH() + 1);
        bytes32 completion = attestations.COMPLETION();
        vm.prank(reviewer);
        vm.expectRevert(AttestationRegistry.InvalidURI.selector);
        attestations.attest(
            keccak256("oversized"),
            CONTRIBUTION_ID,
            completion,
            1,
            bytes32(0),
            bytes32(0),
            0,
            bytes32(0),
            METADATA_DIGEST,
            oversized,
            bytes32(0),
            "",
            0,
            bytes32(0)
        );
    }

    function _registerContribution(
        address actor,
        bytes32 contributionId,
        bytes32 artifactDigest,
        bytes32 metadataDigest,
        bytes32 parentId
    ) internal {
        vm.prank(actor);
        contributions.registerContribution(
            contributionId,
            PROFILE_ID,
            artifactDigest,
            metadataDigest,
            "ipfs://contribution",
            parentId
        );
    }

    function _attest(
        address issuer,
        bytes32 attestationId,
        bytes32 claimType,
        int8 result,
        uint64 validUntil,
        bytes32 supersedes
    ) internal {
        vm.prank(issuer);
        _callAttest(attestationId, claimType, result, validUntil, supersedes);
    }

    function _attestQuality(address issuer, bytes32 id, int8 result, bytes32 supersedes) internal {
        vm.prank(issuer);
        attestations.attest(
            id,
            CONTRIBUTION_ID,
            attestations.QUALITY(),
            result,
            WORKSPACE_ID,
            RUBRIC_ID,
            1,
            RUBRIC_DIGEST,
            METADATA_DIGEST,
            "ipfs://claim",
            EVIDENCE_DIGEST,
            "ipfs://evidence",
            0,
            supersedes
        );
    }

    function _callAttest(
        bytes32 attestationId,
        bytes32 claimType,
        int8 result,
        uint64 validUntil,
        bytes32 supersedes
    ) internal {
        attestations.attest(
            attestationId,
            CONTRIBUTION_ID,
            claimType,
            result,
            bytes32(0),
            bytes32(0),
            0,
            bytes32(0),
            METADATA_DIGEST,
            "ipfs://claim",
            EVIDENCE_DIGEST,
            "ipfs://evidence",
            validUntil,
            supersedes
        );
    }
}
