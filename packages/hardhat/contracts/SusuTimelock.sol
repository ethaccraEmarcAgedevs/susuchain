// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title SusuTimelock
 * @notice Timelock controller for DAO governance
 * @dev 2-day delay for proposal execution after approval
 */
contract SusuTimelock is TimelockController {
    /**
     * @param minDelay Minimum delay before execution (2 days = 172800 seconds)
     * @param proposers List of addresses that can propose
     * @param executors List of addresses that can execute
     * @param admin Optional account to be granted admin role (can be zero address)
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
