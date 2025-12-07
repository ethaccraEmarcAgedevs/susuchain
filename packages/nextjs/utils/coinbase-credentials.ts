import { Address } from "viem";

/**
 * Coinbase Verified Credentials utility
 * Handles verification badges and credential checking
 */

export interface VerificationCredential {
  type: "coinbase" | "passport" | "phone" | "email";
  verified: boolean;
  timestamp?: number;
}

export interface UserCredentials {
  address: Address;
  coinbaseVerified: boolean;
  passportVerified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  verificationScore: number;
}

// Mock credential storage (in production, this would be on-chain or from Coinbase API)
const mockCredentials = new Map<Address, UserCredentials>();

/**
 * Check if user has Coinbase verification
 */
export async function checkCoinbaseVerification(address: Address): Promise<boolean> {
  // In production, this would query Coinbase's verification API
  const cached = mockCredentials.get(address);
  return cached?.coinbaseVerified || false;
}

/**
 * Get all user credentials
 */
export async function getUserCredentials(address: Address): Promise<UserCredentials> {
  // In production, fetch from Coinbase attestation service
  const existing = mockCredentials.get(address);

  if (existing) {
    return existing;
  }

  // Default unverified state
  return {
    address,
    coinbaseVerified: false,
    passportVerified: false,
    phoneVerified: false,
    emailVerified: false,
    verificationScore: 0,
  };
}

/**
 * Calculate verification score (0-100)
 */
export function calculateVerificationScore(credentials: UserCredentials): number {
  let score = 0;

  if (credentials.coinbaseVerified) score += 40;
  if (credentials.passportVerified) score += 30;
  if (credentials.phoneVerified) score += 15;
  if (credentials.emailVerified) score += 15;

  return Math.min(100, score);
}

/**
 * Get verification badge details
 */
export function getVerificationBadge(score: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (score >= 85) {
    return {
      label: "Verified Member",
      color: "text-green-600 bg-green-50 border-green-200",
      icon: "✓",
    };
  } else if (score >= 55) {
    return {
      label: "Partially Verified",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      icon: "~",
    };
  }

  return {
    label: "Unverified",
    color: "text-gray-600 bg-gray-50 border-gray-200",
    icon: "?",
  };
}

/**
 * Mock function to set verification (for testing)
 */
export function setMockVerification(address: Address, credentials: Partial<UserCredentials>): void {
  const existing = mockCredentials.get(address) || {
    address,
    coinbaseVerified: false,
    passportVerified: false,
    phoneVerified: false,
    emailVerified: false,
    verificationScore: 0,
  };

  const updated = { ...existing, ...credentials };
  updated.verificationScore = calculateVerificationScore(updated);
  mockCredentials.set(address, updated);
}
