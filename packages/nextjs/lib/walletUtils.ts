/**
 * Wallet Utilities
 *
 * Helper functions for wallet detection, mobile deep links, and connection utilities
 */

/**
 * Check if the current device is a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if a wallet extension is installed in the browser
 */
export function hasWalletInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return window.ethereum !== undefined;
}

/**
 * Get mobile wallet deep link for a specific wallet
 * @param walletName - Name of the wallet (metamask, trust, rainbow, coinbase)
 * @returns Deep link URL to open the wallet app
 */
export function getMobileWalletDeepLink(walletName: string): string {
  if (typeof window === "undefined") return "";

  const currentUrl = window.location.href;
  const encodedUrl = encodeURIComponent(currentUrl);

  const deepLinks: Record<string, string> = {
    metamask: `https://metamask.app.link/dapp/${currentUrl}`,
    trust: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodedUrl}`,
    rainbow: `https://rainbow.me/${currentUrl}`,
    coinbase: `https://go.cb-w.com/dapp?cb_url=${encodedUrl}`,
  };

  return deepLinks[walletName.toLowerCase()] || currentUrl;
}

/**
 * Get wallet installation URL
 */
export function getWalletInstallUrl(walletName: string): string {
  const installUrls: Record<string, string> = {
    metamask: "https://metamask.io/download/",
    coinbase: "https://www.coinbase.com/wallet",
    trust: "https://trustwallet.com/download",
    rainbow: "https://rainbow.me/download",
    walletconnect: "https://walletconnect.com/",
  };

  return installUrls[walletName.toLowerCase()] || "https://ethereum.org/wallets";
}

/**
 * Check if the browser is compatible with Web3
 */
export function isWeb3Compatible(): boolean {
  if (typeof window === "undefined") return false;
  return "ethereum" in window || "web3" in window;
}

/**
 * Get user-friendly browser name
 */
export function getBrowserName(): string {
  if (typeof window === "undefined") return "Unknown";

  const userAgent = navigator.userAgent;

  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";

  return "Unknown";
}
