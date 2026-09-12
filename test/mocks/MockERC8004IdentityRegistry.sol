// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IERC8004IdentityRegistry } from "../../src/interfaces/IERC8004IdentityRegistry.sol";

contract MockERC8004IdentityRegistry is IERC8004IdentityRegistry {
    mapping(uint256 agentId => address owner) private _owners;
    bool public unavailable;

    function setOwner(uint256 agentId, address owner) external {
        _owners[agentId] = owner;
    }

    function setUnavailable(bool value) external {
        unavailable = value;
    }

    function ownerOf(uint256 agentId) external view returns (address) {
        if (unavailable || _owners[agentId] == address(0)) revert("identity unavailable");
        return _owners[agentId];
    }
}
