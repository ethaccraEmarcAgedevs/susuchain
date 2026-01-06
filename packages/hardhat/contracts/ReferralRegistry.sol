// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ReferralRegistry
 * @notice Onchain referral tracking and rewards for SusuChain
 * @dev Tracks referrer-referee relationships and distributes rewards
 */
contract ReferralRegistry is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Referral {
        address referrer;
        address referee;
        uint256 timestamp;
        uint256 contributionCount;
        bool qualified;
        uint256 rewardsEarned;
        bool active;
    }

    struct ReferrerStats {
        string referralCode;
        uint256 directReferrals;
        uint256 indirectReferrals;
        uint256 qualifiedReferrals;
        uint256 totalRewards;
        uint256 pendingRewards;
        uint256 claimedRewards;
        bool hasCustomCode;
    }

    // Referral codes
    mapping(string => address) public codeToReferrer;
    mapping(address => string) public referrerToCode;
    mapping(address => ReferrerStats) public referrerStats;

    // Referral tracking
    mapping(address => Referral) public referrals;
    mapping(address => address[]) public referrerToReferees;

    // Reward parameters
    uint256 public constant DIRECT_REWARD_RATE = 500; // 5% (basis points)
    uint256 public constant INDIRECT_REWARD_RATE = 200; // 2%
    uint256 public constant QUALIFICATION_CONTRIBUTIONS = 3;
    uint256 public constant QUALIFICATION_PERIOD = 30 days;

    // Milestone bonuses
    uint256 public constant BONUS_10_REFERRALS = 0.1 ether; // 0.1 ETH
    uint256 public constant BONUS_50_REFERRALS = 1 ether; // 1 ETH
    mapping(address => bool) public bonus10Claimed;
    mapping(address => bool) public bonus50Claimed;

    // Anti-fraud
    uint256 public constant MAX_REFERRALS_PER_DAY = 10;
    mapping(address => uint256) public dailyReferralCount;
    mapping(address => uint256) public lastReferralDay;
    mapping(address => bool) public blacklistedAddresses;

    // Authorized contracts (SusuGroups)
    mapping(address => bool) public authorizedContracts;

    // Events
    event ReferralCodeCreated(address indexed referrer, string code);
    event ReferralRecorded(address indexed referrer, address indexed referee, string code);
    event ReferralQualified(address indexed referee, address indexed referrer);
    event RewardDistributed(address indexed referrer, uint256 amount, uint8 level);
    event RewardsClaimed(address indexed referrer, uint256 amount);
    event BonusClaimed(address indexed referrer, uint256 amount, uint256 milestone);
    event AddressBlacklisted(address indexed account);

    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Generate and claim referral code
     */
    function createReferralCode(string memory code) external {
        require(bytes(code).length == 8, "Code must be 8 characters");
        require(bytes(referrerToCode[msg.sender]).length == 0, "Already has code");
        require(codeToReferrer[code] == address(0), "Code already taken");
        require(!blacklistedAddresses[msg.sender], "Address blacklisted");

        codeToReferrer[code] = msg.sender;
        referrerToCode[msg.sender] = code;
        referrerStats[msg.sender].referralCode = code;

        emit ReferralCodeCreated(msg.sender, code);
    }

    /**
     * @notice Set custom vanity code (owner only for premium users)
     */
    function setVanityCode(address user, string memory code) external onlyOwner {
        require(bytes(code).length >= 4 && bytes(code).length <= 12, "Invalid code length");
        require(codeToReferrer[code] == address(0), "Code already taken");

        // Remove old code if exists
        string memory oldCode = referrerToCode[user];
        if (bytes(oldCode).length > 0) {
            delete codeToReferrer[oldCode];
        }

        codeToReferrer[code] = user;
        referrerToCode[user] = code;
        referrerStats[user].referralCode = code;
        referrerStats[user].hasCustomCode = true;

        emit ReferralCodeCreated(user, code);
    }

    /**
     * @notice Record referral when user joins
     */
    function recordReferral(address referee, string memory referralCode) external onlyAuthorized {
        require(bytes(referralCode).length > 0, "Empty referral code");
        require(!blacklistedAddresses[referee], "Referee blacklisted");

        address referrer = codeToReferrer[referralCode];
        require(referrer != address(0), "Invalid referral code");
        require(referrer != referee, "Cannot refer yourself");
        require(referrals[referee].referrer == address(0), "Already has referrer");

        // Anti-fraud: Rate limiting
        uint256 currentDay = block.timestamp / 1 days;
        if (lastReferralDay[referrer] != currentDay) {
            dailyReferralCount[referrer] = 0;
            lastReferralDay[referrer] = currentDay;
        }
        require(dailyReferralCount[referrer] < MAX_REFERRALS_PER_DAY, "Daily limit reached");

        // Record referral
        referrals[referee] = Referral({
            referrer: referrer,
            referee: referee,
            timestamp: block.timestamp,
            contributionCount: 0,
            qualified: false,
            rewardsEarned: 0,
            active: true
        });

        referrerToReferees[referrer].push(referee);
        referrerStats[referrer].directReferrals++;
        dailyReferralCount[referrer]++;

        // Record indirect referral (if referrer was also referred)
        if (referrals[referrer].referrer != address(0)) {
            address indirectReferrer = referrals[referrer].referrer;
            referrerStats[indirectReferrer].indirectReferrals++;
        }

        emit ReferralRecorded(referrer, referee, referralCode);
    }

    /**
     * @notice Track contribution and check qualification
     */
    function recordContribution(address referee, uint256 amount) external onlyAuthorized {
        Referral storage ref = referrals[referee];
        require(ref.referrer != address(0), "No referrer");
        require(ref.active, "Referral inactive");

        ref.contributionCount++;

        // Check if qualified
        if (
            !ref.qualified &&
            ref.contributionCount >= QUALIFICATION_CONTRIBUTIONS &&
            block.timestamp <= ref.timestamp + QUALIFICATION_PERIOD
        ) {
            ref.qualified = true;
            referrerStats[ref.referrer].qualifiedReferrals++;

            emit ReferralQualified(referee, ref.referrer);

            // Calculate and distribute rewards
            _distributeRewards(ref.referrer, amount, referee);
        }
    }

    /**
     * @notice Internal reward distribution
     */
    function _distributeRewards(address referrer, uint256 contributionAmount, address referee) internal {
        // Direct referral reward (5%)
        uint256 directReward = (contributionAmount * DIRECT_REWARD_RATE) / 10000;
        referrerStats[referrer].pendingRewards += directReward;
        referrerStats[referrer].totalRewards += directReward;
        referrals[referee].rewardsEarned += directReward;

        emit RewardDistributed(referrer, directReward, 1);

        // Indirect referral reward (2%)
        if (referrals[referrer].referrer != address(0)) {
            address indirectReferrer = referrals[referrer].referrer;
            uint256 indirectReward = (contributionAmount * INDIRECT_REWARD_RATE) / 10000;

            referrerStats[indirectReferrer].pendingRewards += indirectReward;
            referrerStats[indirectReferrer].totalRewards += indirectReward;

            emit RewardDistributed(indirectReferrer, indirectReward, 2);
        }
    }

    /**
     * @notice Claim pending rewards
     */
    function claimRewards() external nonReentrant {
        require(!blacklistedAddresses[msg.sender], "Address blacklisted");

        uint256 pending = referrerStats[msg.sender].pendingRewards;
        require(pending > 0, "No pending rewards");

        referrerStats[msg.sender].pendingRewards = 0;
        referrerStats[msg.sender].claimedRewards += pending;

        (bool success, ) = payable(msg.sender).call{value: pending}("");
        require(success, "ETH transfer failed");

        emit RewardsClaimed(msg.sender, pending);
    }

    /**
     * @notice Claim milestone bonus
     */
    function claimMilestoneBonus() external nonReentrant {
        require(!blacklistedAddresses[msg.sender], "Address blacklisted");

        ReferrerStats storage stats = referrerStats[msg.sender];
        uint256 bonus = 0;

        // Check 10 referrals bonus
        if (stats.qualifiedReferrals >= 10 && !bonus10Claimed[msg.sender]) {
            bonus += BONUS_10_REFERRALS;
            bonus10Claimed[msg.sender] = true;
            emit BonusClaimed(msg.sender, BONUS_10_REFERRALS, 10);
        }

        // Check 50 referrals bonus
        if (stats.qualifiedReferrals >= 50 && !bonus50Claimed[msg.sender]) {
            bonus += BONUS_50_REFERRALS;
            bonus50Claimed[msg.sender] = true;
            emit BonusClaimed(msg.sender, BONUS_50_REFERRALS, 50);
        }

        require(bonus > 0, "No bonus available");

        (bool success, ) = payable(msg.sender).call{value: bonus}("");
        require(success, "ETH transfer failed");
    }

    /**
     * @notice Get referrer by referee
     */
    function getReferrer(address referee) external view returns (address) {
        return referrals[referee].referrer;
    }

    /**
     * @notice Get all referees for a referrer
     */
    function getReferees(address referrer) external view returns (address[] memory) {
        return referrerToReferees[referrer];
    }

    /**
     * @notice Get referrer statistics
     */
    function getReferrerStats(address referrer) external view returns (ReferrerStats memory) {
        return referrerStats[referrer];
    }

    /**
     * @notice Check if referral is qualified
     */
    function isReferralQualified(address referee) external view returns (bool) {
        return referrals[referee].qualified;
    }

    /**
     * @notice Authorize contract to record referrals
     */
    function authorizeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = true;
    }

    /**
     * @notice Revoke contract authorization
     */
    function revokeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
    }

    /**
     * @notice Blacklist address for fraud
     */
    function blacklistAddress(address account) external onlyOwner {
        blacklistedAddresses[account] = true;
        emit AddressBlacklisted(account);
    }

    /**
     * @notice Fund contract with rewards
     */
    receive() external payable {}

    /**
     * @notice Withdraw funds (owner only, for emergency)
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
    }
}
