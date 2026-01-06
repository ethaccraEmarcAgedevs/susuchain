// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GovernanceParameters
 * @notice Platform parameters controlled by DAO governance
 * @dev Owner should be set to SusuTimelock after deployment
 */
contract GovernanceParameters is Ownable {
    // Platform fees (in basis points, 1% = 100)
    uint256 public platformFeeRate = 50; // 0.5% default
    uint256 public constant MAX_FEE_RATE = 1000; // 10% maximum

    // Group parameters
    uint256 public minGroupSize = 2;
    uint256 public maxGroupSize = 100;
    uint256 public minContribution = 1000000; // 0.001 USDC (6 decimals)
    uint256 public maxContribution = 1000000000000; // 1M USDC

    // Collateral parameters
    bool public collateralEnabled = true;
    uint256 public minCollateralTier = 0; // 0 = NONE allowed
    uint256 public maxCollateralTier = 100; // 100 = FULL allowed

    // Treasury allocations (in basis points)
    uint256 public treasuryDevelopmentAllocation = 4000; // 40%
    uint256 public treasuryRewardsAllocation = 3000; // 30%
    uint256 public treasuryReserveAllocation = 3000; // 30%

    // Emergency controls
    bool public emergencyPaused = false;
    address public emergencyGuardian;

    // Events
    event PlatformFeeUpdated(uint256 oldRate, uint256 newRate);
    event GroupSizeLimitsUpdated(uint256 minSize, uint256 maxSize);
    event ContributionLimitsUpdated(uint256 minAmount, uint256 maxAmount);
    event CollateralTiersUpdated(uint256 minTier, uint256 maxTier);
    event TreasuryAllocationsUpdated(uint256 dev, uint256 rewards, uint256 reserve);
    event EmergencyPauseToggled(bool paused);
    event EmergencyGuardianUpdated(address indexed oldGuardian, address indexed newGuardian);

    constructor(address _owner) Ownable(_owner) {
        emergencyGuardian = _owner;
    }

    // ===== GOVERNANCE FUNCTIONS =====

    /**
     * @notice Update platform fee rate
     * @param newRate New fee rate in basis points
     */
    function setPlatformFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= MAX_FEE_RATE, "Fee rate too high");
        uint256 oldRate = platformFeeRate;
        platformFeeRate = newRate;
        emit PlatformFeeUpdated(oldRate, newRate);
    }

    /**
     * @notice Update group size limits
     */
    function setGroupSizeLimits(uint256 _minSize, uint256 _maxSize) external onlyOwner {
        require(_minSize >= 2, "Min size must be at least 2");
        require(_maxSize >= _minSize, "Max must be >= min");
        require(_maxSize <= 1000, "Max size too large");

        minGroupSize = _minSize;
        maxGroupSize = _maxSize;

        emit GroupSizeLimitsUpdated(_minSize, _maxSize);
    }

    /**
     * @notice Update contribution limits
     */
    function setContributionLimits(uint256 _minAmount, uint256 _maxAmount) external onlyOwner {
        require(_minAmount > 0, "Min amount must be positive");
        require(_maxAmount >= _minAmount, "Max must be >= min");

        minContribution = _minAmount;
        maxContribution = _maxAmount;

        emit ContributionLimitsUpdated(_minAmount, _maxAmount);
    }

    /**
     * @notice Update collateral tier limits
     */
    function setCollateralTiers(uint256 _minTier, uint256 _maxTier, bool _enabled) external onlyOwner {
        require(_minTier <= _maxTier, "Min must be <= max");
        require(_maxTier <= 100, "Max tier cannot exceed 100");

        minCollateralTier = _minTier;
        maxCollateralTier = _maxTier;
        collateralEnabled = _enabled;

        emit CollateralTiersUpdated(_minTier, _maxTier);
    }

    /**
     * @notice Update treasury allocations
     */
    function setTreasuryAllocations(
        uint256 _devAllocation,
        uint256 _rewardsAllocation,
        uint256 _reserveAllocation
    ) external onlyOwner {
        require(_devAllocation + _rewardsAllocation + _reserveAllocation == 10000, "Allocations must sum to 100%");

        treasuryDevelopmentAllocation = _devAllocation;
        treasuryRewardsAllocation = _rewardsAllocation;
        treasuryReserveAllocation = _reserveAllocation;

        emit TreasuryAllocationsUpdated(_devAllocation, _rewardsAllocation, _reserveAllocation);
    }

    /**
     * @notice Emergency pause toggle (guardian only)
     */
    function setEmergencyPause(bool _paused) external {
        require(msg.sender == emergencyGuardian || msg.sender == owner(), "Not authorized");

        emergencyPaused = _paused;

        emit EmergencyPauseToggled(_paused);
    }

    /**
     * @notice Update emergency guardian
     */
    function setEmergencyGuardian(address _newGuardian) external onlyOwner {
        address oldGuardian = emergencyGuardian;
        emergencyGuardian = _newGuardian;

        emit EmergencyGuardianUpdated(oldGuardian, _newGuardian);
    }

    // ===== VIEW FUNCTIONS =====

    /**
     * @notice Get all platform parameters
     */
    function getAllParameters()
        external
        view
        returns (
            uint256 feeRate,
            uint256 minSize,
            uint256 maxSize,
            uint256 minContrib,
            uint256 maxContrib,
            bool isPaused
        )
    {
        return (platformFeeRate, minGroupSize, maxGroupSize, minContribution, maxContribution, emergencyPaused);
    }

    /**
     * @notice Check if a group configuration is valid
     */
    function isValidGroupConfig(
        uint256 groupSize,
        uint256 contributionAmount,
        uint256 collateralTier
    ) external view returns (bool) {
        if (emergencyPaused) return false;
        if (groupSize < minGroupSize || groupSize > maxGroupSize) return false;
        if (contributionAmount < minContribution || contributionAmount > maxContribution) return false;
        if (collateralEnabled && (collateralTier < minCollateralTier || collateralTier > maxCollateralTier))
            return false;

        return true;
    }
}
