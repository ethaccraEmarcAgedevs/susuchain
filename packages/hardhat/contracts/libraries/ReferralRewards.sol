// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReferralRewards
 * @notice Library for calculating referral rewards and bonuses
 */
library ReferralRewards {
    // Reward rates (basis points)
    uint256 public constant DIRECT_REWARD_RATE = 500; // 5%
    uint256 public constant INDIRECT_REWARD_RATE = 200; // 2%
    uint256 public constant BASIS_POINTS = 10000;

    // Milestone bonuses
    uint256 public constant BONUS_10_REFERRALS = 0.1 ether;
    uint256 public constant BONUS_50_REFERRALS = 1 ether;
    uint256 public constant BONUS_100_REFERRALS = 5 ether;
    uint256 public constant BONUS_500_REFERRALS = 30 ether;

    // Qualification requirements
    uint256 public constant QUALIFICATION_CONTRIBUTIONS = 3;
    uint256 public constant QUALIFICATION_PERIOD = 30 days;
    uint256 public constant MIN_CONTRIBUTION_AMOUNT = 0.001 ether;

    /**
     * @notice Calculate direct referral reward
     */
    function calculateDirectReward(uint256 contributionAmount) internal pure returns (uint256) {
        return (contributionAmount * DIRECT_REWARD_RATE) / BASIS_POINTS;
    }

    /**
     * @notice Calculate indirect referral reward
     */
    function calculateIndirectReward(uint256 contributionAmount) internal pure returns (uint256) {
        return (contributionAmount * INDIRECT_REWARD_RATE) / BASIS_POINTS;
    }

    /**
     * @notice Calculate total reward for contribution
     */
    function calculateTotalReward(
        uint256 contributionAmount,
        bool hasIndirectReferrer
    ) internal pure returns (uint256 directReward, uint256 indirectReward) {
        directReward = calculateDirectReward(contributionAmount);
        indirectReward = hasIndirectReferrer ? calculateIndirectReward(contributionAmount) : 0;
    }

    /**
     * @notice Calculate milestone bonus
     */
    function calculateMilestoneBonus(
        uint256 qualifiedReferrals,
        bool bonus10Claimed,
        bool bonus50Claimed,
        bool bonus100Claimed,
        bool bonus500Claimed
    ) internal pure returns (uint256 totalBonus, uint256[] memory unclaimedMilestones) {
        uint256 count = 0;
        uint256[] memory milestones = new uint256[](4);

        // Check 10 referrals
        if (qualifiedReferrals >= 10 && !bonus10Claimed) {
            totalBonus += BONUS_10_REFERRALS;
            milestones[count++] = 10;
        }

        // Check 50 referrals
        if (qualifiedReferrals >= 50 && !bonus50Claimed) {
            totalBonus += BONUS_50_REFERRALS;
            milestones[count++] = 50;
        }

        // Check 100 referrals
        if (qualifiedReferrals >= 100 && !bonus100Claimed) {
            totalBonus += BONUS_100_REFERRALS;
            milestones[count++] = 100;
        }

        // Check 500 referrals
        if (qualifiedReferrals >= 500 && !bonus500Claimed) {
            totalBonus += BONUS_500_REFERRALS;
            milestones[count++] = 500;
        }

        // Resize array to actual count
        unclaimedMilestones = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            unclaimedMilestones[i] = milestones[i];
        }
    }

    /**
     * @notice Check if referral is qualified
     */
    function isQualified(
        uint256 contributionCount,
        uint256 referralTimestamp,
        uint256 currentTimestamp
    ) internal pure returns (bool) {
        bool hasEnoughContributions = contributionCount >= QUALIFICATION_CONTRIBUTIONS;
        bool withinPeriod = currentTimestamp <= referralTimestamp + QUALIFICATION_PERIOD;
        return hasEnoughContributions && withinPeriod;
    }

    /**
     * @notice Calculate referrer tier based on qualified referrals
     */
    function getReferrerTier(uint256 qualifiedReferrals) internal pure returns (uint8) {
        if (qualifiedReferrals >= 500) return 5; // Legend
        if (qualifiedReferrals >= 100) return 4; // Elite
        if (qualifiedReferrals >= 50) return 3; // Expert
        if (qualifiedReferrals >= 10) return 2; // Pro
        if (qualifiedReferrals >= 3) return 1; // Active
        return 0; // Novice
    }

    /**
     * @notice Get tier name
     */
    function getTierName(uint8 tier) internal pure returns (string memory) {
        if (tier == 5) return "Legend";
        if (tier == 4) return "Elite";
        if (tier == 3) return "Expert";
        if (tier == 2) return "Pro";
        if (tier == 1) return "Active";
        return "Novice";
    }

    /**
     * @notice Calculate bonus multiplier for tier
     */
    function getTierMultiplier(uint8 tier) internal pure returns (uint256) {
        if (tier == 5) return 20000; // 2x
        if (tier == 4) return 17500; // 1.75x
        if (tier == 3) return 15000; // 1.5x
        if (tier == 2) return 12500; // 1.25x
        if (tier == 1) return 11000; // 1.1x
        return 10000; // 1x
    }

    /**
     * @notice Calculate reward with tier multiplier
     */
    function calculateRewardWithTier(
        uint256 baseReward,
        uint8 referrerTier
    ) internal pure returns (uint256) {
        uint256 multiplier = getTierMultiplier(referrerTier);
        return (baseReward * multiplier) / BASIS_POINTS;
    }

    /**
     * @notice Validate referral code format
     */
    function isValidReferralCode(string memory code) internal pure returns (bool) {
        bytes memory codeBytes = bytes(code);
        uint256 length = codeBytes.length;

        // Check length (4-12 characters)
        if (length < 4 || length > 12) return false;

        // Check characters (alphanumeric only)
        for (uint256 i = 0; i < length; i++) {
            bytes1 char = codeBytes[i];
            bool isDigit = char >= 0x30 && char <= 0x39; // 0-9
            bool isUppercase = char >= 0x41 && char <= 0x5A; // A-Z
            bool isLowercase = char >= 0x61 && char <= 0x7A; // a-z

            if (!isDigit && !isUppercase && !isLowercase) {
                return false;
            }
        }

        return true;
    }

    /**
     * @notice Generate referral code from address
     */
    function generateCodeFromAddress(address user) internal pure returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(user));
        bytes memory code = new bytes(8);

        // Use alphanumeric characters
        bytes memory chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No O, 0, I, 1

        for (uint256 i = 0; i < 8; i++) {
            uint8 index = uint8(hash[i]) % 32;
            code[i] = chars[index];
        }

        return string(code);
    }

    /**
     * @notice Calculate referral tree depth
     */
    function calculateTreeDepth(uint256 totalReferrals, uint256 directReferrals) internal pure returns (uint256) {
        if (directReferrals == 0) return 0;
        uint256 indirectReferrals = totalReferrals > directReferrals ? totalReferrals - directReferrals : 0;
        return indirectReferrals > 0 ? 2 : 1;
    }

    /**
     * @notice Calculate performance score
     */
    function calculatePerformanceScore(
        uint256 qualifiedReferrals,
        uint256 totalReferrals,
        uint256 totalRewards
    ) internal pure returns (uint256) {
        if (totalReferrals == 0) return 0;

        // Qualification rate (0-40 points)
        uint256 qualificationRate = (qualifiedReferrals * 10000) / totalReferrals;
        uint256 qualificationScore = (qualificationRate * 40) / 10000;

        // Volume score (0-30 points)
        uint256 volumeScore = totalReferrals >= 100 ? 30 : (totalReferrals * 30) / 100;

        // Rewards score (0-30 points)
        uint256 rewardsScore = totalRewards >= 10 ether ? 30 : (uint256(totalRewards) * 30) / 10 ether;

        return qualificationScore + volumeScore + rewardsScore;
    }

    /**
     * @notice Estimate rewards for contribution amount
     */
    function estimateRewards(
        uint256 contributionAmount,
        uint8 referrerTier,
        bool hasIndirectReferrer
    )
        internal
        pure
        returns (uint256 directReward, uint256 indirectReward, uint256 totalReward)
    {
        // Calculate base rewards
        directReward = calculateDirectReward(contributionAmount);
        indirectReward = hasIndirectReferrer ? calculateIndirectReward(contributionAmount) : 0;

        // Apply tier multiplier to direct reward
        directReward = calculateRewardWithTier(directReward, referrerTier);

        totalReward = directReward + indirectReward;
    }
}
