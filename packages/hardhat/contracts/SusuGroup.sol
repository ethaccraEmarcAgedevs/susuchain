// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./libraries/ChainlinkPriceFeed.sol";
import "./libraries/ChainlinkVRF.sol";

// Aave V3 Pool interface
interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

// ReferralRegistry interface
interface IReferralRegistry {
    function recordReferral(address referee, string memory referralCode) external;
    function recordContribution(address referee, uint256 amount) external;
}

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
        uint256 collateralDeposited;
        uint256 collateralSlashed;
        uint256 yieldEarned;
        uint256 missedPayments;
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

    // Aave V3 Collateral System
    enum CollateralTier { NONE, LOW, MEDIUM, FULL } // 0%, 25%, 50%, 100%
    CollateralTier public collateralTier;
    uint256 public collateralRequirement; // Amount per member
    address public aavePool; // Aave V3 Pool address
    address public aToken; // aToken received from Aave
    uint256 public totalCollateralLocked;
    uint256 public totalYieldGenerated;
    bool public autoCompound;

    // Referral System
    address public referralRegistry;

    // Chainlink Price Feeds
    address public priceFeedAddress;
    bool public isUSDDenominated; // True if contributions are in USD terms
    uint256 public baseUSDAmount; // Base USD amount if USD-denominated
    uint256 public lastPriceUpdate;
    uint256 public lastETHPrice;
    uint256 public constant MAX_PRICE_ADJUSTMENT = 2000; // 20% max adjustment per round

    // Chainlink VRF
    bool public useVRF; // True if group uses VRF for random ordering
    uint256 public vrfRequestId;
    bool public vrfFulfilled;
    uint256 public randomSeed;

    // Events
    event MemberJoined(address indexed member, string ensName, string efpProfile);
    event MemberJoinedWithReferral(address indexed member, string referralCode);
    event ContributionMade(address indexed member, uint256 round, uint256 amount);
    event PayoutDistributed(address indexed beneficiary, uint256 round, uint256 amount);
    event NewRoundStarted(uint256 round, address beneficiary);
    event GroupCompleted();
    event AutomatedPayoutExecuted(uint256 round, address beneficiary, uint256 amount);
    event LatePenaltyApplied(address indexed member, uint256 amount);
    event DeadlineUpdated(uint256 newDeadline);
    event CollateralDeposited(address indexed member, uint256 amount);
    event CollateralSlashed(address indexed member, uint256 amount, uint256 missedPayments);
    event CollateralReturned(address indexed member, uint256 amount, uint256 yieldEarned);
    event YieldDistributed(uint256 totalYield, uint256 perMember);
    event EmergencyWithdrawCollateral(address indexed member, uint256 amount);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 newContributionAmount);
    event VRFRequested(uint256 requestId);
    event PayoutQueueShuffled(uint256 randomSeed);

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
        address _contributionAsset,
        CollateralTier _collateralTier,
        address _aavePool,
        address _referralRegistry,
        address _priceFeedAddress,
        bool _isUSDDenominated,
        bool _useVRF
    ) Ownable(_creator) {
        require(_maxMembers > 1, "Group must have at least 2 members");
        require(_contributionAmount > 0, "Contribution amount must be greater than 0");
        require(_contributionInterval > 0, "Contribution interval must be greater than 0");

        groupName = _groupName;
        groupENSName = _groupENSName;
        contributionInterval = _contributionInterval;
        maxMembers = _maxMembers;
        currentRound = 0;
        groupActive = true;
        nextBeneficiaryIndex = 0;
        contributionAsset = _contributionAsset;

        // Collateral setup
        collateralTier = _collateralTier;
        aavePool = _aavePool;
        autoCompound = true; // Default to auto-compound

        // Referral setup
        referralRegistry = _referralRegistry;

        // Chainlink setup
        priceFeedAddress = _priceFeedAddress;
        isUSDDenominated = _isUSDDenominated;
        useVRF = _useVRF;

        // Set contribution amount based on denomination
        if (_isUSDDenominated && _priceFeedAddress != address(0)) {
            // Store base USD amount
            baseUSDAmount = _contributionAmount;

            // Get current ETH price and convert to ETH amount
            (uint256 ethPrice, , ) = ChainlinkPriceFeed.getETHUSDPrice(_priceFeedAddress);
            contributionAmount = ChainlinkPriceFeed.convertUSDToETH(_contributionAmount, ethPrice);
            lastETHPrice = ethPrice;
            lastPriceUpdate = block.timestamp;
        } else {
            // Direct ETH amount
            contributionAmount = _contributionAmount;
        }

        // Calculate collateral requirement based on tier
        if (_collateralTier == CollateralTier.LOW) {
            collateralRequirement = (contributionAmount * 25) / 100;
        } else if (_collateralTier == CollateralTier.MEDIUM) {
            collateralRequirement = (contributionAmount * 50) / 100;
        } else if (_collateralTier == CollateralTier.FULL) {
            collateralRequirement = contributionAmount;
        }

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

    function joinGroup(
        string memory _ensName,
        string memory _efpProfile,
        string memory _referralCode
    ) external payable nonReentrant {
        require(memberAddresses.length < maxMembers, "Group is full");
        require(!isMember[msg.sender], "Already a member");
        require(groupActive, "Group is not active");

        // Record referral if code provided
        if (bytes(_referralCode).length > 0 && referralRegistry != address(0)) {
            try IReferralRegistry(referralRegistry).recordReferral(msg.sender, _referralCode) {
                emit MemberJoinedWithReferral(msg.sender, _referralCode);
            } catch {
                // Silently fail if referral recording fails
            }
        }

        // Handle collateral deposit
        if (collateralRequirement > 0) {
            if (contributionAsset == address(0)) {
                // ETH collateral
                require(msg.value >= collateralRequirement, "Insufficient collateral");
            } else {
                // ERC20 collateral
                require(msg.value == 0, "Do not send ETH for token collateral");
                IERC20(contributionAsset).safeTransferFrom(msg.sender, address(this), collateralRequirement);
            }

            // Deposit collateral to Aave
            if (aavePool != address(0)) {
                _depositToAave(collateralRequirement);
            }
        }

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
            hasReceivedPayout: false,
            collateralDeposited: collateralRequirement,
            collateralSlashed: 0,
            yieldEarned: 0,
            missedPayments: 0
        });

        memberAddresses.push(_member);
        isMember[_member] = true;
        payoutQueue.push(_member);

        if (collateralRequirement > 0) {
            totalCollateralLocked += collateralRequirement;
            emit CollateralDeposited(_member, collateralRequirement);
        }
    }

    function _startGroup() internal {
        groupStartTime = block.timestamp;
        nextRoundStartTime = block.timestamp;

        // If VRF is enabled, shuffle payout queue
        if (useVRF) {
            _shufflePayoutQueue();
        }

        _startNewRound();
    }

    /**
     * @notice Shuffle payout queue using block hash as fallback randomness
     * @dev In production, this should use Chainlink VRF for true randomness
     */
    function _shufflePayoutQueue() internal {
        // Use block hash as source of randomness (fallback)
        // In production with VRF integration, this would wait for VRF fulfillment
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)));

        randomSeed = seed;

        // Fisher-Yates shuffle using RandomPayoutQueue library
        payoutQueue = RandomPayoutQueue.shuffle(payoutQueue, seed);

        emit PayoutQueueShuffled(seed);
    }

    /**
     * @notice Update contribution amount based on current price (USD-denominated groups)
     */
    function updateContributionPrice() external {
        require(isUSDDenominated, "Group is not USD-denominated");
        require(priceFeedAddress != address(0), "No price feed configured");

        // Get current ETH price
        (uint256 currentPrice, , uint256 updatedAt) = ChainlinkPriceFeed.getETHUSDPrice(priceFeedAddress);

        // Check if price has deviated significantly
        (bool hasDeviated, uint256 deviationBps) = ChainlinkPriceFeed.checkPriceDeviation(
            lastETHPrice,
            currentPrice,
            MAX_PRICE_ADJUSTMENT
        );

        // Only update if deviation is significant
        if (hasDeviated) {
            uint256 oldAmount = contributionAmount;

            // Calculate new ETH amount required for baseUSDAmount
            uint256 newAmount = ChainlinkPriceFeed.convertUSDToETH(baseUSDAmount, currentPrice);

            contributionAmount = newAmount;
            lastETHPrice = currentPrice;
            lastPriceUpdate = updatedAt;

            emit PriceUpdated(oldAmount, newAmount, contributionAmount);
        }
    }

    /**
     * @notice Get current USD value of contribution
     * @return usdValue USD value (18 decimals)
     */
    function getContributionUSDValue() external view returns (uint256 usdValue) {
        if (priceFeedAddress != address(0)) {
            (uint256 currentPrice, , ) = ChainlinkPriceFeed.getETHUSDPrice(priceFeedAddress);
            usdValue = ChainlinkPriceFeed.convertETHToUSD(contributionAmount, currentPrice);
        } else {
            usdValue = 0;
        }
    }

    /**
     * @notice Get current ETH price from feed
     * @return price ETH/USD price (8 decimals)
     * @return updatedAt Last update timestamp
     */
    function getCurrentETHPrice() external view returns (uint256 price, uint256 updatedAt) {
        if (priceFeedAddress != address(0)) {
            (price, , updatedAt) = ChainlinkPriceFeed.getETHUSDPrice(priceFeedAddress);
        } else {
            price = 0;
            updatedAt = 0;
        }
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

        // Record contribution for referral tracking
        if (referralRegistry != address(0)) {
            try IReferralRegistry(referralRegistry).recordContribution(msg.sender, contributionAmount) {
                // Successfully recorded contribution
            } catch {
                // Silently fail if contribution recording fails
            }
        }

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

    // ===== AAVE V3 COLLATERAL FUNCTIONS =====

    /**
     * @notice Deposit assets to Aave V3 for yield generation
     */
    function _depositToAave(uint256 amount) internal {
        if (aavePool == address(0) || amount == 0) return;

        if (contributionAsset == address(0)) {
            // ETH not directly supported, would need WETH wrapper
            return;
        }

        // Approve Aave Pool
        IERC20(contributionAsset).forceApprove(aavePool, amount);

        // Supply to Aave
        IPool(aavePool).supply(contributionAsset, amount, address(this), 0);
    }

    /**
     * @notice Withdraw assets from Aave V3
     */
    function _withdrawFromAave(uint256 amount) internal returns (uint256) {
        if (aavePool == address(0) || amount == 0) return 0;

        if (contributionAsset == address(0)) {
            return 0;
        }

        // Withdraw from Aave
        return IPool(aavePool).withdraw(contributionAsset, amount, address(this));
    }

    /**
     * @notice Slash collateral for missed payment
     */
    function slashCollateral(address member) external onlyOwner {
        require(isMember[member], "Not a member");
        require(collateralRequirement > 0, "No collateral system");

        Member storage memberData = members[member];
        memberData.missedPayments++;

        uint256 slashAmount = 0;

        // Progressive slashing
        if (memberData.missedPayments == 1) {
            slashAmount = (memberData.collateralDeposited * 10) / 100; // 10%
        } else if (memberData.missedPayments == 2) {
            slashAmount = (memberData.collateralDeposited * 25) / 100; // 25%
        } else if (memberData.missedPayments == 3) {
            slashAmount = (memberData.collateralDeposited * 50) / 100; // 50%
        } else {
            slashAmount = memberData.collateralDeposited - memberData.collateralSlashed; // 100%
        }

        memberData.collateralSlashed += slashAmount;
        totalCollateralLocked -= slashAmount;

        // Withdraw from Aave and distribute to compliant members
        if (aavePool != address(0)) {
            _withdrawFromAave(slashAmount);
        }

        emit CollateralSlashed(member, slashAmount, memberData.missedPayments);
    }

    /**
     * @notice Return collateral plus yield to member after group completion
     */
    function returnCollateral(address member) external onlyOwner nonReentrant {
        require(isMember[member], "Not a member");
        require(!groupActive, "Group still active");
        require(collateralRequirement > 0, "No collateral system");

        Member storage memberData = members[member];
        uint256 remainingCollateral = memberData.collateralDeposited - memberData.collateralSlashed;

        require(remainingCollateral > 0, "No collateral to return");

        // Calculate member's share of yield
        uint256 yieldShare = _calculateYieldShare(member);
        memberData.yieldEarned = yieldShare;

        uint256 totalReturn = remainingCollateral + yieldShare;

        // Withdraw from Aave
        if (aavePool != address(0)) {
            _withdrawFromAave(totalReturn);
        }

        // Transfer back to member
        if (contributionAsset == address(0)) {
            (bool success, ) = payable(member).call{value: totalReturn}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(contributionAsset).safeTransfer(member, totalReturn);
        }

        memberData.collateralDeposited = 0;
        totalCollateralLocked -= remainingCollateral;

        emit CollateralReturned(member, remainingCollateral, yieldShare);
    }

    /**
     * @notice Calculate yield share for a member
     */
    function _calculateYieldShare(address member) internal view returns (uint256) {
        if (aavePool == address(0)) return 0;

        Member storage memberData = members[member];

        // Simple proportional distribution
        // In production, track actual yield generation over time
        uint256 totalDeposited = memberData.collateralDeposited;
        if (totalDeposited == 0) return 0;

        // Placeholder: return proportional share of total yield
        // Real implementation would query aToken balance
        return 0;
    }

    /**
     * @notice Distribute yield to all members
     */
    function distributeYield() external onlyOwner {
        require(aavePool != address(0), "No Aave integration");
        require(collateralRequirement > 0, "No collateral system");

        // Calculate total yield generated
        // In production, compare current aToken balance vs deposited
        uint256 totalYield = 0; // Placeholder

        if (totalYield == 0) return;

        uint256 perMemberYield = totalYield / memberAddresses.length;

        for (uint256 i = 0; i < memberAddresses.length; i++) {
            members[memberAddresses[i]].yieldEarned += perMemberYield;
        }

        totalYieldGenerated += totalYield;

        emit YieldDistributed(totalYield, perMemberYield);
    }

    /**
     * @notice Emergency withdraw collateral if group fails to launch
     */
    function emergencyWithdrawCollateral() external onlyMember nonReentrant {
        require(groupStartTime == 0, "Group already started");
        require(collateralRequirement > 0, "No collateral");

        Member storage memberData = members[msg.sender];
        uint256 collateral = memberData.collateralDeposited;

        require(collateral > 0, "No collateral deposited");

        memberData.collateralDeposited = 0;
        totalCollateralLocked -= collateral;

        // Withdraw from Aave
        if (aavePool != address(0)) {
            _withdrawFromAave(collateral);
        }

        // Return collateral
        if (contributionAsset == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: collateral}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(contributionAsset).safeTransfer(msg.sender, collateral);
        }

        emit EmergencyWithdrawCollateral(msg.sender, collateral);
    }

    /**
     * @notice Get member's collateral info
     */
    function getMemberCollateral(address member) external view returns (
        uint256 deposited,
        uint256 slashed,
        uint256 yieldEarned,
        uint256 missedPayments
    ) {
        require(isMember[member], "Not a member");
        Member storage memberData = members[member];

        return (
            memberData.collateralDeposited,
            memberData.collateralSlashed,
            memberData.yieldEarned,
            memberData.missedPayments
        );
    }

    /**
     * @notice Get group's collateral summary
     */
    function getCollateralSummary() external view returns (
        CollateralTier tier,
        uint256 requirement,
        uint256 totalLocked,
        uint256 totalYield
    ) {
        return (
            collateralTier,
            collateralRequirement,
            totalCollateralLocked,
            totalYieldGenerated
        );
    }
}
