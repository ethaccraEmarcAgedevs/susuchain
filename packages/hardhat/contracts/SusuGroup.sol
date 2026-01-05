// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SusuGroup is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    struct Member {
        address memberAddress;
        string ensName;
        string efpProfile;
        bool isActive;
        uint256 contributionCount;
        uint256 lastContribution;
        bool hasReceivedPayout;
    }

    struct ContributionRound {
        uint256 roundNumber;
        address beneficiary;
        uint256 totalAmount;
        uint256 timestamp;
        bool completed;
        mapping(address => bool) hasContributed;
    }

    // Group information
    string public groupName;
    string public groupENSName;
    uint256 public contributionAmount;
    uint256 public contributionInterval; // in seconds
    uint256 public maxMembers;
    uint256 public currentRound;
    bool public groupActive;

    // Asset management (address(0) = ETH, otherwise ERC20 token address)
    address public contributionAsset;
    bool public isStablecoin;

    // Member management
    address[] public memberAddresses;
    mapping(address => Member) public members;
    mapping(address => bool) public isMember;

    // Round management
    mapping(uint256 => ContributionRound) public rounds;
    uint256 public nextRoundStartTime;
    uint256 public groupStartTime;

    // Queue for payout order
    address[] public payoutQueue;
    uint256 public nextBeneficiaryIndex;

    // Gelato automation
    uint256 public roundDeadline;
    uint256 public constant LATE_PENALTY_RATE = 5; // 5% penalty
    uint256 public constant AUTOMATION_FEE = 10; // 0.1% (10 basis points)
    mapping(address => uint256) public latePenalties;
    address public gelatoExecutor;

    // Events
    event MemberJoined(address indexed member, string ensName, string efpProfile);
    event ContributionMade(address indexed member, uint256 round, uint256 amount);
    event PayoutDistributed(address indexed beneficiary, uint256 round, uint256 amount);
    event NewRoundStarted(uint256 round, address beneficiary);
    event GroupCompleted();
    event AutomatedPayoutExecuted(uint256 round, address beneficiary, uint256 amount);
    event LatePenaltyApplied(address indexed member, uint256 amount);
    event DeadlineUpdated(uint256 newDeadline);

    modifier onlyMember() {
        require(isMember[msg.sender], "Not a member of this group");
        _;
    }

    modifier groupIsActive() {
        require(groupActive, "Group is not active");
        _;
    }

    modifier onlyGelatoOrOwner() {
        require(
            msg.sender == gelatoExecutor || msg.sender == owner(),
            "Only Gelato executor or owner"
        );
        _;
    }

    constructor(
        string memory _groupName,
        string memory _groupENSName,
        uint256 _contributionAmount,
        uint256 _contributionInterval,
        uint256 _maxMembers,
        address _creator,
        address _contributionAsset
    ) Ownable(_creator) {
        require(_maxMembers > 1, "Group must have at least 2 members");
        require(_contributionAmount > 0, "Contribution amount must be greater than 0");
        require(_contributionInterval > 0, "Contribution interval must be greater than 0");

        groupName = _groupName;
        groupENSName = _groupENSName;
        contributionAmount = _contributionAmount;
        contributionInterval = _contributionInterval;
        maxMembers = _maxMembers;
        currentRound = 0;
        groupActive = true;
        nextBeneficiaryIndex = 0;
        contributionAsset = _contributionAsset;

        // Check if asset is a known stablecoin
        isStablecoin = _isKnownStablecoin(_contributionAsset);

        // Creator automatically joins as first member
        _addMember(_creator, "", "");
    }

    function _isKnownStablecoin(address _asset) internal pure returns (bool) {
        // Base USDC
        if (_asset == 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) return true;
        // Add other stablecoins as needed
        return false;
    }

    function joinGroup(string memory _ensName, string memory _efpProfile) external {
        require(memberAddresses.length < maxMembers, "Group is full");
        require(!isMember[msg.sender], "Already a member");
        require(groupActive, "Group is not active");

        _addMember(msg.sender, _ensName, _efpProfile);

        // Start the group if we have reached max members
        if (memberAddresses.length == maxMembers && groupStartTime == 0) {
            _startGroup();
        }

        emit MemberJoined(msg.sender, _ensName, _efpProfile);
    }

    function _addMember(address _member, string memory _ensName, string memory _efpProfile) internal {
        members[_member] = Member({
            memberAddress: _member,
            ensName: _ensName,
            efpProfile: _efpProfile,
            isActive: true,
            contributionCount: 0,
            lastContribution: 0,
            hasReceivedPayout: false
        });

        memberAddresses.push(_member);
        isMember[_member] = true;
        payoutQueue.push(_member);
    }

    function _startGroup() internal {
        groupStartTime = block.timestamp;
        nextRoundStartTime = block.timestamp;
        _startNewRound();
    }

    function _startNewRound() internal {
        require(nextBeneficiaryIndex < payoutQueue.length, "All members have received payouts");

        currentRound++;
        address beneficiary = payoutQueue[nextBeneficiaryIndex];

        // Initialize the new round
        ContributionRound storage round = rounds[currentRound];
        round.roundNumber = currentRound;
        round.beneficiary = beneficiary;
        round.totalAmount = 0;
        round.timestamp = block.timestamp;
        round.completed = false;

        nextRoundStartTime = block.timestamp + contributionInterval;
        roundDeadline = block.timestamp + contributionInterval;

        emit NewRoundStarted(currentRound, beneficiary);
        emit DeadlineUpdated(roundDeadline);
    }

    function contributeToRound() external payable onlyMember groupIsActive nonReentrant {
        require(currentRound > 0, "Group has not started yet");
        require(!rounds[currentRound].hasContributed[msg.sender], "Already contributed to this round");
        require(!rounds[currentRound].completed, "Round already completed");

        ContributionRound storage round = rounds[currentRound];

        // Handle ETH or ERC20 contribution
        if (contributionAsset == address(0)) {
            // ETH contribution
            require(msg.value == contributionAmount, "Incorrect ETH contribution amount");
            round.totalAmount += msg.value;
        } else {
            // ERC20 token contribution
            require(msg.value == 0, "Do not send ETH for token contributions");
            IERC20(contributionAsset).safeTransferFrom(msg.sender, address(this), contributionAmount);
            round.totalAmount += contributionAmount;
        }

        round.hasContributed[msg.sender] = true;
        members[msg.sender].contributionCount++;
        members[msg.sender].lastContribution = block.timestamp;

        emit ContributionMade(msg.sender, currentRound, contributionAmount);

        // Check if all members have contributed
        if (_allMembersContributed(currentRound)) {
            _completePayout();
        }
    }

    function _allMembersContributed(uint256 roundNumber) internal view returns (bool) {
        ContributionRound storage round = rounds[roundNumber];
        for (uint256 i = 0; i < memberAddresses.length; i++) {
            if (!round.hasContributed[memberAddresses[i]]) {
                return false;
            }
        }
        return true;
    }

    function _completePayout() internal {
        ContributionRound storage round = rounds[currentRound];
        round.completed = true;

        address beneficiary = round.beneficiary;
        uint256 payoutAmount = round.totalAmount;

        members[beneficiary].hasReceivedPayout = true;
        nextBeneficiaryIndex++;

        // Transfer payout to beneficiary
        if (contributionAsset == address(0)) {
            // ETH payout
            (bool success, ) = payable(beneficiary).call{ value: payoutAmount }("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 token payout
            IERC20(contributionAsset).safeTransfer(beneficiary, payoutAmount);
        }

        emit PayoutDistributed(beneficiary, currentRound, payoutAmount);

        // Start next round or complete group
        if (nextBeneficiaryIndex >= payoutQueue.length) {
            groupActive = false;
            emit GroupCompleted();
        } else {
            _startNewRound();
        }
    }

    function forceNextRound() external onlyOwner {
        require(block.timestamp >= nextRoundStartTime, "Round interval not reached");
        require(!rounds[currentRound].completed, "Current round already completed");

        _completePayout();
    }

    function getMemberCount() external view returns (uint256) {
        return memberAddresses.length;
    }

    function getGroupInfo()
        external
        view
        returns (
            string memory name,
            string memory ensName,
            uint256 contribution,
            uint256 interval,
            uint256 maxMems,
            uint256 currentMems,
            uint256 round,
            bool active,
            address currentBeneficiary
        )
    {
        address beneficiary = currentRound > 0 ? rounds[currentRound].beneficiary : address(0);

        return (
            groupName,
            groupENSName,
            contributionAmount,
            contributionInterval,
            maxMembers,
            memberAddresses.length,
            currentRound,
            groupActive,
            beneficiary
        );
    }

    function getMemberInfo(
        address _member
    )
        external
        view
        returns (
            string memory ensName,
            string memory efpProfile,
            bool isActive,
            uint256 contributionCount,
            uint256 lastContribution,
            bool hasReceivedPayout
        )
    {
        require(isMember[_member], "Not a member");
        Member memory member = members[_member];

        return (
            member.ensName,
            member.efpProfile,
            member.isActive,
            member.contributionCount,
            member.lastContribution,
            member.hasReceivedPayout
        );
    }

    function getRoundInfo(
        uint256 roundNumber
    ) external view returns (address beneficiary, uint256 totalAmount, uint256 timestamp, bool completed) {
        require(roundNumber > 0 && roundNumber <= currentRound, "Invalid round number");
        ContributionRound storage round = rounds[roundNumber];

        return (round.beneficiary, round.totalAmount, round.timestamp, round.completed);
    }

    function hasContributedToRound(address _member, uint256 roundNumber) external view returns (bool) {
        require(roundNumber > 0 && roundNumber <= currentRound, "Invalid round number");
        return rounds[roundNumber].hasContributed[_member];
    }

    function getAllMembers() external view returns (address[] memory) {
        return memberAddresses;
    }

    function getPayoutQueue() external view returns (address[] memory) {
        return payoutQueue;
    }

    function emergencyWithdraw() external onlyOwner {
        require(!groupActive, "Group is still active");
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner()).call{ value: balance }("");
            require(success, "Emergency withdraw failed");
        }
    }

    // ===== GELATO AUTOMATION FUNCTIONS =====

    /**
     * @notice Set Gelato executor address (called once during setup)
     */
    function setGelatoExecutor(address _executor) external onlyOwner {
        require(_executor != address(0), "Invalid executor address");
        gelatoExecutor = _executor;
    }

    /**
     * @notice Gelato checker function - determines if payout can be executed
     * @return canExec Whether payout should be executed
     * @return execPayload The function call to execute
     */
    function canExecutePayout() external view returns (bool canExec, bytes memory execPayload) {
        // Check conditions for automated payout
        if (!groupActive) {
            return (false, bytes("Group not active"));
        }

        if (currentRound == 0) {
            return (false, bytes("No active round"));
        }

        if (rounds[currentRound].completed) {
            return (false, bytes("Round already completed"));
        }

        // Check if deadline has passed
        bool deadlinePassed = block.timestamp >= roundDeadline;
        bool allContributed = _allMembersContributed(currentRound);

        // Execute if all contributed OR deadline passed
        if (allContributed || deadlinePassed) {
            execPayload = abi.encodeWithSelector(
                this.executeScheduledPayout.selector
            );
            return (true, execPayload);
        }

        return (false, bytes("Waiting for contributions or deadline"));
    }

    /**
     * @notice Execute automated payout (called by Gelato or owner)
     * @dev Applies penalties for late/missing contributions
     */
    function executeScheduledPayout() external onlyGelatoOrOwner nonReentrant {
        require(groupActive, "Group not active");
        require(currentRound > 0, "No active round");
        require(!rounds[currentRound].completed, "Round already completed");

        ContributionRound storage round = rounds[currentRound];
        bool deadlinePassed = block.timestamp >= roundDeadline;

        // Calculate penalties for late/missing contributions
        uint256 totalPenalty = 0;
        uint256 contributingMembers = 0;

        for (uint256 i = 0; i < memberAddresses.length; i++) {
            address member = memberAddresses[i];

            if (round.hasContributed[member]) {
                contributingMembers++;
                // Check if contribution was late
                if (members[member].lastContribution > roundDeadline) {
                    uint256 penalty = (contributionAmount * LATE_PENALTY_RATE) / 100;
                    latePenalties[member] += penalty;
                    totalPenalty += penalty;
                    emit LatePenaltyApplied(member, penalty);
                }
            } else if (deadlinePassed) {
                // Member missed contribution entirely
                uint256 penalty = (contributionAmount * LATE_PENALTY_RATE * 2) / 100; // Double penalty
                latePenalties[member] += penalty;
                totalPenalty += penalty;
                emit LatePenaltyApplied(member, penalty);
            }
        }

        // Calculate automation fee (0.1% of total)
        uint256 automationFee = (round.totalAmount * AUTOMATION_FEE) / 10000;

        // Calculate final payout amount
        uint256 payoutAmount = round.totalAmount - automationFee;

        // If some members didn't contribute, redistribute their portion to beneficiary
        if (contributingMembers < memberAddresses.length && deadlinePassed) {
            // Payout proceeds with reduced amount (only from contributors)
            payoutAmount = round.totalAmount - automationFee;
        }

        // Mark round as completed
        round.completed = true;
        address beneficiary = round.beneficiary;
        members[beneficiary].hasReceivedPayout = true;
        nextBeneficiaryIndex++;

        // Transfer payout to beneficiary
        if (contributionAsset == address(0)) {
            // ETH payout
            (bool success, ) = payable(beneficiary).call{ value: payoutAmount }("");
            require(success, "ETH transfer failed");
            // Send automation fee to owner for Gelato sponsorship
            if (automationFee > 0) {
                (bool feeSuccess, ) = payable(owner()).call{ value: automationFee }("");
                require(feeSuccess, "Fee transfer failed");
            }
        } else {
            // ERC20 token payout
            IERC20(contributionAsset).safeTransfer(beneficiary, payoutAmount);
            if (automationFee > 0) {
                IERC20(contributionAsset).safeTransfer(owner(), automationFee);
            }
        }

        emit AutomatedPayoutExecuted(currentRound, beneficiary, payoutAmount);
        emit PayoutDistributed(beneficiary, currentRound, payoutAmount);

        // Start next round or complete group
        if (nextBeneficiaryIndex >= payoutQueue.length) {
            groupActive = false;
            emit GroupCompleted();
        } else {
            _startNewRound();
        }
    }

    /**
     * @notice Get time remaining until deadline
     */
    function getTimeUntilDeadline() external view returns (uint256) {
        if (block.timestamp >= roundDeadline) {
            return 0;
        }
        return roundDeadline - block.timestamp;
    }

    /**
     * @notice Check if member has late penalties
     */
    function getMemberPenalties(address _member) external view returns (uint256) {
        return latePenalties[_member];
    }

    /**
     * @notice Get contributing members count for current round
     */
    function getContributingMembersCount() external view returns (uint256) {
        if (currentRound == 0) return 0;

        uint256 count = 0;
        ContributionRound storage round = rounds[currentRound];

        for (uint256 i = 0; i < memberAddresses.length; i++) {
            if (round.hasContributed[memberAddresses[i]]) {
                count++;
            }
        }

        return count;
    }
}
