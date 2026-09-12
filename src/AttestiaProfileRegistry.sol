// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

import { IAttestiaProfileRegistry } from "./interfaces/IAttestiaProfileRegistry.sol";
import { IERC8004IdentityRegistry } from "./interfaces/IERC8004IdentityRegistry.sol";

contract AttestiaProfileRegistry is IAttestiaProfileRegistry, Ownable, Pausable {
    uint256 public constant MAX_URI_LENGTH = 2048;

    struct Profile {
        address ownerSnapshot;
        bytes32 metadataDigest;
        string metadataURI;
        uint64 createdAt;
        uint64 updatedAt;
        uint256 agentId;
        bool isAgent;
    }

    struct AgentPolicy {
        bytes32 digest;
        string uri;
        uint64 updatedAt;
        uint32 version;
        bool paused;
    }

    error ZeroAddress();
    error InvalidId();
    error InvalidDigest();
    error InvalidURI();
    error ProfileAlreadyExists(bytes32 profileId);
    error ProfileNotFound(bytes32 profileId);
    error Unauthorized(bytes32 profileId, address actor);
    error AgentAlreadyLinked(uint256 agentId, bytes32 profileId);
    error AgentProfileRequired(bytes32 profileId);
    error HumanProfileRequired(bytes32 profileId);
    error DelegateUnchanged(bytes32 profileId, address delegate, bool allowed);
    error PolicyNotFound(uint256 agentId);
    error PolicyAlreadyPaused(uint256 agentId);
    error IdentityRegistryUnavailable(uint256 agentId);

    event ProfileCreated(
        bytes32 indexed profileId,
        address indexed owner,
        bytes32 metadataDigest,
        string metadataURI,
        uint64 createdAt
    );
    event AgentProfileCreated(
        bytes32 indexed profileId,
        uint256 indexed agentId,
        address indexed owner,
        address identityRegistry,
        bytes32 metadataDigest,
        string metadataURI,
        uint64 createdAt
    );
    event ProfileUpdated(
        bytes32 indexed profileId,
        address indexed actor,
        bytes32 metadataDigest,
        string metadataURI,
        uint64 updatedAt
    );
    event DelegateChanged(
        bytes32 indexed profileId, address indexed delegate, bool allowed, uint64 changedAt
    );
    event AgentPolicyUpdated(
        bytes32 indexed profileId,
        uint256 indexed agentId,
        uint32 version,
        bytes32 policyDigest,
        string policyURI,
        address indexed actor,
        uint64 updatedAt
    );
    event AgentPolicyPaused(
        bytes32 indexed profileId,
        uint256 indexed agentId,
        uint32 version,
        address indexed actor,
        uint64 pausedAt
    );

    IERC8004IdentityRegistry public immutable identityRegistry;

    mapping(bytes32 profileId => Profile profile) private _profiles;
    mapping(bytes32 profileId => mapping(address delegate => bool allowed)) public delegates;
    mapping(uint256 agentId => bytes32 profileId) public profileByAgent;
    mapping(uint256 agentId => AgentPolicy policy) private _agentPolicies;

    constructor(address initialOwner, address identityRegistry_) Ownable(initialOwner) {
        if (initialOwner == address(0) || identityRegistry_ == address(0)) revert ZeroAddress();
        identityRegistry = IERC8004IdentityRegistry(identityRegistry_);
    }

    function createProfile(bytes32 profileId, string calldata metadataURI, bytes32 metadataDigest)
        external
        whenNotPaused
    {
        _requireNewProfile(profileId);
        _validateMetadata(metadataURI, metadataDigest);

        uint64 now_ = _timestamp();
        _profiles[profileId] = Profile({
            ownerSnapshot: msg.sender,
            metadataDigest: metadataDigest,
            metadataURI: metadataURI,
            createdAt: now_,
            updatedAt: now_,
            agentId: 0,
            isAgent: false
        });

        emit ProfileCreated(profileId, msg.sender, metadataDigest, metadataURI, now_);
    }

    function createAgentProfile(
        bytes32 profileId,
        uint256 agentId,
        string calldata metadataURI,
        bytes32 metadataDigest
    ) external whenNotPaused {
        _requireNewProfile(profileId);
        _validateMetadata(metadataURI, metadataDigest);

        bytes32 linkedProfile = profileByAgent[agentId];
        if (linkedProfile != bytes32(0)) revert AgentAlreadyLinked(agentId, linkedProfile);

        address agentOwner = _resolveAgentOwner(agentId);
        if (agentOwner != msg.sender) revert Unauthorized(profileId, msg.sender);

        uint64 now_ = _timestamp();
        _profiles[profileId] = Profile({
            ownerSnapshot: agentOwner,
            metadataDigest: metadataDigest,
            metadataURI: metadataURI,
            createdAt: now_,
            updatedAt: now_,
            agentId: agentId,
            isAgent: true
        });
        profileByAgent[agentId] = profileId;

        emit AgentProfileCreated(
            profileId,
            agentId,
            agentOwner,
            address(identityRegistry),
            metadataDigest,
            metadataURI,
            now_
        );
    }

    function updateProfile(bytes32 profileId, string calldata metadataURI, bytes32 metadataDigest)
        external
        whenNotPaused
    {
        Profile storage record = _requireProfile(profileId);
        if (!isAuthorized(profileId, msg.sender)) revert Unauthorized(profileId, msg.sender);
        _validateMetadata(metadataURI, metadataDigest);

        uint64 now_ = _timestamp();
        record.metadataDigest = metadataDigest;
        record.metadataURI = metadataURI;
        record.updatedAt = now_;

        emit ProfileUpdated(profileId, msg.sender, metadataDigest, metadataURI, now_);
    }

    function setDelegate(bytes32 profileId, address delegate, bool allowed) external whenNotPaused {
        Profile storage record = _requireProfile(profileId);
        if (record.isAgent) revert HumanProfileRequired(profileId);
        if (record.ownerSnapshot != msg.sender) revert Unauthorized(profileId, msg.sender);
        if (delegate == address(0)) revert ZeroAddress();
        if (delegates[profileId][delegate] == allowed) {
            revert DelegateUnchanged(profileId, delegate, allowed);
        }

        delegates[profileId][delegate] = allowed;
        emit DelegateChanged(profileId, delegate, allowed, _timestamp());
    }

    function setAgentPolicy(uint256 agentId, bytes32 policyDigest, string calldata policyURI)
        external
        whenNotPaused
    {
        bytes32 profileId = profileByAgent[agentId];
        if (profileId == bytes32(0)) revert AgentProfileRequired(profileId);
        if (_resolveAgentOwner(agentId) != msg.sender) revert Unauthorized(profileId, msg.sender);
        _validateMetadata(policyURI, policyDigest);

        AgentPolicy storage policy = _agentPolicies[agentId];
        uint32 version = policy.version + 1;
        uint64 now_ = _timestamp();
        policy.digest = policyDigest;
        policy.uri = policyURI;
        policy.updatedAt = now_;
        policy.version = version;
        policy.paused = false;

        emit AgentPolicyUpdated(
            profileId, agentId, version, policyDigest, policyURI, msg.sender, now_
        );
    }

    function pausePolicy(uint256 agentId) external {
        bytes32 profileId = profileByAgent[agentId];
        if (profileId == bytes32(0)) revert AgentProfileRequired(profileId);
        if (_resolveAgentOwner(agentId) != msg.sender) revert Unauthorized(profileId, msg.sender);

        AgentPolicy storage policy = _agentPolicies[agentId];
        if (policy.version == 0) revert PolicyNotFound(agentId);
        if (policy.paused) revert PolicyAlreadyPaused(agentId);
        policy.paused = true;
        uint64 now_ = _timestamp();
        policy.updatedAt = now_;

        emit AgentPolicyPaused(profileId, agentId, policy.version, msg.sender, now_);
    }

    function profileExists(bytes32 profileId) public view returns (bool) {
        return _profiles[profileId].ownerSnapshot != address(0);
    }

    function isAuthorized(bytes32 profileId, address actor) public view returns (bool) {
        Profile storage record = _profiles[profileId];
        if (record.ownerSnapshot == address(0)) return false;
        if (record.isAgent) return _resolveAgentOwner(record.agentId) == actor;
        return record.ownerSnapshot == actor || delegates[profileId][actor];
    }

    function profile(bytes32 profileId) external view returns (Profile memory) {
        return _requireProfile(profileId);
    }

    function agentPolicy(uint256 agentId) external view returns (AgentPolicy memory) {
        return _agentPolicies[agentId];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _requireNewProfile(bytes32 profileId) private view {
        if (profileId == bytes32(0)) revert InvalidId();
        if (profileExists(profileId)) revert ProfileAlreadyExists(profileId);
    }

    function _requireProfile(bytes32 profileId) private view returns (Profile storage record) {
        record = _profiles[profileId];
        if (record.ownerSnapshot == address(0)) revert ProfileNotFound(profileId);
    }

    function _resolveAgentOwner(uint256 agentId) private view returns (address owner_) {
        try identityRegistry.ownerOf(agentId) returns (address resolvedOwner) {
            if (resolvedOwner == address(0)) revert IdentityRegistryUnavailable(agentId);
            return resolvedOwner;
        } catch {
            revert IdentityRegistryUnavailable(agentId);
        }
    }

    function _validateMetadata(string calldata uri, bytes32 digest) private pure {
        if (digest == bytes32(0)) revert InvalidDigest();
        uint256 length = bytes(uri).length;
        if (length == 0 || length > MAX_URI_LENGTH) revert InvalidURI();
    }

    function _timestamp() private view returns (uint64) {
        require(block.timestamp <= type(uint64).max);
        // Unix time cannot reach uint64 max in any practical EVM lifetime.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(block.timestamp);
    }
}
