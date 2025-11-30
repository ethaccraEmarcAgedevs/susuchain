"use client";

import { Chain } from "viem";
import { base, baseSepolia, optimism, optimismSepolia, mainnet } from "viem/chains";

interface ChainBadgeProps {
  chainId: number;
  showWarning?: boolean;
  size?: "sm" | "md" | "lg";
}

const chainConfig: Record<number, { name: string; color: string; isTestnet: boolean }> = {
  [base.id]: { name: "Base", color: "bg-blue-600 text-white", isTestnet: false },
  [baseSepolia.id]: { name: "Base Sepolia", color: "bg-blue-400 text-white", isTestnet: true },
  [optimism.id]: { name: "Optimism", color: "bg-red-600 text-white", isTestnet: false },
  [optimismSepolia.id]: { name: "OP Sepolia", color: "bg-red-400 text-white", isTestnet: true },
  [mainnet.id]: { name: "Ethereum", color: "bg-purple-600 text-white", isTestnet: false },
};

export const ChainBadge = ({ chainId, showWarning = true, size = "sm" }: ChainBadgeProps) => {
  const chain = chainConfig[chainId];

  if (!chain) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500 text-white">
        Unknown Chain
      </span>
    );
  }

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${chain.color} ${sizeClasses[size]}`}>
      <span className="w-2 h-2 rounded-full bg-white/30" />
      {chain.name}
      {showWarning && chain.isTestnet && (
        <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-yellow-900 rounded text-[10px] font-bold">
          TEST
        </span>
      )}
    </span>
  );
};

export const getChainInfo = (chainId: number) => {
  return chainConfig[chainId] || { name: "Unknown", color: "bg-gray-500", isTestnet: false };
};
