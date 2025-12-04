"use client";

import { base } from "viem/chains";
import { useChainId } from "wagmi";

/**
 * BaseNetworkBadge Component
 *
 * Displays a badge showing connection to Base Mainnet with branding
 * Shows warning if user is on wrong network
 */
export const BaseNetworkBadge = () => {
  const chainId = useChainId();
  const isBaseMainnet = chainId === base.id; // Base Mainnet only (8453)

  if (isBaseMainnet) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-blue-700">Base Mainnet</span>
      </div>
    );
  }

  // Show warning badge if on wrong network
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <span className="text-xs font-semibold text-red-700">Wrong Network</span>
    </div>
  );
};
