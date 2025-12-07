import { Address, createPublicClient, http, namehash, normalize } from "viem";
import { base } from "viem/chains";

/**
 * Base Names Integration
 * Replaces ENS with Base L2 naming service (.base.eth)
 */

// Base Names Registry Contract on Base Mainnet
export const BASENAMES_REGISTRY_ADDRESS = "0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a" as Address;

// Create Base public client for name resolution
const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

export interface BasenameProfile {
  name: string;
  address: Address;
  avatar?: string;
  description?: string;
  twitter?: string;
  github?: string;
  website?: string;
}

/**
 * Check if a name is a valid Base Name format
 */
export const isValidBaseName = (name: string): boolean => {
  try {
    if (!name || typeof name !== "string") return false;

    // Must end with .base.eth or .eth
    if (!name.endsWith(".base.eth") && !name.endsWith(".eth")) return false;

    // Remove the TLD for validation
    const label = name.replace(".base.eth", "").replace(".eth", "");

    // Must be lowercase alphanumeric with hyphens
    return /^[a-z0-9-]+$/.test(label) && label.length >= 3 && label.length <= 63;
  } catch (error) {
    console.error("Base Name validation error:", error);
    return false;
  }
};

/**
 * Generate a Base Name suggestion for groups
 */
export const generateGroupBaseName = (groupName: string): string => {
  const cleaned = groupName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

  const date = new Date();
  const monthYear = `${date.toLocaleString("en", { month: "short" }).toLowerCase()}-${date.getFullYear()}`;

  return `${cleaned}-${monthYear}.base.eth`;
};

/**
 * Resolve Base Name to address
 */
export async function resolveBaseName(name: string): Promise<Address | null> {
  try {
    if (!isValidBaseName(name)) {
      return null;
    }

    // Normalize the name
    const normalizedName = normalize(name);
    const nameHash = namehash(normalizedName);

    // In production, query Base Names resolver contract
    // For now, return null (would implement actual resolution)
    console.log("Resolving Base Name:", normalizedName, "Hash:", nameHash);

    return null;
  } catch (error) {
    console.error("Base Name resolution error:", error);
    return null;
  }
}

/**
 * Reverse resolve address to Base Name
 */
export async function getBaseName(address: Address): Promise<string | null> {
  try {
    // In production, query Base Names reverse resolver
    // This would call the L2 resolver contract on Base

    console.log("Fetching Base Name for address:", address);

    // Mock implementation - would be replaced with actual contract call
    return null;
  } catch (error) {
    console.error("Base Name reverse resolution error:", error);
    return null;
  }
}

/**
 * Check if a Base Name is available for registration
 */
export async function checkBasenameAvailability(name: string): Promise<boolean> {
  try {
    if (!isValidBaseName(name)) {
      return false;
    }

    // In production, query Base Names registrar contract
    const address = await resolveBaseName(name);

    // If it resolves to an address, it's taken
    return address === null;
  } catch (error) {
    console.error("Base Name availability check error:", error);
    return false;
  }
}

/**
 * Get Base Name profile data
 */
export async function getBasenameProfile(nameOrAddress: string): Promise<BasenameProfile | null> {
  try {
    let address: Address | null = null;
    let name: string | null = null;

    // Check if input is an address or name
    if (nameOrAddress.startsWith("0x")) {
      address = nameOrAddress as Address;
      name = await getBaseName(address);
    } else {
      name = nameOrAddress;
      address = await resolveBaseName(name);
    }

    if (!address || !name) {
      return null;
    }

    // In production, fetch additional profile data from Base Names metadata
    return {
      name,
      address,
      avatar: undefined,
      description: undefined,
      twitter: undefined,
      github: undefined,
      website: undefined,
    };
  } catch (error) {
    console.error("Base Name profile fetch error:", error);
    return null;
  }
}

/**
 * Get avatar URL from Base Name
 */
export async function getBasenameAvatar(name: string): Promise<string | null> {
  try {
    // In production, fetch from Base Names NFT metadata
    // Base Names are ERC-721 NFTs with metadata
    return null;
  } catch (error) {
    console.error("Base Name avatar fetch error:", error);
    return null;
  }
}

/**
 * Format address with basename if available
 */
export async function formatAddressWithBasename(address: Address): Promise<string> {
  const basename = await getBaseName(address);

  if (basename) {
    return basename;
  }

  // Fallback to shortened address
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Generate subname for group member
 */
export const generateMemberSubname = (memberIndex: number, groupBasename: string): string => {
  const groupName = groupBasename.replace(".base.eth", "").replace(".eth", "");
  return `member${memberIndex}.${groupName}.base.eth`;
};
