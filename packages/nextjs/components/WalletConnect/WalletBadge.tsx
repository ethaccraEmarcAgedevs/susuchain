"use client";

import { WalletIcon } from "./WalletIcon";
import { getConnectionMethodLabel, getWalletMetadata } from "~~/utils/wallet-metadata";

interface WalletBadgeProps {
  walletName: string;
  address?: string;
  showAddress?: boolean;
  showConnectionType?: boolean;
  connectionType?: "injected" | "walletconnect";
  isMobile?: boolean;
  variant?: "default" | "compact" | "full";
}

const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const WalletBadge = ({
  walletName,
  address,
  showAddress = false,
  showConnectionType = false,
  connectionType = "injected",
  isMobile = false,
  variant = "default",
}: WalletBadgeProps) => {
  const wallet = getWalletMetadata(walletName);

  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
        <WalletIcon walletName={walletName} size="sm" showBackground={false} />
        <span className="text-sm font-medium text-gray-900">{wallet.name}</span>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="inline-flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
        <WalletIcon walletName={walletName} size="md" showBackground={true} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{wallet.name}</span>
          {showAddress && address && <span className="text-xs text-gray-500 font-mono">{formatAddress(address)}</span>}
          {showConnectionType && (
            <span className="text-xs text-gray-400">{getConnectionMethodLabel(connectionType, isMobile)}</span>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
      <WalletIcon walletName={walletName} size="sm" showBackground={true} />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{wallet.name}</span>
        {showAddress && address && <span className="text-xs text-gray-500 font-mono">{formatAddress(address)}</span>}
      </div>
    </div>
  );
};
