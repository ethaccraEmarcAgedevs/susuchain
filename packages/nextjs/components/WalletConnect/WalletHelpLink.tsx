"use client";

import { QuestionMarkCircleIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { getWalletMetadata } from "~~/utils/wallet-metadata";

interface WalletHelpLinkProps {
  walletName: string;
  variant?: "button" | "link" | "icon";
  className?: string;
}

export const WalletHelpLink = ({ walletName, variant = "link", className = "" }: WalletHelpLinkProps) => {
  const wallet = getWalletMetadata(walletName);

  const handleClick = () => {
    window.open(wallet.supportUrl, "_blank", "noopener,noreferrer");
  };

  if (variant === "button") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors ${className}`}
      >
        <QuestionMarkCircleIcon className="h-5 w-5" />
        <span>Get Help with {wallet.name}</span>
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors ${className}`}
        title={`Get help with ${wallet.name}`}
      >
        <QuestionMarkCircleIcon className="h-5 w-5" />
      </button>
    );
  }

  // Default: link variant
  return (
    <a
      href={wallet.supportUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors ${className}`}
    >
      <QuestionMarkCircleIcon className="h-4 w-4" />
      <span>{wallet.name} Help</span>
      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
    </a>
  );
};
