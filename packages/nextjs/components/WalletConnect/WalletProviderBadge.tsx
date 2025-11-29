"use client";

import { useAppKitState } from "@reown/appkit/react";
import { useAccount } from "wagmi";

const WALLET_ICONS: Record<string, string> = {
  metamask: "🦊",
  trust: "🛡️",
  rainbow: "🌈",
  coinbase: "🔵",
  walletconnect: "🔗",
  safe: "🔐",
};

export const WalletProviderBadge = () => {
  const { connector } = useAccount();
  const { selectedNetworkId } = useAppKitState();

  if (!connector) return null;

  const walletName = connector.name.toLowerCase();
  const icon = Object.keys(WALLET_ICONS).find(key => walletName.includes(key));
  const walletIcon = icon ? WALLET_ICONS[icon] : "💼";

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-base-200 rounded-full text-sm">
      <span>{walletIcon}</span>
      <span className="font-medium">{connector.name}</span>
      {selectedNetworkId && <div className="badge badge-sm badge-primary">Connected</div>}
    </div>
  );
};
