/**
 * Base-specific error codes and messages
 */
export enum BaseErrorCode {
  WRONG_NETWORK = "WRONG_NETWORK",
  INSUFFICIENT_GAS = "INSUFFICIENT_GAS",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  WALLET_NOT_CONNECTED = "WALLET_NOT_CONNECTED",
  UNSUPPORTED_WALLET = "UNSUPPORTED_WALLET",
  BRIDGE_PENDING = "BRIDGE_PENDING",
}

export const BASE_ERROR_MESSAGES: Record<BaseErrorCode, string> = {
  [BaseErrorCode.WRONG_NETWORK]:
    "Please switch to Base network. SusuChain only works on Base for optimal performance and low fees.",
  [BaseErrorCode.INSUFFICIENT_GAS]:
    "Insufficient ETH for gas fees on Base. You need a small amount of ETH to pay for transactions (~$0.01).",
  [BaseErrorCode.TRANSACTION_FAILED]:
    "Transaction failed on Base network. Please try again or contact support.",
  [BaseErrorCode.WALLET_NOT_CONNECTED]:
    "Please connect your wallet. We recommend Coinbase Wallet for the best Base experience.",
  [BaseErrorCode.UNSUPPORTED_WALLET]:
    "This wallet may not fully support Base. We recommend using Coinbase Wallet, MetaMask, or Rainbow.",
  [BaseErrorCode.BRIDGE_PENDING]:
    "You have a pending bridge transaction. Please wait for it to complete before starting a new one.",
};

/**
 * Get user-friendly error message for Base operations
 */
export function getBaseErrorMessage(error: any): string {
  // Check for specific error codes
  if (error.code === 4001) {
    return "Transaction rejected by user. Please try again when ready.";
  }

  if (error.code === -32603) {
    return BASE_ERROR_MESSAGES[BaseErrorCode.INSUFFICIENT_GAS];
  }

  // Check for wrong network
  if (error.message?.includes("chain") || error.message?.includes("network")) {
    return BASE_ERROR_MESSAGES[BaseErrorCode.WRONG_NETWORK];
  }

  // Check for gas issues
  if (error.message?.includes("gas") || error.message?.includes("funds")) {
    return BASE_ERROR_MESSAGES[BaseErrorCode.INSUFFICIENT_GAS];
  }

  // Default message
  return error.message || BASE_ERROR_MESSAGES[BaseErrorCode.TRANSACTION_FAILED];
}

/**
 * Format error for display
 */
export function formatBaseError(error: any): {
  title: string;
  message: string;
  action?: string;
} {
  const message = getBaseErrorMessage(error);

  if (message.includes("switch to Base")) {
    return {
      title: "Wrong Network",
      message,
      action: "Switch to Base",
    };
  }

  if (message.includes("Insufficient ETH")) {
    return {
      title: "Insufficient Gas",
      message,
      action: "Bridge ETH to Base",
    };
  }

  if (message.includes("rejected")) {
    return {
      title: "Transaction Rejected",
      message,
    };
  }

  return {
    title: "Error",
    message,
  };
}
