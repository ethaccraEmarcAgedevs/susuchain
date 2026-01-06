"use client";

import { useState, useEffect } from "react";
import { useETHPrice } from "~~/hooks/chainlink/usePriceFeed";
import { formatPriceDisplay, convertETHToUSD, convertUSDToETH } from "~~/services/chainlink/price-feed-client";

interface USDConverterProps {
  ethAmount?: number;
  usdAmount?: number;
  showBothDirections?: boolean;
}

export function USDConverter({ ethAmount, usdAmount, showBothDirections = false }: USDConverterProps) {
  const { priceData, isLoading } = useETHPrice();
  const [convertedUSD, setConvertedUSD] = useState<number | null>(null);
  const [convertedETH, setConvertedETH] = useState<number | null>(null);

  useEffect(() => {
    if (priceData) {
      if (ethAmount !== undefined) {
        setConvertedUSD(convertETHToUSD(ethAmount, priceData.price));
      }
      if (usdAmount !== undefined) {
        setConvertedETH(convertUSDToETH(usdAmount, priceData.price));
      }
    }
  }, [priceData, ethAmount, usdAmount]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="loading loading-spinner loading-xs"></span>
        <span className="text-sm text-gray-500">Loading price...</span>
      </div>
    );
  }

  if (!priceData) {
    return <span className="text-sm text-gray-500">Price unavailable</span>;
  }

  return (
    <div className="space-y-2">
      {/* ETH to USD conversion */}
      {ethAmount !== undefined && convertedUSD !== null && (
        <div className="flex items-center gap-2">
          <span className="font-mono">{ethAmount.toFixed(6)} ETH</span>
          <span className="text-gray-400">≈</span>
          <span className="font-semibold text-green-600">
            {formatPriceDisplay(convertedUSD, "USD")}
          </span>
        </div>
      )}

      {/* USD to ETH conversion */}
      {usdAmount !== undefined && convertedETH !== null && (
        <div className="flex items-center gap-2">
          <span className="font-semibold">${usdAmount.toFixed(2)}</span>
          <span className="text-gray-400">≈</span>
          <span className="font-mono text-blue-600">{convertedETH.toFixed(6)} ETH</span>
        </div>
      )}

      {/* Current ETH price */}
      {showBothDirections && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>1 ETH = {formatPriceDisplay(priceData.price, "USD")}</span>
          {priceData.isStale && (
            <span className="badge badge-warning badge-xs">Stale</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Simple inline price display
 */
export function InlinePrice({ ethAmount }: { ethAmount: number }) {
  const { priceData } = useETHPrice();

  if (!priceData) return null;

  const usdValue = convertETHToUSD(ethAmount, priceData.price);

  return (
    <span className="text-sm text-gray-600">
      ({formatPriceDisplay(usdValue, "USD")})
    </span>
  );
}

/**
 * Price badge with live updates
 */
export function LivePriceBadge() {
  const { priceData, isLoading } = useETHPrice();

  if (isLoading || !priceData) {
    return (
      <div className="badge badge-ghost gap-2">
        <span className="loading loading-spinner loading-xs"></span>
        Loading...
      </div>
    );
  }

  return (
    <div className={`badge gap-2 ${priceData.isStale ? "badge-warning" : "badge-success"}`}>
      <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
      <span>ETH: {formatPriceDisplay(priceData.price, "USD")}</span>
    </div>
  );
}

/**
 * Contribution amount display with USD equivalent
 */
export function ContributionDisplay({
  amount,
  asset = "ETH",
}: {
  amount: number;
  asset?: "ETH" | "USDC";
}) {
  const { priceData } = useETHPrice();

  if (!priceData) {
    return (
      <div className="text-2xl font-bold">
        {amount.toFixed(6)} {asset}
      </div>
    );
  }

  const usdValue = asset === "ETH" ? convertETHToUSD(amount, priceData.price) : amount;

  return (
    <div className="space-y-1">
      <div className="text-3xl font-bold">
        {amount.toFixed(asset === "ETH" ? 6 : 2)} {asset}
      </div>
      <div className="text-lg text-gray-600">
        {formatPriceDisplay(usdValue, "USD")}
      </div>
    </div>
  );
}

/**
 * Dynamic contribution adjuster
 */
export function DynamicContributionAdjuster({
  baseUSDAmount,
  onAdjustment,
}: {
  baseUSDAmount: number;
  onAdjustment?: (newETHAmount: number) => void;
}) {
  const { priceData } = useETHPrice();
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);

  useEffect(() => {
    if (priceData) {
      if (previousPrice && previousPrice !== priceData.price) {
        const newETHAmount = convertUSDToETH(baseUSDAmount, priceData.price);
        onAdjustment?.(newETHAmount);
      }
      setPreviousPrice(priceData.price);
    }
  }, [priceData, previousPrice, baseUSDAmount, onAdjustment]);

  if (!priceData) return null;

  const requiredETH = convertUSDToETH(baseUSDAmount, priceData.price);
  const priceChange =
    previousPrice && previousPrice !== priceData.price
      ? ((priceData.price - previousPrice) / previousPrice) * 100
      : 0;

  return (
    <div className="card bg-base-100 shadow-sm border border-gray-200">
      <div className="card-body p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Required Contribution</span>
          <LivePriceBadge />
        </div>

        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">{requiredETH.toFixed(6)} ETH</span>
          <span className="text-lg text-gray-600 mb-1">
            (${baseUSDAmount.toFixed(2)})
          </span>
        </div>

        {priceChange !== 0 && (
          <div className={`text-sm ${priceChange > 0 ? "text-red-600" : "text-green-600"}`}>
            {priceChange > 0 ? "↑" : "↓"} {Math.abs(priceChange).toFixed(2)}% price change
            <span className="text-gray-600 ml-1">
              ({priceChange > 0 ? "requires more ETH" : "requires less ETH"})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
