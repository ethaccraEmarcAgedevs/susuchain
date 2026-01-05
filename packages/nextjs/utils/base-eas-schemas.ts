/**
 * Base-specific EAS Schema UIDs and Configuration
 * Official schemas registered on Base for SusuChain
 */

export const BASE_EAS_EXPLORER = "https://base.easscan.org";
export const BASE_SEPOLIA_EAS_EXPLORER = "https://base-sepolia.easscan.org";

/**
 * Production schema UIDs on Base mainnet
 * These should be populated after registering schemas
 */
export const BASE_SCHEMA_UIDS = {
  CONTRIBUTION: process.env.NEXT_PUBLIC_CONTRIBUTION_SCHEMA_UID || "",
  VOUCH: process.env.NEXT_PUBLIC_VOUCH_SCHEMA_UID || "",
  GROUP_COMPLETION: process.env.NEXT_PUBLIC_GROUP_COMPLETION_SCHEMA_UID || "",
  RELIABILITY: process.env.NEXT_PUBLIC_RELIABILITY_SCHEMA_UID || "",
} as const;

/**
 * Testnet schema UIDs on Base Sepolia
 */
export const BASE_SEPOLIA_SCHEMA_UIDS = {
  CONTRIBUTION: process.env.NEXT_PUBLIC_SEPOLIA_CONTRIBUTION_SCHEMA_UID || "",
  VOUCH: process.env.NEXT_PUBLIC_SEPOLIA_VOUCH_SCHEMA_UID || "",
  GROUP_COMPLETION: process.env.NEXT_PUBLIC_SEPOLIA_GROUP_COMPLETION_SCHEMA_UID || "",
  RELIABILITY: process.env.NEXT_PUBLIC_SEPOLIA_RELIABILITY_SCHEMA_UID || "",
} as const;

/**
 * Get schema UID for current network
 */
export function getSchemaUID(schemaType: keyof typeof BASE_SCHEMA_UIDS, chainId: number): string {
  if (chainId === 8453) {
    return BASE_SCHEMA_UIDS[schemaType];
  } else if (chainId === 84532) {
    return BASE_SEPOLIA_SCHEMA_UIDS[schemaType];
  }
  return "";
}

/**
 * Get EAS explorer URL for attestation
 */
export function getEASExplorerUrl(attestationUID: string, chainId: number): string {
  const baseUrl = chainId === 8453 ? BASE_EAS_EXPLORER : BASE_SEPOLIA_EAS_EXPLORER;
  return `${baseUrl}/attestation/view/${attestationUID}`;
}

/**
 * Get EAS explorer URL for schema
 */
export function getSchemaExplorerUrl(schemaUID: string, chainId: number): string {
  const baseUrl = chainId === 8453 ? BASE_EAS_EXPLORER : BASE_SEPOLIA_EAS_EXPLORER;
  return `${baseUrl}/schema/view/${schemaUID}`;
}

/**
 * Get EAS explorer URL for address
 */
export function getAddressEASExplorerUrl(address: string, chainId: number): string {
  const baseUrl = chainId === 8453 ? BASE_EAS_EXPLORER : BASE_SEPOLIA_EAS_EXPLORER;
  return `${baseUrl}/address/${address}`;
}

/**
 * Base-specific schema documentation
 */
export const BASE_SCHEMA_DOCS = {
  CONTRIBUTION: {
    name: "Susu Contribution",
    description: "On-time contribution attestation for Susu group rounds on Base",
    useCase: "Build reputation by consistently making on-time contributions",
    benefits: ["Portable reputation across Base ecosystem", "Proof of financial reliability", "Used in credit scoring"],
  },
  VOUCH: {
    name: "Community Vouch",
    description: "Trust endorsement from community member on Base",
    useCase: "Vouch for trusted members to help them join groups",
    benefits: ["Build trust network on Base", "Help onboard new members", "Strengthen community bonds"],
  },
  GROUP_COMPLETION: {
    name: "Group Cycle Completion",
    description: "Attestation for completing full Susu group cycle on Base",
    useCase: "Earn badges for completing savings cycles",
    benefits: ["Unlock higher contribution limits", "Qualify for premium groups", "NFT membership upgrades"],
  },
  RELIABILITY: {
    name: "Payment Reliability Score",
    description: "Calculated reliability score (0-100) based on Base history",
    useCase: "Automated score calculated from contribution patterns",
    benefits: ["Algorithmic trust measurement", "Portable across Base DeFi", "Used by other Base apps"],
  },
} as const;

/**
 * Check if schemas are configured for network
 */
export function areSchemasConfigured(chainId: number): boolean {
  const schemas = chainId === 8453 ? BASE_SCHEMA_UIDS : BASE_SEPOLIA_SCHEMA_UIDS;
  return Object.values(schemas).every(uid => uid !== "");
}
