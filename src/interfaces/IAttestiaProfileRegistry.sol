// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IAttestiaProfileRegistry {
    function profileExists(bytes32 profileId) external view returns (bool);
    function isAuthorized(bytes32 profileId, address actor) external view returns (bool);
}
