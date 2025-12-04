/**
 * Wallet Deep Link Utilities
 * Provides deep linking functionality for mobile wallets
 */

export interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  deepLinkScheme: string;
  universalLink: string;
  downloadUrl: {
    ios: string;
    android: string;
  };
}

export const SUPPORTED_WALLETS: Record<string, WalletInfo> = {
  metamask: {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    deepLinkScheme: "metamask://",
    universalLink: "https://metamask.app.link",
    downloadUrl: {
      ios: "https://apps.apple.com/app/metamask/id1438144202",
      android: "https://play.google.com/store/apps/details?id=io.metamask",
    },
  },
  trust: {
    id: "trust",
    name: "Trust Wallet",
    icon: "⚡",
    deepLinkScheme: "trust://",
    universalLink: "https://link.trustwallet.com",
    downloadUrl: {
      ios: "https://apps.apple.com/app/trust-wallet/id1288339409",
      android: "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp",
    },
  },
  rainbow: {
    id: "rainbow",
    name: "Rainbow",
    icon: "🌈",
    deepLinkScheme: "rainbow://",
    universalLink: "https://rnbwapp.com",
    downloadUrl: {
      ios: "https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021",
      android: "https://play.google.com/store/apps/details?id=me.rainbow",
    },
  },
  coinbase: {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "💼",
    deepLinkScheme: "cbwallet://",
    universalLink: "https://go.cb-w.com",
    downloadUrl: {
      ios: "https://apps.apple.com/app/coinbase-wallet/id1278383455",
      android: "https://play.google.com/store/apps/details?id=org.toshi",
    },
  },
  zerion: {
    id: "zerion",
    name: "Zerion",
    icon: "💎",
    deepLinkScheme: "zerion://",
    universalLink: "https://wallet.zerion.io",
    downloadUrl: {
      ios: "https://apps.apple.com/app/zerion-wallet-nft/id1456732565",
      android: "https://play.google.com/store/apps/details?id=io.zerion.android",
    },
  },
  safe: {
    id: "safe",
    name: "Safe",
    icon: "🔐",
    deepLinkScheme: "safe://",
    universalLink: "https://app.safe.global",
    downloadUrl: {
      ios: "https://apps.apple.com/app/safe-smart-account/id1515759131",
      android: "https://play.google.com/store/apps/details?id=io.gnosis.safe",
    },
  },
};

/**
 * Generate WalletConnect deep link for a specific wallet
 */
export function generateWalletDeepLink(walletId: string, wcUri: string, bridge?: string): string {
  const wallet = SUPPORTED_WALLETS[walletId];
  if (!wallet) {
    throw new Error(`Unsupported wallet: ${walletId}`);
  }

  const encodedWcUri = encodeURIComponent(wcUri);

  // Use universal link with WalletConnect URI
  return `${wallet.universalLink}/wc?uri=${encodedWcUri}`;
}

/**
 * Generate transaction deep link for a specific wallet
 */
export function generateTransactionDeepLink(
  walletId: string,
  chainId: number,
  to: string,
  data?: string,
  value?: string,
): string {
  const wallet = SUPPORTED_WALLETS[walletId];
  if (!wallet) {
    throw new Error(`Unsupported wallet: ${walletId}`);
  }

  const params = new URLSearchParams({
    chainId: chainId.toString(),
    to,
    ...(data && { data }),
    ...(value && { value }),
  });

  return `${wallet.deepLinkScheme}send?${params.toString()}`;
}

/**
 * Get download URL for wallet based on platform
 */
export function getWalletDownloadUrl(walletId: string, platform: "ios" | "android"): string {
  const wallet = SUPPORTED_WALLETS[walletId];
  if (!wallet) {
    throw new Error(`Unsupported wallet: ${walletId}`);
  }

  return wallet.downloadUrl[platform];
}

/**
 * Check if wallet is installed (basic detection)
 */
export function isWalletInstalled(walletId: string): boolean {
  if (typeof window === "undefined") return false;

  const wallet = SUPPORTED_WALLETS[walletId];
  if (!wallet) return false;

  // Basic detection - check for injected provider
  switch (walletId) {
    case "metamask":
      return !!(window as any).ethereum?.isMetaMask;
    case "trust":
      return !!(window as any).ethereum?.isTrust;
    case "coinbase":
      return !!(window as any).ethereum?.isCoinbaseWallet;
    default:
      return false;
  }
}

/**
 * Open wallet deep link with fallback to download
 */
export function openWalletDeepLink(walletId: string, deepLink: string, platform: "ios" | "android") {
  if (typeof window === "undefined") return;

  // Try to open the deep link
  window.location.href = deepLink;

  // Set a timeout to redirect to download if app didn't open
  setTimeout(() => {
    const downloadUrl = getWalletDownloadUrl(walletId, platform);
    window.location.href = downloadUrl;
  }, 2500);
}

/**
 * Get popular wallets in recommended order
 */
export function getPopularWallets(): WalletInfo[] {
  return [SUPPORTED_WALLETS.metamask, SUPPORTED_WALLETS.coinbase, SUPPORTED_WALLETS.trust, SUPPORTED_WALLETS.rainbow];
}
