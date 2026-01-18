// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SusuFactory.sol";
import "./SusuGroup.sol";

/**
 * @title SusuFactoryViews
 * @notice Separate contract for complex view functions to reduce main factory size
 */
contract SusuFactoryViews {
    SusuFactory public factory;

    constructor(address _factory) {
        factory = SusuFactory(_factory);
    }

    function getAllGroupsWithDetails()
        external
        view
        returns (
            address[] memory groupAddresses,
            string[] memory groupNames,
            string[] memory ensNames,
            address[] memory creators,
            uint256[] memory contributionAmounts,
            uint256[] memory maxMembers,
            uint256[] memory currentMembers,
            uint256[] memory contributionIntervals,
            bool[] memory isActiveStates
        )
    {
        address[] memory allGroups = factory.getAllGroups();
        uint256 length = allGroups.length;

        groupAddresses = new address[](length);
        groupNames = new string[](length);
        ensNames = new string[](length);
        creators = new address[](length);
        contributionAmounts = new uint256[](length);
        maxMembers = new uint256[](length);
        currentMembers = new uint256[](length);
        contributionIntervals = new uint256[](length);
        isActiveStates = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            address groupAddr = allGroups[i];
            (
                string memory groupName,
                string memory ensName,
                address creator,
                uint256 contributionAmount,
                uint256 maxMember,
                ,
                bool isActive
            ) = factory.getGroupDetails(groupAddr);

            SusuGroup group = SusuGroup(groupAddr);

            groupAddresses[i] = groupAddr;
            groupNames[i] = groupName;
            ensNames[i] = ensName;
            creators[i] = creator;
            contributionAmounts[i] = contributionAmount;
            maxMembers[i] = maxMember;
            currentMembers[i] = group.getMemberCount();
            contributionIntervals[i] = group.contributionInterval();
            isActiveStates[i] = isActive;
        }
    }

    function getGroupsByFilter(
        uint256 _minContribution,
        uint256 _maxContribution,
        uint256 _minMembers,
        uint256 _maxMembers,
        bool _onlyActive
    ) external view returns (address[] memory) {
        address[] memory allGroups = factory.getAllGroups();
        uint256 count = 0;

        // First pass: count matching groups
        for (uint256 i = 0; i < allGroups.length; i++) {
            (
                ,
                ,
                ,
                uint256 contributionAmount,
                uint256 maxMember,
                ,
                bool isActive
            ) = factory.getGroupDetails(allGroups[i]);

            if (
                (_onlyActive && !isActive) ||
                (contributionAmount < _minContribution) ||
                (contributionAmount > _maxContribution) ||
                (maxMember < _minMembers) ||
                (maxMember > _maxMembers)
            ) {
                continue;
            }
            count++;
        }

        // Second pass: populate the array
        address[] memory filteredGroups = new address[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < allGroups.length; i++) {
            (
                ,
                ,
                ,
                uint256 contributionAmount,
                uint256 maxMember,
                ,
                bool isActive
            ) = factory.getGroupDetails(allGroups[i]);

            if (
                (_onlyActive && !isActive) ||
                (contributionAmount < _minContribution) ||
                (contributionAmount > _maxContribution) ||
                (maxMember < _minMembers) ||
                (maxMember > _maxMembers)
            ) {
                continue;
            }

            filteredGroups[index] = allGroups[i];
            index++;
        }

        return filteredGroups;
    }

    function getActiveGroups() external view returns (address[] memory) {
        address[] memory allGroups = factory.getAllGroups();
        uint256 activeCount = 0;

        // Count active groups
        for (uint256 i = 0; i < allGroups.length; i++) {
            (, , , , , , bool isActive) = factory.getGroupDetails(allGroups[i]);
            if (isActive) {
                activeCount++;
            }
        }

        // Populate active groups array
        address[] memory activeGroupsList = new address[](activeCount);
        uint256 activeIndex = 0;

        for (uint256 i = 0; i < allGroups.length; i++) {
            (, , , , , , bool isActive) = factory.getGroupDetails(allGroups[i]);
            if (isActive) {
                activeGroupsList[activeIndex] = allGroups[i];
                activeIndex++;
            }
        }

        return activeGroupsList;
    }

    function getRecentGroups(uint256 _count) external view returns (address[] memory) {
        address[] memory allGroups = factory.getAllGroups();
        uint256 count = _count > allGroups.length ? allGroups.length : _count;
        address[] memory recentGroups = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            recentGroups[i] = allGroups[allGroups.length - 1 - i];
        }

        return recentGroups;
    }

    function getPopularGroups(uint256 _count) external view returns (address[] memory) {
        address[] memory allGroups = factory.getAllGroups();
        uint256 count = _count > allGroups.length ? allGroups.length : _count;
        address[] memory popularGroups = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            popularGroups[i] = allGroups[allGroups.length - 1 - i];
        }

        return popularGroups;
    }
}
