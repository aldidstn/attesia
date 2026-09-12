// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

import { IAttestiaProfileRegistry } from "./interfaces/IAttestiaProfileRegistry.sol";
import { IContributionRegistry } from "./interfaces/IContributionRegistry.sol";

contract ContributionRegistry is IContributionRegistry, Ownable, Pausable {
    uint256 public constant MAX_URI_LENGTH = 2048;

    struct Contribution {
        bytes32 creatorProfileId;
        bytes32 artifactDigest;
        bytes32 metadataDigest;
        string metadataURI;
        bytes32 parentId;
        address registeredBy;
        uint64 createdAt;
        uint64 archivedAt;
    }

    error ZeroAddress();
    error InvalidId();
    error InvalidDigest();
    error InvalidURI();
    error ProfileNotFound(bytes32 profileId);
    error ContributionAlreadyExists(bytes32 contributionId);
    error ContributionNotFound(bytes32 contributionId);
    error Unauthorized(bytes32 profileId, address actor);
    error ParentCreatorMismatch(bytes32 parentId, bytes32 creatorProfileId);
    error MetadataUnchanged(bytes32 parentId);
    error DuplicateArtifact(bytes32 existingContributionId);
    error DuplicateRecord(bytes32 existingContributionId);
    error AlreadyArchived(bytes32 contributionId);

    event ContributionRegistered(
        bytes32 indexed contributionId,
        bytes32 indexed creatorProfileId,
        bytes32 artifactDigest,
        bytes32 metadataDigest,
        string metadataURI,
        bytes32 indexed parentId,
        address registeredBy,
        uint64 createdAt
    );
    event ContributionArchived(
        bytes32 indexed contributionId,
        bytes32 indexed creatorProfileId,
        address indexed actor,
        uint64 archivedAt
    );

    IAttestiaProfileRegistry public immutable profileRegistry;

    mapping(bytes32 contributionId => Contribution contribution) private _contributions;
    mapping(
        bytes32 creatorProfileId => mapping(bytes32 artifactDigest => bytes32 contributionId)
    ) public firstContributionByArtifact;
    mapping(bytes32 recordKey => bytes32 contributionId) public contributionByRecordKey;

    constructor(address initialOwner, address profileRegistry_) Ownable(initialOwner) {
        if (initialOwner == address(0) || profileRegistry_ == address(0)) revert ZeroAddress();
        profileRegistry = IAttestiaProfileRegistry(profileRegistry_);
    }

    function registerContribution(
        bytes32 contributionId,
        bytes32 creatorProfileId,
        bytes32 artifactDigest,
        bytes32 metadataDigest,
        string calldata metadataURI,
        bytes32 parentId
    ) external whenNotPaused {
        if (contributionId == bytes32(0) || creatorProfileId == bytes32(0)) {
            revert InvalidId();
        }
        if (artifactDigest == bytes32(0) || metadataDigest == bytes32(0)) revert InvalidDigest();
        uint256 uriLength = bytes(metadataURI).length;
        if (uriLength == 0 || uriLength > MAX_URI_LENGTH) revert InvalidURI();
        if (contributionExists(contributionId)) {
            revert ContributionAlreadyExists(contributionId);
        }
        if (!profileRegistry.profileExists(creatorProfileId)) {
            revert ProfileNotFound(creatorProfileId);
        }
        if (!profileRegistry.isAuthorized(creatorProfileId, msg.sender)) {
            revert Unauthorized(creatorProfileId, msg.sender);
        }

        bytes32 recordKey = keccak256(abi.encode(creatorProfileId, artifactDigest, metadataDigest));
        bytes32 duplicate = contributionByRecordKey[recordKey];
        if (duplicate != bytes32(0)) revert DuplicateRecord(duplicate);

        bytes32 existingArtifact = firstContributionByArtifact[creatorProfileId][artifactDigest];
        if (parentId == bytes32(0)) {
            if (existingArtifact != bytes32(0)) revert DuplicateArtifact(existingArtifact);
        } else {
            Contribution storage parent = _requireContribution(parentId);
            if (parent.creatorProfileId != creatorProfileId) {
                revert ParentCreatorMismatch(parentId, creatorProfileId);
            }
            if (parent.metadataDigest == metadataDigest) revert MetadataUnchanged(parentId);
            if (existingArtifact != bytes32(0) && parent.artifactDigest != artifactDigest) {
                revert DuplicateArtifact(existingArtifact);
            }
        }

        uint64 now_ = _timestamp();
        _contributions[contributionId] = Contribution({
            creatorProfileId: creatorProfileId,
            artifactDigest: artifactDigest,
            metadataDigest: metadataDigest,
            metadataURI: metadataURI,
            parentId: parentId,
            registeredBy: msg.sender,
            createdAt: now_,
            archivedAt: 0
        });
        contributionByRecordKey[recordKey] = contributionId;
        if (existingArtifact == bytes32(0)) {
            firstContributionByArtifact[creatorProfileId][artifactDigest] = contributionId;
        }

        emit ContributionRegistered(
            contributionId,
            creatorProfileId,
            artifactDigest,
            metadataDigest,
            metadataURI,
            parentId,
            msg.sender,
            now_
        );
    }

    function archiveContribution(bytes32 contributionId) external whenNotPaused {
        Contribution storage record = _requireContribution(contributionId);
        if (!profileRegistry.isAuthorized(record.creatorProfileId, msg.sender)) {
            revert Unauthorized(record.creatorProfileId, msg.sender);
        }
        if (record.archivedAt != 0) revert AlreadyArchived(contributionId);

        uint64 now_ = _timestamp();
        record.archivedAt = now_;
        emit ContributionArchived(contributionId, record.creatorProfileId, msg.sender, now_);
    }

    function contributionExists(bytes32 contributionId) public view returns (bool) {
        return _contributions[contributionId].createdAt != 0;
    }

    function creatorProfileOf(bytes32 contributionId) external view returns (bytes32) {
        return _requireContribution(contributionId).creatorProfileId;
    }

    function contribution(bytes32 contributionId) external view returns (Contribution memory) {
        return _requireContribution(contributionId);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _requireContribution(bytes32 contributionId)
        private
        view
        returns (Contribution storage record)
    {
        record = _contributions[contributionId];
        if (record.createdAt == 0) revert ContributionNotFound(contributionId);
    }

    function _timestamp() private view returns (uint64) {
        require(block.timestamp <= type(uint64).max);
        // Unix time cannot reach uint64 max in any practical EVM lifetime.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(block.timestamp);
    }
}
