"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { Address } from "viem";
import { useBalance } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

export const WalletBalanceDisplay = () => {
  const { address, isConnected } = useAppKitAccount();
  const { targetNetwork } = useTargetNetwork();

  const { data: balance } = useBalance({
    address: address as Address,
  });

  if (!isConnected || !address) return null;

  const formattedBalance = balance ? parseFloat(balance.formatted).toFixed(4) : "0.0000";

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-4">
        <h3 className="card-title text-sm">Wallet Balance</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formattedBalance}</span>
          <span className="text-lg text-base-content/70">{balance?.symbol || "ETH"}</span>
        </div>
        <div className="text-xs text-base-content/50">on {targetNetwork.name}</div>
      </div>
    </div>
  );
};
