// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IContributionRegistry {
    function contributionExists(bytes32 contributionId) external view returns (bool);
    function creatorProfileOf(bytes32 contributionId) external view returns (bytes32);
}
