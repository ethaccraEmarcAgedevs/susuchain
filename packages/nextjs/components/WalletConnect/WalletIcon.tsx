"use client";

import { getWalletMetadata, getWalletColorWithOpacity } from "~~/utils/wallet-metadata";

interface WalletIconProps {
  walletName: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showBackground?: boolean;
}

const sizeClasses = {
  xs: "w-4 h-4 text-xs",
  sm: "w-6 h-6 text-sm",
  md: "w-8 h-8 text-base",
  lg: "w-10 h-10 text-lg",
  xl: "w-12 h-12 text-xl",
};

export const WalletIcon = ({ walletName, size = "md", showBackground = true }: WalletIconProps) => {
  const wallet = getWalletMetadata(walletName);

  if (showBackground) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium`}
        style={{
          backgroundColor: getWalletColorWithOpacity(wallet.color, 0.1),
        }}
      >
        <span>{wallet.icon}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center`}>
      <span>{wallet.icon}</span>
    </div>
  );
};
