"use client";

import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { WalletIcon } from "./WalletIcon";
import { getWalletMetadata } from "~~/utils/wallet-metadata";

interface MobileWalletBadgeProps {
  walletName: string;
  address?: string;
  showAddress?: boolean;
  showMobileIndicator?: boolean;
}

const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const MobileWalletBadge = ({
  walletName,
  address,
  showAddress = true,
  showMobileIndicator = true,
}: MobileWalletBadgeProps) => {
  const wallet = getWalletMetadata(walletName);

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
      <div className="relative">
        <WalletIcon walletName={walletName} size="md" showBackground={true} />
        {showMobileIndicator && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
            <DevicePhoneMobileIcon className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{wallet.name}</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
            Mobile
          </span>
        </div>
        {showAddress && address && (
          <span className="text-xs text-gray-600 font-mono">{formatAddress(address)}</span>
        )}
        <span className="text-xs text-blue-600 font-medium">WalletConnect</span>
      </div>
    </div>
  );
};
