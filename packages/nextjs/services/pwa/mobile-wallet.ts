/**
 * Mobile wallet connection utilities optimized for Base network
 */

/**
 * Check if running in mobile browser
 */
export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

/**
 * Check if running in Coinbase Wallet in-app browser
 */
export function isInCoinbaseWallet(): boolean {
  if (typeof window === 'undefined') return false;

  return !!(window as any).coinbaseWalletExtension || !!(window as any).ethereum?.isCoinbaseWallet;
}

/**
 * Check if running in MetaMask mobile browser
 */
export function isInMetaMaskMobile(): boolean {
  if (typeof window === 'undefined') return false;

  return !!(window as any).ethereum?.isMetaMask && isMobileBrowser();
}

/**
 * Get deep link for Coinbase Wallet
 */
export function getCoinbaseWalletDeepLink(dappUrl: string): string {
  const encodedUrl = encodeURIComponent(dappUrl);
  return `https://go.cb-w.com/dapp?cb_url=${encodedUrl}`;
}

/**
 * Get deep link for MetaMask mobile
 */
export function getMetaMaskDeepLink(dappUrl: string): string {
  const encodedUrl = encodeURIComponent(dappUrl);
  return `https://metamask.app.link/dapp/${encodedUrl}`;
}

/**
 * Get WalletConnect mobile deep link
 */
export function getWalletConnectDeepLink(uri: string, walletName: string): string {
  const encodedUri = encodeURIComponent(uri);

  switch (walletName.toLowerCase()) {
    case 'coinbase':
      return `https://go.cb-w.com/wc?uri=${encodedUri}`;
    case 'metamask':
      return `https://metamask.app.link/wc?uri=${encodedUri}`;
    case 'trust':
      return `https://link.trustwallet.com/wc?uri=${encodedUri}`;
    case 'rainbow':
      return `https://rnbwapp.com/wc?uri=${encodedUri}`;
    default:
      return `wc:${uri}`;
  }
}

/**
 * Detect available wallet apps on device
 */
export function detectAvailableWallets(): string[] {
  const wallets: string[] = [];

  if (typeof window === 'undefined') return wallets;

  const ethereum = (window as any).ethereum;

  if (ethereum) {
    if (ethereum.isCoinbaseWallet) wallets.push('Coinbase Wallet');
    if (ethereum.isMetaMask) wallets.push('MetaMask');
    if (ethereum.isTrust) wallets.push('Trust Wallet');
    if (ethereum.isRainbow) wallets.push('Rainbow');
  }

  return wallets;
}

/**
 * Open wallet app via deep link
 */
export function openWalletApp(walletName: string, dappUrl?: string): void {
  const url = dappUrl || window.location.href;

  let deepLink: string;

  switch (walletName.toLowerCase()) {
    case 'coinbase':
    case 'coinbase wallet':
      deepLink = getCoinbaseWalletDeepLink(url);
      break;
    case 'metamask':
      deepLink = getMetaMaskDeepLink(url);
      break;
    default:
      console.error('Unknown wallet:', walletName);
      return;
  }

  window.location.href = deepLink;
}

/**
 * Check if wallet app is installed (Android only)
 */
export async function isWalletAppInstalled(packageName: string): Promise<boolean> {
  if (!isMobileBrowser()) return false;

  try {
    // This only works on Android with proper permissions
    const response = await fetch(`intent://${packageName}#Intent;end`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get recommended wallet for mobile
 */
export function getRecommendedMobileWallet(): string {
  if (isInCoinbaseWallet()) return 'Coinbase Wallet';
  if (isInMetaMaskMobile()) return 'MetaMask';

  // Recommend Coinbase Wallet for Base network
  return 'Coinbase Wallet';
}

/**
 * Generate QR code data for WalletConnect
 */
export function generateWalletConnectQR(uri: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uri)}`;
}

/**
 * Check if should show QR code (desktop) or deep link (mobile)
 */
export function shouldShowQRCode(): boolean {
  return !isMobileBrowser();
}

/**
 * Handle wallet connection for mobile
 */
export function handleMobileWalletConnection(walletName: string, wcUri?: string): void {
  if (isMobileBrowser()) {
    if (wcUri) {
      // WalletConnect flow
      const deepLink = getWalletConnectDeepLink(wcUri, walletName);
      window.location.href = deepLink;
    } else {
      // Direct connection flow
      openWalletApp(walletName);
    }
  }
}

/**
 * Add haptic feedback (if supported)
 */
export function addHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };

    navigator.vibrate(patterns[type]);
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Check if running as PWA (installed)
 */
export function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Get device info
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined') return null;

  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);

  return {
    isIOS,
    isAndroid,
    isMobile: isMobileBrowser(),
    isPWA: isRunningAsPWA(),
    userAgent,
  };
}
