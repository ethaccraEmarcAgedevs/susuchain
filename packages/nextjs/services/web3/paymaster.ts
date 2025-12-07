import { Address, Hex, encodeFunctionData } from "viem";
import { base } from "viem/chains";

/**
 * Paymaster Service for Base
 * Handles gas sponsorship for eligible transactions
 */

export interface PaymasterPolicy {
  maxSponsoredTransactions: number;
  sponsoredOperations: string[];
  eligibilityRules: {
    maxGasPerTransaction: bigint;
    cooldownPeriod: number;
  };
}

export interface PaymasterEligibility {
  isEligible: boolean;
  reason?: string;
  remainingSponsored: number;
}

export interface PaymasterData {
  paymaster: Address;
  paymasterData: Hex;
  paymasterVerificationGasLimit: bigint;
  paymasterPostOpGasLimit: bigint;
}

// Track user sponsorship usage (in production, this would be on-chain or in a database)
const userSponsorshipTracking = new Map<Address, number>();

/**
 * Default policy for Base Paymaster
 * Sponsors first 3 transactions per user for contribution operations
 */
const DEFAULT_POLICY: PaymasterPolicy = {
  maxSponsoredTransactions: 3,
  sponsoredOperations: ["joinGroup", "contributeToRound"],
  eligibilityRules: {
    maxGasPerTransaction: BigInt(500000), // 500k gas limit
    cooldownPeriod: 0, // No cooldown for now
  },
};

/**
 * Check if user is eligible for gas sponsorship
 */
export async function checkPaymasterEligibility(
  userAddress: Address,
  operation: string,
  estimatedGas: bigint,
): Promise<PaymasterEligibility> {
  // Check if operation is sponsored
  if (!DEFAULT_POLICY.sponsoredOperations.includes(operation)) {
    return {
      isEligible: false,
      reason: "Operation not eligible for sponsorship",
      remainingSponsored: 0,
    };
  }

  // Check gas limit
  if (estimatedGas > DEFAULT_POLICY.eligibilityRules.maxGasPerTransaction) {
    return {
      isEligible: false,
      reason: "Transaction gas too high",
      remainingSponsored: 0,
    };
  }

  // Check user usage
  const usedTransactions = userSponsorshipTracking.get(userAddress) || 0;
  const remaining = DEFAULT_POLICY.maxSponsoredTransactions - usedTransactions;

  if (remaining <= 0) {
    return {
      isEligible: false,
      reason: "Sponsorship limit reached",
      remainingSponsored: 0,
    };
  }

  return {
    isEligible: true,
    remainingSponsored: remaining,
  };
}

/**
 * Get Paymaster data for transaction sponsorship
 * In production, this would call Base's Paymaster API
 */
export async function getPaymasterData(
  userAddress: Address,
  targetContract: Address,
  callData: Hex,
  operation: string,
  estimatedGas: bigint,
): Promise<PaymasterData | null> {
  // Check eligibility
  const eligibility = await checkPaymasterEligibility(userAddress, operation, estimatedGas);

  if (!eligibility.isEligible) {
    console.log(`Paymaster not eligible: ${eligibility.reason}`);
    return null;
  }

  // In production, this would call Base Paymaster API
  // For now, we return a mock structure
  // Base Paymaster address (this would be the actual deployed paymaster on Base)
  const paymasterAddress = "0x0000000000000000000000000000000000000000" as Address;

  // Encode paymaster-specific data
  // This would include verification data from the Paymaster service
  const paymasterData = "0x" as Hex;

  return {
    paymaster: paymasterAddress,
    paymasterData,
    paymasterVerificationGasLimit: BigInt(100000),
    paymasterPostOpGasLimit: BigInt(50000),
  };
}

/**
 * Record a sponsored transaction
 */
export function recordSponsoredTransaction(userAddress: Address): void {
  const current = userSponsorshipTracking.get(userAddress) || 0;
  userSponsorshipTracking.set(userAddress, current + 1);
}

/**
 * Get remaining sponsored transactions for a user
 */
export function getRemainingSponsored(userAddress: Address): number {
  const used = userSponsorshipTracking.get(userAddress) || 0;
  return Math.max(0, DEFAULT_POLICY.maxSponsoredTransactions - used);
}

/**
 * Reset sponsorship tracking (for testing or admin purposes)
 */
export function resetSponsorshipTracking(userAddress?: Address): void {
  if (userAddress) {
    userSponsorshipTracking.delete(userAddress);
  } else {
    userSponsorshipTracking.clear();
  }
}

/**
 * Check if Paymaster is available on current network
 */
export function isPaymasterAvailable(chainId: number): boolean {
  // Paymaster is only available on Base (mainnet and testnet)
  return chainId === base.id || chainId === 84532; // Base mainnet and Base Sepolia
}

/**
 * Format Paymaster error messages for user display
 */
export function formatPaymasterError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("limit reached")) {
      return "You've used all your free transactions. This transaction will require gas fees.";
    }
    if (error.message.includes("not eligible")) {
      return "This transaction is not eligible for gas sponsorship.";
    }
    if (error.message.includes("unavailable")) {
      return "Gas sponsorship is temporarily unavailable. Proceeding with regular transaction.";
    }
  }
  return "Unable to sponsor gas fees. Proceeding with regular transaction.";
}
