import { base, baseSepolia } from "viem/chains";

/**
 * Base faucet URLs
 */
export const BASE_FAUCETS = {
  [baseSepolia.id]: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet",
  ALTERNATIVE: "https://faucet.quicknode.com/base/sepolia",
} as const;

/**
 * Get faucet URL for current Base network
 */
export function getBaseFaucetUrl(chainId: number): string | null {
  if (chainId === baseSepolia.id) {
    return BASE_FAUCETS[baseSepolia.id];
  }

  // No faucet for mainnet
  if (chainId === base.id) {
    return null;
  }

  return null;
}

/**
 * Check if faucet is available for chain
 */
export function isFaucetAvailable(chainId: number): boolean {
  return chainId === baseSepolia.id;
}
