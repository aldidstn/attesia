// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

import { IAttestiaProfileRegistry } from "./interfaces/IAttestiaProfileRegistry.sol";
import { IContributionRegistry } from "./interfaces/IContributionRegistry.sol";

contract AttestationRegistry is Ownable, Pausable {
    uint256 public constant MAX_URI_LENGTH = 2048;

    bytes32 public constant COMPLETION = keccak256("COMPLETION");
    bytes32 public constant AUTHORSHIP = keccak256("AUTHORSHIP");
    bytes32 public constant QUALITY = keccak256("QUALITY");
    bytes32 public constant USAGE = keccak256("USAGE");
    bytes32 public constant PROVENANCE = keccak256("PROVENANCE");

    struct Attestation {
        bytes32 contributionId;
        bytes32 claimType;
        int8 result;
        address issuer;
        bytes32 workspaceId;
        bytes32 rubricId;
        uint32 rubricVersion;
        bytes32 rubricDigest;
        bytes32 metadataDigest;
        string metadataURI;
        bytes32 evidenceDigest;
        string evidenceURI;
        uint64 issuedAt;
        uint64 validUntil;
        bytes32 supersedes;
        bytes32 supersededBy;
        uint64 revokedAt;
        bytes32 revocationReasonDigest;
        string revocationReasonURI;
        bool selfAtIssuance;
    }

    error ZeroAddress();
    error InvalidId();
    error InvalidClaimType(bytes32 claimType);
    error InvalidResult(int8 result);
    error NegativeClaimsDisabled();
    error InvalidExpiry(uint64 validUntil);
    error InvalidDigest();
    error InvalidURI();
    error InvalidEvidence();
    error InvalidRubricBinding();
    error UnexpectedRubricBinding();
    error ContributionNotFound(bytes32 contributionId);
    error AttestationAlreadyExists(bytes32 attestationId);
    error AttestationNotFound(bytes32 attestationId);
    error ActiveClaimExists(bytes32 currentAttestationId);
    error InvalidSupersession(bytes32 supplied, bytes32 expected);
    error UnauthorizedRevocation(bytes32 attestationId, address actor);
    error AlreadyRevoked(bytes32 attestationId);

    event AttestationCreated(
        bytes32 indexed attestationId,
        bytes32 indexed contributionId,
        address indexed issuer,
        bytes32 claimType,
        int8 result,
        bytes32 workspaceId,
        bytes32 rubricId,
        uint32 rubricVersion,
        bytes32 rubricDigest,
        bytes32 metadataDigest,
        string metadataURI,
        bytes32 evidenceDigest,
        string evidenceURI,
        uint64 issuedAt,
        uint64 validUntil,
        bytes32 supersedes,
        bool selfAtIssuance
    );
    event AttestationSuperseded(
        bytes32 indexed oldAttestationId,
        bytes32 indexed newAttestationId,
        address indexed issuer,
        uint64 supersededAt
    );
    event AttestationRevoked(
        bytes32 indexed attestationId,
        address indexed issuer,
        uint64 revokedAt,
        bytes32 reasonDigest,
        string reasonURI
    );

    IAttestiaProfileRegistry public immutable profileRegistry;
    IContributionRegistry public immutable contributionRegistry;
    bool public immutable negativeClaimsEnabled;

    mapping(bytes32 attestationId => Attestation record) private _attestations;
    mapping(bytes32 claimKey => bytes32 attestationId) public currentAttestation;

    constructor(
        address initialOwner,
        address profileRegistry_,
        address contributionRegistry_,
        bool negativeClaimsEnabled_
    ) Ownable(initialOwner) {
        if (
            initialOwner == address(0) || profileRegistry_ == address(0)
                || contributionRegistry_ == address(0)
        ) revert ZeroAddress();
        profileRegistry = IAttestiaProfileRegistry(profileRegistry_);
        contributionRegistry = IContributionRegistry(contributionRegistry_);
        negativeClaimsEnabled = negativeClaimsEnabled_;
    }

    function attest(
        bytes32 attestationId,
        bytes32 contributionId,
        bytes32 claimType,
        int8 result,
        bytes32 workspaceId,
        bytes32 rubricId,
        uint32 rubricVersion,
        bytes32 rubricDigest,
        bytes32 metadataDigest,
        string calldata metadataURI,
        bytes32 evidenceDigest,
        string calldata evidenceURI,
        uint64 validUntil,
        bytes32 supersedes
    ) external whenNotPaused {
        _validateInput(
            attestationId,
            contributionId,
            claimType,
            result,
            workspaceId,
            rubricId,
            rubricVersion,
            rubricDigest,
            metadataDigest,
            metadataURI,
            evidenceDigest,
            evidenceURI,
            validUntil
        );
        if (_attestations[attestationId].issuedAt != 0) {
            revert AttestationAlreadyExists(attestationId);
        }
        if (!contributionRegistry.contributionExists(contributionId)) {
            revert ContributionNotFound(contributionId);
        }

        uint64 now_ = _timestamp();
        bytes32 key = claimKey(msg.sender, contributionId, claimType);
        bytes32 current = currentAttestation[key];
        if (current == bytes32(0)) {
            if (supersedes != bytes32(0)) {
                revert InvalidSupersession(supersedes, bytes32(0));
            }
        } else if (_isActive(_attestations[current], now_)) {
            if (supersedes != current) revert ActiveClaimExists(current);
            _attestations[current].supersededBy = attestationId;
            emit AttestationSuperseded(current, attestationId, msg.sender, now_);
        } else if (supersedes != bytes32(0)) {
            revert InvalidSupersession(supersedes, bytes32(0));
        }

        bytes32 creatorProfileId = contributionRegistry.creatorProfileOf(contributionId);
        bool selfAtIssuance = profileRegistry.isAuthorized(creatorProfileId, msg.sender);
        _attestations[attestationId] = Attestation({
            contributionId: contributionId,
            claimType: claimType,
            result: result,
            issuer: msg.sender,
            workspaceId: workspaceId,
            rubricId: rubricId,
            rubricVersion: rubricVersion,
            rubricDigest: rubricDigest,
            metadataDigest: metadataDigest,
            metadataURI: metadataURI,
            evidenceDigest: evidenceDigest,
            evidenceURI: evidenceURI,
            issuedAt: now_,
            validUntil: validUntil,
            supersedes: supersedes,
            supersededBy: bytes32(0),
            revokedAt: 0,
            revocationReasonDigest: bytes32(0),
            revocationReasonURI: "",
            selfAtIssuance: selfAtIssuance
        });
        currentAttestation[key] = attestationId;

        emit AttestationCreated(
            attestationId,
            contributionId,
            msg.sender,
            claimType,
            result,
            workspaceId,
            rubricId,
            rubricVersion,
            rubricDigest,
            metadataDigest,
            metadataURI,
            evidenceDigest,
            evidenceURI,
            now_,
            validUntil,
            supersedes,
            selfAtIssuance
        );
    }

    function revoke(bytes32 attestationId, bytes32 reasonDigest, string calldata reasonURI)
        external
    {
        Attestation storage record = _requireAttestation(attestationId);
        if (record.issuer != msg.sender) {
            revert UnauthorizedRevocation(attestationId, msg.sender);
        }
        if (record.revokedAt != 0) revert AlreadyRevoked(attestationId);
        if (reasonDigest == bytes32(0)) revert InvalidDigest();
        uint256 uriLength = bytes(reasonURI).length;
        if (uriLength == 0 || uriLength > MAX_URI_LENGTH) revert InvalidURI();

        uint64 now_ = _timestamp();
        record.revokedAt = now_;
        record.revocationReasonDigest = reasonDigest;
        record.revocationReasonURI = reasonURI;

        emit AttestationRevoked(attestationId, msg.sender, now_, reasonDigest, reasonURI);
    }

    function attestation(bytes32 attestationId) external view returns (Attestation memory) {
        return _requireAttestation(attestationId);
    }

    function isActive(bytes32 attestationId) external view returns (bool) {
        return _isActive(_requireAttestation(attestationId), _timestamp());
    }

    function claimKey(address issuer, bytes32 contributionId, bytes32 claimType)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(issuer, contributionId, claimType));
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _validateInput(
        bytes32 attestationId,
        bytes32 contributionId,
        bytes32 claimType,
        int8 result,
        bytes32 workspaceId,
        bytes32 rubricId,
        uint32 rubricVersion,
        bytes32 rubricDigest,
        bytes32 metadataDigest,
        string calldata metadataURI,
        bytes32 evidenceDigest,
        string calldata evidenceURI,
        uint64 validUntil
    ) private view {
        if (attestationId == bytes32(0) || contributionId == bytes32(0)) {
            revert InvalidId();
        }
        if (!_knownClaimType(claimType)) revert InvalidClaimType(claimType);
        if (result != -1 && result != 1) revert InvalidResult(result);
        if (result == -1 && !negativeClaimsEnabled) revert NegativeClaimsDisabled();
        if (validUntil != 0 && validUntil <= block.timestamp) revert InvalidExpiry(validUntil);
        if (metadataDigest == bytes32(0)) revert InvalidDigest();
        uint256 metadataLength = bytes(metadataURI).length;
        if (metadataLength == 0 || metadataLength > MAX_URI_LENGTH) revert InvalidURI();

        uint256 evidenceLength = bytes(evidenceURI).length;
        bool hasEvidenceDigest = evidenceDigest != bytes32(0);
        bool hasEvidenceURI = evidenceLength != 0;
        if (hasEvidenceDigest != hasEvidenceURI || evidenceLength > MAX_URI_LENGTH) {
            revert InvalidEvidence();
        }
        if (result == -1 && !hasEvidenceDigest) revert InvalidEvidence();

        bool hasAnyRubric = workspaceId != bytes32(0) || rubricId != bytes32(0)
            || rubricVersion != 0 || rubricDigest != bytes32(0);
        bool hasFullRubric = workspaceId != bytes32(0) && rubricId != bytes32(0)
            && rubricVersion != 0 && rubricDigest != bytes32(0);
        if (claimType == QUALITY && !hasFullRubric) revert InvalidRubricBinding();
        if (claimType != QUALITY && hasAnyRubric) revert UnexpectedRubricBinding();
    }

    function _knownClaimType(bytes32 claimType) private pure returns (bool) {
        return claimType == COMPLETION || claimType == AUTHORSHIP || claimType == QUALITY
            || claimType == USAGE || claimType == PROVENANCE;
    }

    function _requireAttestation(bytes32 attestationId)
        private
        view
        returns (Attestation storage record)
    {
        record = _attestations[attestationId];
        if (record.issuedAt == 0) revert AttestationNotFound(attestationId);
    }

    function _isActive(Attestation storage record, uint64 at) private view returns (bool) {
        return record.revokedAt == 0 && record.supersededBy == bytes32(0)
            && (record.validUntil == 0 || at < record.validUntil);
    }

    function _timestamp() private view returns (uint64) {
        require(block.timestamp <= type(uint64).max);
        // Unix time cannot reach uint64 max in any practical EVM lifetime.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(block.timestamp);
    }
}
