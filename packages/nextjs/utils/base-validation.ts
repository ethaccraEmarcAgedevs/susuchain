import { base, baseSepolia } from "viem/chains";

/**
 * Base network chain IDs
 */
export const BASE_CHAIN_IDS = {
  MAINNET: base.id, // 8453
  SEPOLIA: baseSepolia.id, // 84532
} as const;

/**
 * Check if chain ID is a valid Base network
 */
export function isBaseNetwork(chainId: number): boolean {
  return chainId === BASE_CHAIN_IDS.MAINNET || chainId === BASE_CHAIN_IDS.SEPOLIA;
}

/**
 * Check if chain ID is Base mainnet specifically
 */
export function isBaseMainnet(chainId: number): boolean {
  return chainId === BASE_CHAIN_IDS.MAINNET;
}

/**
 * Check if chain ID is Base Sepolia testnet
 */
export function isBaseSepolia(chainId: number): boolean {
  return chainId === BASE_CHAIN_IDS.SEPOLIA;
}

/**
 * Get Base network name from chain ID
 */
export function getBaseNetworkName(chainId: number): string {
  switch (chainId) {
    case BASE_CHAIN_IDS.MAINNET:
      return "Base Mainnet";
    case BASE_CHAIN_IDS.SEPOLIA:
      return "Base Sepolia";
    default:
      return "Unknown Base Network";
  }
}

/**
 * Validate that user is on a Base network, throw error if not
 */
export function validateBaseNetwork(chainId: number): void {
  if (!isBaseNetwork(chainId)) {
    throw new Error(
      `Invalid network. SusuChain only supports Base networks. Please switch to Base Mainnet (Chain ID: ${BASE_CHAIN_IDS.MAINNET})`,
    );
  }
}

/**
 * Get Base block explorer URL for chain ID
 */
export function getBaseBlockExplorer(chainId: number): string {
  if (chainId === BASE_CHAIN_IDS.MAINNET) {
    return "https://basescan.org";
  }
  if (chainId === BASE_CHAIN_IDS.SEPOLIA) {
    return "https://sepolia.basescan.org";
  }
  return "https://basescan.org"; // Default to mainnet
}

/**
 * Get Base RPC URL for chain ID
 */
export function getBaseRpcUrl(chainId: number): string {
  if (chainId === BASE_CHAIN_IDS.MAINNET) {
    return "https://mainnet.base.org";
  }
  if (chainId === BASE_CHAIN_IDS.SEPOLIA) {
    return "https://sepolia.base.org";
  }
  return "https://mainnet.base.org"; // Default to mainnet
}
