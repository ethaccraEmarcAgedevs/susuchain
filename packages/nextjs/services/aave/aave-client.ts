import { Address } from "viem";

/**
 * Aave V3 Integration for Base Network
 * Handles collateral deposits, withdrawals, and yield calculations
 */

// Aave V3 Pool contract on Base
export const AAVE_V3_POOL_BASE = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5" as Address;

// Aave V3 Pool Data Provider on Base
export const AAVE_V3_DATA_PROVIDER_BASE = "0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac" as Address;

// aTokens on Base
export const AAVE_TOKENS = {
  aUSDC: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB" as Address, // Base USDC aToken
  aETH: "0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7" as Address, // Base WETH aToken
} as const;

// Underlying assets
export const UNDERLYING_ASSETS = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address,
  WETH: "0x4200000000000000000000000000000000000006" as Address,
} as const;

export interface AaveReserveData {
  availableLiquidity: bigint;
  totalStableDebt: bigint;
  totalVariableDebt: bigint;
  liquidityRate: bigint; // APY in ray (27 decimals)
  variableBorrowRate: bigint;
  stableBorrowRate: bigint;
  averageStableBorrowRate: bigint;
  utilizationRate: bigint;
  liquidityIndex: bigint;
  variableBorrowIndex: bigint;
  lastUpdateTimestamp: number;
}

export interface UserReserveData {
  currentATokenBalance: bigint;
  currentStableDebt: bigint;
  currentVariableDebt: bigint;
  scaledVariableDebt: bigint;
  scaledATokenBalance: bigint;
  liquidityRate: bigint;
  usageAsCollateralEnabled: boolean;
}

/**
 * Calculate APY from Aave's liquidity rate
 * Aave rates are in RAY (27 decimals) and per second
 */
export function calculateAPY(liquidityRate: bigint): number {
  // Convert from RAY to percentage
  const RAY = BigInt(10) ** BigInt(27);
  const SECONDS_PER_YEAR = BigInt(31536000);

  // APY = (1 + ratePerSecond)^secondsPerYear - 1
  // Simplified for display: rate / RAY * 100
  const rateDecimal = Number(liquidityRate) / Number(RAY);
  const apy = rateDecimal * 100;

  return apy;
}

/**
 * Calculate projected yield for a given amount and time
 */
export function calculateProjectedYield(
  principal: bigint,
  apyPercentage: number,
  durationSeconds: number,
): bigint {
  const SECONDS_PER_YEAR = 31536000;

  // Simple interest calculation
  // Yield = principal * APY * (duration / year)
  const apyDecimal = apyPercentage / 100;
  const timeRatio = durationSeconds / SECONDS_PER_YEAR;
  const yieldAmount = Number(principal) * apyDecimal * timeRatio;

  return BigInt(Math.floor(yieldAmount));
}

/**
 * Get aToken address for underlying asset
 */
export function getATokenAddress(underlyingAsset: Address): Address | null {
  if (underlyingAsset.toLowerCase() === UNDERLYING_ASSETS.USDC.toLowerCase()) {
    return AAVE_TOKENS.aUSDC;
  }
  if (underlyingAsset.toLowerCase() === UNDERLYING_ASSETS.WETH.toLowerCase()) {
    return AAVE_TOKENS.aETH;
  }
  return null;
}

/**
 * Get underlying asset for aToken
 */
export function getUnderlyingAsset(aTokenAddress: Address): Address | null {
  if (aTokenAddress.toLowerCase() === AAVE_TOKENS.aUSDC.toLowerCase()) {
    return UNDERLYING_ASSETS.USDC;
  }
  if (aTokenAddress.toLowerCase() === AAVE_TOKENS.aETH.toLowerCase()) {
    return UNDERLYING_ASSETS.WETH;
  }
  return null;
}

/**
 * Format APY for display
 */
export function formatAPY(apy: number): string {
  return `${apy.toFixed(2)}%`;
}

/**
 * Check if asset is supported by Aave on Base
 */
export function isSupportedAaveAsset(assetAddress: Address): boolean {
  const supported = [UNDERLYING_ASSETS.USDC, UNDERLYING_ASSETS.WETH];
  return supported.some(addr => addr.toLowerCase() === assetAddress.toLowerCase());
}

/**
 * Calculate collateral requirement based on tier
 */
export enum CollateralTier {
  NONE = 0,
  LOW = 25,
  MEDIUM = 50,
  FULL = 100,
}

export function calculateCollateralAmount(contributionAmount: bigint, tier: CollateralTier): bigint {
  return (contributionAmount * BigInt(tier)) / BigInt(100);
}

/**
 * Get tier badge color
 */
export function getTierBadgeColor(tier: CollateralTier): string {
  switch (tier) {
    case CollateralTier.NONE:
      return "bg-gray-100 text-gray-700";
    case CollateralTier.LOW:
      return "bg-green-100 text-green-700";
    case CollateralTier.MEDIUM:
      return "bg-yellow-100 text-yellow-700";
    case CollateralTier.FULL:
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * Get tier name
 */
export function getTierName(tier: CollateralTier): string {
  switch (tier) {
    case CollateralTier.NONE:
      return "No Collateral";
    case CollateralTier.LOW:
      return "Low Risk (25%)";
    case CollateralTier.MEDIUM:
      return "Medium Risk (50%)";
    case CollateralTier.FULL:
      return "Fully Collateralized";
    default:
      return "Unknown";
  }
}

/**
 * Calculate penalty for missed payment
 */
export function calculatePenalty(collateral: bigint, missedPayments: number): bigint {
  if (missedPayments === 1) {
    return (collateral * BigInt(10)) / BigInt(100); // 10%
  } else if (missedPayments === 2) {
    return (collateral * BigInt(25)) / BigInt(100); // 25%
  } else if (missedPayments === 3) {
    return (collateral * BigInt(50)) / BigInt(100); // 50%
  } else if (missedPayments >= 4) {
    return collateral; // 100% - complete loss
  }
  return BigInt(0);
}

/**
 * Aave V3 Pool ABI (minimal for our needs)
 */
export const AAVE_POOL_ABI = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveData",
    outputs: [
      {
        components: [
          { name: "configuration", type: "uint256" },
          { name: "liquidityIndex", type: "uint128" },
          { name: "currentLiquidityRate", type: "uint128" },
          { name: "variableBorrowIndex", type: "uint128" },
          { name: "currentVariableBorrowRate", type: "uint128" },
          { name: "currentStableBorrowRate", type: "uint128" },
          { name: "lastUpdateTimestamp", type: "uint40" },
          { name: "id", type: "uint16" },
          { name: "aTokenAddress", type: "address" },
          { name: "stableDebtTokenAddress", type: "address" },
          { name: "variableDebtTokenAddress", type: "address" },
          { name: "interestRateStrategyAddress", type: "address" },
          { name: "accruedToTreasury", type: "uint128" },
          { name: "unbacked", type: "uint128" },
          { name: "isolationModeTotalDebt", type: "uint128" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
