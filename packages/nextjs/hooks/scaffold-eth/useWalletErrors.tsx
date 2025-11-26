"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Hook for handling wallet connection errors with user-friendly messages
 */
export function useWalletErrors() {
  const handleWalletError = (error: any) => {
    const errorInfo = parseWalletError(error);

    toast.error(
      <div className="text-sm">
        <p className="font-semibold mb-1">{errorInfo.message}</p>
        <p className="text-xs opacity-90">{errorInfo.action}</p>
      </div>,
      {
        duration: 5000,
        position: "top-right",
      },
    );
  };

  return { handleWalletError };
}

interface ErrorInfo {
  message: string;
  action: string;
  code?: string | number;
}

/**
 * Parse wallet errors into user-friendly messages
 */
function parseWalletError(error: any): ErrorInfo {
  // User rejected the connection
  if (error.code === 4001 || error.code === "ACTION_REJECTED") {
    return {
      message: "Connection Rejected",
      action: "Please approve the connection request in your wallet.",
      code: 4001,
    };
  }

  // Pending request already exists
  if (error.code === -32002) {
    return {
      message: "Connection Request Pending",
      action: "Check your wallet for a pending connection request.",
      code: -32002,
    };
  }

  // Network/RPC errors
  if (error.message?.toLowerCase().includes("network") || error.message?.toLowerCase().includes("fetch")) {
    return {
      message: "Network Connection Failed",
      action: "Check your internet connection and try again.",
    };
  }

  // RPC errors
  if (error.message?.toLowerCase().includes("rpc") || error.code === -32603) {
    return {
      message: "RPC Connection Failed",
      action: "The network is experiencing issues. Please try again later.",
      code: -32603,
    };
  }

  // Chain not added to wallet
  if (error.code === 4902 || error.message?.toLowerCase().includes("unrecognized chain")) {
    return {
      message: "Network Not Added",
      action: "Please add the network to your wallet and try again.",
      code: 4902,
    };
  }

  // Wallet locked
  if (error.message?.toLowerCase().includes("locked") || error.message?.toLowerCase().includes("unlock")) {
    return {
      message: "Wallet Locked",
      action: "Please unlock your wallet and try again.",
    };
  }

  // Insufficient funds for gas
  if (error.message?.toLowerCase().includes("insufficient funds")) {
    return {
      message: "Insufficient Funds",
      action: "You need ETH to pay for transaction gas fees.",
    };
  }

  // Wallet not found/installed
  if (error.message?.toLowerCase().includes("not found") || error.message?.toLowerCase().includes("no provider")) {
    return {
      message: "Wallet Not Detected",
      action: "Please install a Web3 wallet like MetaMask to continue.",
    };
  }

  // User denied account access
  if (error.message?.toLowerCase().includes("denied") || error.message?.toLowerCase().includes("permission")) {
    return {
      message: "Access Denied",
      action: "Please grant permission to connect your wallet.",
    };
  }

  // Timeout errors
  if (error.message?.toLowerCase().includes("timeout")) {
    return {
      message: "Connection Timeout",
      action: "The request took too long. Please try again.",
    };
  }

  // Generic fallback
  return {
    message: "Connection Failed",
    action: "Please try connecting again or use a different wallet.",
  };
}

/**
 * Get retry-friendly error message
 */
export function getRetryMessage(attemptNumber: number, maxAttempts: number): string {
  const remaining = maxAttempts - attemptNumber;

  if (remaining === 0) {
    return "Maximum retry attempts reached. Please check your wallet and network settings.";
  }

  return `Connection failed. ${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining.`;
}
