"use client";

import { useState, useEffect } from "react";

interface GasSavingsProps {
  estimatedGasUsed?: bigint;
  className?: string;
}

/**
 * Display gas savings on Base vs Ethereum
 */
export const GasSavings = ({ estimatedGasUsed = BigInt(21000), className = "" }: GasSavingsProps) => {
  const [ethereumCost, setEthereumCost] = useState<number>(0);
  const [baseCost, setBaseCost] = useState<number>(0);

  useEffect(() => {
    // Approximate gas prices (in gwei)
    const ETH_GAS_PRICE = 30; // ~30 gwei on Ethereum
    const BASE_GAS_PRICE = 0.001; // ~0.001 gwei on Base

    // Calculate costs in USD (assuming $2000 ETH)
    const ethGasCostETH = (Number(estimatedGasUsed) * ETH_GAS_PRICE) / 1e9;
    const baseGasCostETH = (Number(estimatedGasUsed) * BASE_GAS_PRICE) / 1e9;

    const ETH_PRICE_USD = 2000;

    setEthereumCost(ethGasCostETH * ETH_PRICE_USD);
    setBaseCost(baseGasCostETH * ETH_PRICE_USD);
  }, [estimatedGasUsed]);

  const savings = ethereumCost - baseCost;
  const savingsPercent = ethereumCost > 0 ? ((savings / ethereumCost) * 100).toFixed(0) : 0;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg ${className}`}>
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-green-700">
          Save {savingsPercent}% on gas
        </span>
        <span className="text-xs text-green-600">
          ${baseCost.toFixed(4)} vs ${ethereumCost.toFixed(2)} on Ethereum
        </span>
      </div>
    </div>
  );
};
