/**
 * AppKit/WalletConnect Error Parser
 * Provides comprehensive error handling for wallet connections
 */

export enum AppKitErrorType {
  USER_REJECTED = "USER_REJECTED",
  CHAIN_NOT_SUPPORTED = "CHAIN_NOT_SUPPORTED",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  QR_CODE_EXPIRED = "QR_CODE_EXPIRED",
  NETWORK_MISMATCH = "NETWORK_MISMATCH",
  UNKNOWN = "UNKNOWN",
}

export interface ParsedError {
  type: AppKitErrorType;
  message: string;
  userMessage: string;
  action: string;
  retryable: boolean;
  requiresUserAction: boolean;
  helpLink?: string;
}

/**
 * Parse AppKit/WalletConnect errors into structured format
 */
export function parseAppKitError(error: any): ParsedError {
  const errorMessage = error?.message?.toLowerCase() || "";
  const errorCode = error?.code;

  // USER_REJECTED - User denied connection
  if (
    errorCode === 4001 ||
    errorCode === "ACTION_REJECTED" ||
    errorMessage.includes("user rejected") ||
    errorMessage.includes("user denied") ||
    errorMessage.includes("rejected by user")
  ) {
    return {
      type: AppKitErrorType.USER_REJECTED,
      message: error.message || "User rejected connection",
      userMessage: "Connection request was declined",
      action: "Please approve the connection in your wallet to continue.",
      retryable: true,
      requiresUserAction: true,
      helpLink: "https://docs.walletconnect.com/web3modal/about",
    };
  }

  // CHAIN_NOT_SUPPORTED - Unsupported network
  if (
    errorCode === 4902 ||
    errorMessage.includes("unrecognized chain") ||
    errorMessage.includes("chain not supported") ||
    errorMessage.includes("unsupported chain")
  ) {
    return {
      type: AppKitErrorType.CHAIN_NOT_SUPPORTED,
      message: error.message || "Chain not supported",
      userMessage: "This network is not supported by your wallet",
      action: "Please add the Base network to your wallet or switch to a supported network.",
      retryable: true,
      requiresUserAction: true,
      helpLink: "https://docs.base.org/using-base/",
    };
  }

  // PROVIDER_ERROR - Wallet provider issues
  if (
    errorCode === -32603 ||
    errorCode === -32002 ||
    errorMessage.includes("provider") ||
    errorMessage.includes("no provider") ||
    errorMessage.includes("wallet not found")
  ) {
    return {
      type: AppKitErrorType.PROVIDER_ERROR,
      message: error.message || "Provider error",
      userMessage: "Unable to connect to your wallet",
      action: "Please make sure your wallet is installed and unlocked, then try again.",
      retryable: true,
      requiresUserAction: true,
      helpLink: "https://metamask.io/download/",
    };
  }

  // SESSION_EXPIRED - Connection timeout
  if (
    errorMessage.includes("session") ||
    errorMessage.includes("expired") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("timed out")
  ) {
    return {
      type: AppKitErrorType.SESSION_EXPIRED,
      message: error.message || "Session expired",
      userMessage: "Connection session has expired",
      action: "Your connection timed out. Please try connecting again.",
      retryable: true,
      requiresUserAction: false,
    };
  }

  // QR_CODE_EXPIRED - Mobile connection expiry
  if (errorMessage.includes("qr") || errorMessage.includes("qrcode") || errorMessage.includes("qr code")) {
    return {
      type: AppKitErrorType.QR_CODE_EXPIRED,
      message: error.message || "QR code expired",
      userMessage: "QR code has expired",
      action: "The QR code has expired. A new one will be generated automatically.",
      retryable: true,
      requiresUserAction: false,
    };
  }

  // NETWORK_MISMATCH - Wrong network selected
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("chain mismatch") ||
    errorMessage.includes("wrong network") ||
    errorMessage.includes("switch network")
  ) {
    return {
      type: AppKitErrorType.NETWORK_MISMATCH,
      message: error.message || "Network mismatch",
      userMessage: "You're connected to the wrong network",
      action: "Please switch to the Base network in your wallet.",
      retryable: true,
      requiresUserAction: true,
      helpLink: "https://docs.base.org/using-base/",
    };
  }

  // UNKNOWN - Fallback for unrecognized errors
  return {
    type: AppKitErrorType.UNKNOWN,
    message: error.message || "Unknown error occurred",
    userMessage: "Connection failed",
    action: "An unexpected error occurred. Please try again or contact support if the issue persists.",
    retryable: true,
    requiresUserAction: false,
  };
}

/**
 * Get wallet-specific help documentation
 */
export function getWalletHelpLink(walletName?: string): string {
  const walletLinks: Record<string, string> = {
    metamask: "https://support.metamask.io/",
    "coinbase wallet": "https://help.coinbase.com/en/wallet",
    walletconnect: "https://docs.walletconnect.com/",
    trust: "https://community.trustwallet.com/",
    rainbow: "https://learn.rainbow.me/",
  };

  const normalizedName = walletName?.toLowerCase() || "";
  return walletLinks[normalizedName] || "https://docs.walletconnect.com/";
}

/**
 * Calculate exponential backoff delay
 */
export function getExponentialBackoffDelay(attemptNumber: number, baseDelay = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attemptNumber - 1), 10000);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const parsed = parseAppKitError(error);
  return parsed.retryable && parsed.type !== AppKitErrorType.USER_REJECTED;
}

/**
 * Get user-friendly retry message
 */
export function getRetryMessage(attemptNumber: number, maxAttempts: number): string {
  const remaining = maxAttempts - attemptNumber;

  if (remaining === 0) {
    return "Maximum retry attempts reached. Please check your wallet settings and try again.";
  }

  if (remaining === 1) {
    return "Retrying one more time...";
  }

  return `Retrying... (${remaining} attempts remaining)`;
}
