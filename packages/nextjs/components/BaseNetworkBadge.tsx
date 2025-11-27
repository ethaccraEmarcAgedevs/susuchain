"use client";

import { useChainId } from "wagmi";
import { baseSepolia } from "viem/chains";

/**
 * BaseNetworkBadge Component
 *
 * Displays a badge showing connection to Base network with branding
 */
export const BaseNetworkBadge = () => {
  const chainId = useChainId();
  const isBase = chainId === baseSepolia.id || chainId === 8453; // Base Sepolia or Base Mainnet

  if (!isBase) return null;

  const networkName = chainId === 8453 ? "Base" : "Base Sepolia";

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <span className="text-xs font-semibold text-blue-700">{networkName}</span>
    </div>
  );
};
