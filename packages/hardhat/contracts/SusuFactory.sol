// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SusuGroup.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SusuFactory is Ownable {
    struct GroupInfo {
        address groupAddress;
        string groupName;
        string ensName;
        address creator;
        uint256 contributionAmount;
        uint256 maxMembers;
        uint256 createdAt;
        bool isActive;
    }

    // State variables
    address[] public allGroups;
    mapping(address => GroupInfo) public groupInfo;
    mapping(address => address[]) public creatorGroups;
    mapping(string => bool) public ensNameTaken;

    // Statistics
    uint256 public totalGroupsCreated;
    uint256 public activeGroups;

    // Events
    event GroupCreated(
        address indexed groupAddress,
        string groupName,
        string ensName,
        address indexed creator,
        uint256 contributionAmount,
        uint256 maxMembers
    );

    event GroupStatusChanged(address indexed groupAddress, bool isActive);

    constructor(address _owner) Ownable(_owner) {
        totalGroupsCreated = 0;
        activeGroups = 0;
    }

    function createSusuGroup(
        string memory _groupName,
        string memory _ensName,
        uint256 _contributionAmount,
        uint256 _contributionInterval,
        uint256 _maxMembers,
        address _contributionAsset,
        SusuGroup.CollateralTier _collateralTier,
        address _aavePool
    ) external returns (address) {
        require(bytes(_groupName).length > 0, "Group name cannot be empty");
        require(bytes(_ensName).length > 0, "ENS name cannot be empty");
        require(!ensNameTaken[_ensName], "ENS name already taken");
        require(_contributionAmount > 0, "Contribution amount must be greater than 0");
        require(_maxMembers >= 2 && _maxMembers <= 20, "Max members must be between 2 and 20");
        require(_contributionInterval >= 1 days, "Contribution interval must be at least 1 day");

        // Deploy new SusuGroup contract
        SusuGroup newGroup = new SusuGroup(
            _groupName,
            _ensName,
            _contributionAmount,
            _contributionInterval,
            _maxMembers,
            msg.sender,
            _contributionAsset,
            _collateralTier,
            _aavePool
        );

        address groupAddress = address(newGroup);

        // Store group information
        groupInfo[groupAddress] = GroupInfo({
            groupAddress: groupAddress,
            groupName: _groupName,
            ensName: _ensName,
            creator: msg.sender,
            contributionAmount: _contributionAmount,
            maxMembers: _maxMembers,
            createdAt: block.timestamp,
            isActive: true
        });

        // Update state
        allGroups.push(groupAddress);
        creatorGroups[msg.sender].push(groupAddress);
        ensNameTaken[_ensName] = true;
        totalGroupsCreated++;
        activeGroups++;

        emit GroupCreated(groupAddress, _groupName, _ensName, msg.sender, _contributionAmount, _maxMembers);

        return groupAddress;
    }

    function getAllGroups() external view returns (address[] memory) {
        return allGroups;
    }

    function getTotalGroups() external view returns (uint256) {
        return totalGroupsCreated;
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
            GroupInfo memory info = groupInfo[groupAddr];
            SusuGroup group = SusuGroup(groupAddr);

            groupAddresses[i] = groupAddr;
            groupNames[i] = info.groupName;
            ensNames[i] = info.ensName;
            creators[i] = info.creator;
            contributionAmounts[i] = info.contributionAmount;
            maxMembers[i] = info.maxMembers;
            currentMembers[i] = group.getMemberCount();
            contributionIntervals[i] = group.contributionInterval();
            isActiveStates[i] = group.groupActive();
        }
    }

    function getGroupsByCreator(address _creator) external view returns (address[] memory) {
        return creatorGroups[_creator];
    }

    function getActiveGroups() external view returns (address[] memory) {
        address[] memory activeGroupsList = new address[](activeGroups);
        uint256 activeIndex = 0;

        for (uint256 i = 0; i < allGroups.length; i++) {
            if (groupInfo[allGroups[i]].isActive) {
                activeGroupsList[activeIndex] = allGroups[i];
                activeIndex++;
            }
        }

        return activeGroupsList;
    }

    function getGroupDetails(
        address _groupAddress
    )
        external
        view
        returns (
            string memory groupName,
            string memory ensName,
            address creator,
            uint256 contributionAmount,
            uint256 maxMembers,
            uint256 createdAt,
            bool isActive
        )
    {
        require(_groupAddress != address(0), "Invalid group address");
        GroupInfo memory info = groupInfo[_groupAddress];
        require(info.groupAddress != address(0), "Group not found");

        return (
            info.groupName,
            info.ensName,
            info.creator,
            info.contributionAmount,
            info.maxMembers,
            info.createdAt,
            info.isActive
        );
    }

    function getGroupsByFilter(
        uint256 _minContribution,
        uint256 _maxContribution,
        uint256 _minMembers,
        uint256 _maxMembers,
        bool _onlyActive
    ) external view returns (address[] memory) {
        uint256 count = 0;

        // First pass: count matching groups
        for (uint256 i = 0; i < allGroups.length; i++) {
            GroupInfo memory info = groupInfo[allGroups[i]];

            if (
                (_onlyActive && !info.isActive) ||
                (info.contributionAmount < _minContribution) ||
                (info.contributionAmount > _maxContribution) ||
                (info.maxMembers < _minMembers) ||
                (info.maxMembers > _maxMembers)
            ) {
                continue;
            }
            count++;
        }

        // Second pass: populate the array
        address[] memory filteredGroups = new address[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < allGroups.length; i++) {
            GroupInfo memory info = groupInfo[allGroups[i]];

            if (
                (_onlyActive && !info.isActive) ||
                (info.contributionAmount < _minContribution) ||
                (info.contributionAmount > _maxContribution) ||
                (info.maxMembers < _minMembers) ||
                (info.maxMembers > _maxMembers)
            ) {
                continue;
            }

            filteredGroups[index] = allGroups[i];
            index++;
        }

        return filteredGroups;
    }

    function isENSNameAvailable(string memory _ensName) external view returns (bool) {
        return !ensNameTaken[_ensName];
    }

    function getTotalStats() external view returns (uint256 total, uint256 active, uint256 completed) {
        return (totalGroupsCreated, activeGroups, totalGroupsCreated - activeGroups);
    }

    function updateGroupStatus(address _groupAddress) external {
        require(msg.sender == _groupAddress, "Only group contract can update status");
        GroupInfo storage info = groupInfo[_groupAddress];
        require(info.groupAddress != address(0), "Group not found");

        SusuGroup group = SusuGroup(_groupAddress);
        bool isActive = group.groupActive();

        if (info.isActive && !isActive) {
            activeGroups--;
            info.isActive = false;
            emit GroupStatusChanged(_groupAddress, false);
        }
    }

    // Admin functions
    function emergencyDeactivateGroup(address _groupAddress) external onlyOwner {
        GroupInfo storage info = groupInfo[_groupAddress];
        require(info.groupAddress != address(0), "Group not found");
        require(info.isActive, "Group already inactive");

        info.isActive = false;
        activeGroups--;

        emit GroupStatusChanged(_groupAddress, false);
    }

    function getRecentGroups(uint256 _count) external view returns (address[] memory) {
        uint256 count = _count > allGroups.length ? allGroups.length : _count;
        address[] memory recentGroups = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            recentGroups[i] = allGroups[allGroups.length - 1 - i];
        }

        return recentGroups;
    }

    function getPopularGroups(uint256 _count) external view returns (address[] memory) {
        // For now, return most recent groups
        // In future versions, this could be based on member count or activity
        uint256 count = _count > allGroups.length ? allGroups.length : _count;
        address[] memory popularGroups = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            popularGroups[i] = allGroups[allGroups.length - 1 - i];
        }

        return popularGroups;
    }
}
