"use client";

import { useEffect, useState } from "react";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { WalletInfo, openWalletDeepLink, generateWalletDeepLink } from "~~/utils/wallet-deeplinks";
import { useMobileDetection } from "~~/hooks/scaffold-eth/useMobileDetection";

interface WalletDeepLinkProps {
  wallet: WalletInfo;
  wcUri?: string;
  onConnect?: () => void;
  variant?: "default" | "compact";
}

export const WalletDeepLink = ({ wallet, wcUri, onConnect, variant = "default" }: WalletDeepLinkProps) => {
  const { platform, isMobile } = useMobileDetection();
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenWallet = () => {
    if (!wcUri || platform === "other") return;

    setIsOpening(true);

    try {
      const deepLink = generateWalletDeepLink(wallet.id, wcUri);
      openWalletDeepLink(wallet.id, deepLink, platform);

      if (onConnect) {
        onConnect();
      }
    } catch (error) {
      console.error("Failed to open wallet:", error);
    } finally {
      setTimeout(() => setIsOpening(false), 3000);
    }
  };

  if (!isMobile) return null;

  if (variant === "compact") {
    return (
      <button
        onClick={handleOpenWallet}
        disabled={!wcUri || isOpening}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        <span className="text-xl">{wallet.icon}</span>
        <span>Open {wallet.name}</span>
        {!isOpening && <ArrowTopRightOnSquareIcon className="h-4 w-4" />}
        {isOpening && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      </button>
    );
  }

  return (
    <button
      onClick={handleOpenWallet}
      disabled={!wcUri || isOpening}
      className="w-full flex items-center gap-4 p-4 bg-white border-2 border-gray-200 hover:border-blue-500 disabled:border-gray-200 disabled:cursor-not-allowed rounded-xl transition-all hover:shadow-md"
    >
      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
        {wallet.icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-semibold text-gray-900">{wallet.name}</p>
        <p className="text-xs text-gray-500">
          {isOpening ? "Opening app..." : "Tap to open"}
        </p>
      </div>
      {!isOpening && <ArrowTopRightOnSquareIcon className="h-6 w-6 text-gray-400" />}
      {isOpening && (
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      )}
    </button>
  );
};

interface WalletDownloadButtonProps {
  wallet: WalletInfo;
}

export const WalletDownloadButton = ({ wallet }: WalletDownloadButtonProps) => {
  const { platform, isMobile } = useMobileDetection();

  if (!isMobile || platform === "other") return null;

  const downloadUrl = wallet.downloadUrl[platform];

  return (
    <a
      href={downloadUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
    >
      Get {wallet.name}
    </a>
  );
};
