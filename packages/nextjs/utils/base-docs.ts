/**
 * Base Documentation and Resource Links
 */

export const BASE_DOCS = {
  // Main documentation
  HOME: "https://docs.base.org",
  GETTING_STARTED: "https://docs.base.org/getting-started",

  // Developer guides
  BUILD: "https://docs.base.org/building-with-base",
  SMART_CONTRACTS: "https://docs.base.org/contracts/overview",
  DEPLOYING: "https://docs.base.org/contracts/deploying-contracts",
  TOOLS: "https://docs.base.org/tools/overview",

  // Network info
  NETWORK_INFO: "https://docs.base.org/network-information",
  CHAIN_IDS: "https://docs.base.org/network-information#base-mainnet",
  RPC_URLS: "https://docs.base.org/network-information#rpc-endpoints",

  // Base features
  SMART_WALLET: "https://docs.base.org/tools/account-abstraction",
  GASLESS_TRANSACTIONS: "https://docs.base.org/tools/paymasters",
  BASENAMES: "https://docs.base.org/base-names",
  BRIDGE: "https://docs.base.org/using-base#bridging-to-base",

  // Security
  SECURITY: "https://docs.base.org/security/best-practices",
  AUDITS: "https://docs.base.org/security/audits",

  // Ecosystem
  ECOSYSTEM: "https://base.org/ecosystem",
  GRANTS: "https://paragraph.xyz/@grants.base.eth/calling-based-builders",
  ONCHAINSUMMER: "https://onchainsummer.xyz",
} as const;

export const BASE_LINKS = {
  WEBSITE: "https://base.org",
  TWITTER: "https://twitter.com/base",
  DISCORD: "https://discord.gg/buildonbase",
  GITHUB: "https://github.com/base-org",
  STATUS: "https://status.base.org",
  BLOG: "https://base.mirror.xyz",
  FARCASTER: "https://warpcast.com/base",
} as const;

export const BASE_TOOLS = {
  BRIDGE: "https://bridge.base.org",
  BASESCAN: "https://basescan.org",
  BASESCAN_TESTNET: "https://sepolia.basescan.org",
  FAUCET: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet",
  WALLET: "https://www.coinbase.com/wallet",
} as const;

/**
 * Get help URL for specific topic
 */
export function getBaseHelpUrl(topic: keyof typeof BASE_DOCS): string {
  return BASE_DOCS[topic];
}

/**
 * Get explorer URL for address/tx
 */
export function getBaseScanUrl(
  hashOrAddress: string,
  type: "tx" | "address" | "token" | "block" = "address",
  isTestnet = false,
): string {
  const baseUrl = isTestnet ? BASE_TOOLS.BASESCAN_TESTNET : BASE_TOOLS.BASESCAN;
  return `${baseUrl}/${type}/${hashOrAddress}`;
}

/**
 * Open Base docs in new tab
 */
export function openBaseDocs(topic?: keyof typeof BASE_DOCS): void {
  const url = topic ? BASE_DOCS[topic] : BASE_DOCS.HOME;
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Get support resources
 */
export function getBaseSupportLinks() {
  return {
    documentation: BASE_DOCS.HOME,
    discord: BASE_LINKS.DISCORD,
    twitter: BASE_LINKS.TWITTER,
    status: BASE_LINKS.STATUS,
    github: BASE_LINKS.GITHUB,
  };
}
