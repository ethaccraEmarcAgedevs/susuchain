/**
 * Wallet Metadata Utilities
 * Provides wallet information, logos, and metadata
 */

export interface WalletMetadata {
  id: string;
  name: string;
  icon: string;
  color: string;
  supportUrl: string;
  connectionType: "injected" | "walletconnect";
}

export const WALLET_METADATA: Record<string, WalletMetadata> = {
  metamask: {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    color: "#F6851B",
    supportUrl: "https://support.metamask.io/",
    connectionType: "injected",
  },
  "coinbase wallet": {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "💼",
    color: "#0052FF",
    supportUrl: "https://help.coinbase.com/en/wallet",
    connectionType: "injected",
  },
  "trust wallet": {
    id: "trust",
    name: "Trust Wallet",
    icon: "⚡",
    color: "#3375BB",
    supportUrl: "https://community.trustwallet.com/",
    connectionType: "walletconnect",
  },
  rainbow: {
    id: "rainbow",
    name: "Rainbow",
    icon: "🌈",
    color: "#FF6B6B",
    supportUrl: "https://learn.rainbow.me/",
    connectionType: "walletconnect",
  },
  walletconnect: {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
    color: "#3B99FC",
    supportUrl: "https://docs.walletconnect.com/",
    connectionType: "walletconnect",
  },
  zerion: {
    id: "zerion",
    name: "Zerion",
    icon: "💎",
    color: "#2962EF",
    supportUrl: "https://zerion.io/support",
    connectionType: "walletconnect",
  },
  safe: {
    id: "safe",
    name: "Safe",
    icon: "🔐",
    color: "#12FF80",
    supportUrl: "https://help.safe.global/",
    connectionType: "injected",
  },
  brave: {
    id: "brave",
    name: "Brave Wallet",
    icon: "🦁",
    color: "#FB542B",
    supportUrl: "https://support.brave.com/hc/en-us/categories/360001059151-Brave-Wallet",
    connectionType: "injected",
  },
};

/**
 * Detect wallet from browser provider
 */
export function detectWalletFromProvider(): WalletMetadata | null {
  if (typeof window === "undefined") return null;

  const ethereum = (window as any).ethereum;
  if (!ethereum) return null;

  // Check for specific wallet providers
  if (ethereum.isMetaMask) return WALLET_METADATA.metamask;
  if (ethereum.isCoinbaseWallet) return WALLET_METADATA["coinbase wallet"];
  if (ethereum.isTrust) return WALLET_METADATA["trust wallet"];
  if (ethereum.isBraveWallet) return WALLET_METADATA.brave;
  if (ethereum.isSafe) return WALLET_METADATA.safe;

  return null;
}

/**
 * Get wallet metadata by wallet name or ID
 */
export function getWalletMetadata(walletNameOrId: string): WalletMetadata {
  const normalizedKey = walletNameOrId.toLowerCase();

  // Direct match
  if (WALLET_METADATA[normalizedKey]) {
    return WALLET_METADATA[normalizedKey];
  }

  // Search by name
  const byName = Object.values(WALLET_METADATA).find(
    wallet => wallet.name.toLowerCase() === normalizedKey
  );
  if (byName) return byName;

  // Search by ID
  const byId = Object.values(WALLET_METADATA).find(
    wallet => wallet.id === normalizedKey
  );
  if (byId) return byId;

  // Default to WalletConnect
  return WALLET_METADATA.walletconnect;
}

/**
 * Check if wallet is mobile WalletConnect
 */
export function isMobileWalletConnect(connector?: any): boolean {
  if (!connector) return false;

  // Check if it's a WalletConnect connector
  const isWC = connector.type === "walletConnect" || connector.name?.toLowerCase().includes("walletconnect");

  // Check if user agent is mobile
  if (typeof window === "undefined") return false;
  const isMobile = /Mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return isWC && isMobile;
}

/**
 * Get connection method label
 */
export function getConnectionMethodLabel(connectionType: "injected" | "walletconnect", isMobile?: boolean): string {
  if (connectionType === "walletconnect") {
    return isMobile ? "Mobile WalletConnect" : "WalletConnect";
  }
  return "Browser Extension";
}

/**
 * Get wallet color with opacity
 */
export function getWalletColorWithOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
