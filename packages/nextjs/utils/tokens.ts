import { Address } from "viem";

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  isStablecoin: boolean;
  logoUrl?: string;
}

// Base Network Token Addresses
export const BASE_TOKENS: Record<string, TokenInfo> = {
  ETH: {
    address: "0x0000000000000000000000000000000000000000" as Address, // address(0) represents ETH
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    isStablecoin: false,
    logoUrl: "/images/tokens/eth.svg",
  },
  USDC: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, // Base USDC
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    isStablecoin: true,
    logoUrl: "/images/tokens/usdc.svg",
  },
  // Can add more tokens as needed
};

// Default token for new groups (USDC for stability)
export const DEFAULT_TOKEN = BASE_TOKENS.USDC;

/**
 * Get token info by address
 */
export function getTokenByAddress(address: Address): TokenInfo | undefined {
  const normalizedAddress = address.toLowerCase();

  return Object.values(BASE_TOKENS).find(
    token => token.address.toLowerCase() === normalizedAddress
  );
}

/**
 * Check if an address is a known stablecoin
 */
export function isStablecoin(tokenAddress: Address): boolean {
  const token = getTokenByAddress(tokenAddress);
  return token?.isStablecoin ?? false;
}

/**
 * Get all available tokens for group creation
 */
export function getAvailableTokens(): TokenInfo[] {
  return Object.values(BASE_TOKENS);
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: bigint, tokenAddress: Address): string {
  const token = getTokenByAddress(tokenAddress);
  if (!token) return "0";

  const divisor = BigInt(10 ** token.decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (fractionalPart === 0n) {
    return wholePart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(token.decimals, "0");
  const trimmedFractional = fractionalStr.replace(/0+$/, "");

  return `${wholePart}.${trimmedFractional}`;
}

/**
 * Parse token amount from string to bigint with proper decimals
 */
export function parseTokenAmount(amount: string, tokenAddress: Address): bigint {
  const token = getTokenByAddress(tokenAddress);
  if (!token) return 0n;

  const [wholePart, fractionalPart = ""] = amount.split(".");
  const paddedFractional = fractionalPart.padEnd(token.decimals, "0").slice(0, token.decimals);

  return BigInt(wholePart) * BigInt(10 ** token.decimals) + BigInt(paddedFractional);
}

/**
 * Get token symbol display
 */
export function getTokenSymbol(tokenAddress: Address): string {
  const token = getTokenByAddress(tokenAddress);
  return token?.symbol ?? "Unknown";
}

/**
 * Check if token is ETH (native currency)
 */
export function isNativeETH(tokenAddress: Address): boolean {
  return tokenAddress === "0x0000000000000000000000000000000000000000";
}
