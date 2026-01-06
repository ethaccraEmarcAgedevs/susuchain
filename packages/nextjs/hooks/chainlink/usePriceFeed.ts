import { useEffect, useState } from "react";
import { Address, formatEther, parseEther } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import {
  getPriceFeedAddress,
  formatPrice,
  convertETHToUSD,
  convertUSDToETH,
  isPriceStale,
  formatPriceDisplay,
} from "~~/services/chainlink/price-feed-client";

const PRICE_FEED_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Hook to get ETH/USD price from Chainlink
 */
export function useETHPrice(chainId: number = 84532) {
  const priceFeedAddress = getPriceFeedAddress(chainId, "ETH");

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: priceFeedAddress,
        abi: PRICE_FEED_ABI,
        functionName: "latestRoundData",
      },
      {
        address: priceFeedAddress,
        abi: PRICE_FEED_ABI,
        functionName: "decimals",
      },
    ],
    query: {
      refetchInterval: 60000, // Refetch every minute
    },
  });

  const [priceData, setPriceData] = useState<{
    price: number;
    priceRaw: bigint;
    decimals: number;
    updatedAt: number;
    isStale: boolean;
    formatted: string;
  } | null>(null);

  useEffect(() => {
    if (data && data[0]?.result && data[1]?.result) {
      const [roundId, answer, startedAt, updatedAt, answeredInRound] = data[0].result as [
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
      ];
      const decimals = data[1].result as number;

      const priceRaw = answer;
      const price = formatPrice(priceRaw, decimals);
      const updatedAtNum = Number(updatedAt);

      setPriceData({
        price,
        priceRaw,
        decimals,
        updatedAt: updatedAtNum,
        isStale: isPriceStale(updatedAtNum),
        formatted: formatPriceDisplay(price, "USD"),
      });
    }
  }, [data]);

  return {
    priceData,
    isLoading,
    refetch,
  };
}

/**
 * Hook to get USDC/USD price from Chainlink
 */
export function useUSDCPrice(chainId: number = 84532) {
  const priceFeedAddress = getPriceFeedAddress(chainId, "USDC");

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: priceFeedAddress,
        abi: PRICE_FEED_ABI,
        functionName: "latestRoundData",
      },
      {
        address: priceFeedAddress,
        abi: PRICE_FEED_ABI,
        functionName: "decimals",
      },
    ],
  });

  const [priceData, setPriceData] = useState<{
    price: number;
    decimals: number;
    updatedAt: number;
  } | null>(null);

  useEffect(() => {
    if (data && data[0]?.result && data[1]?.result) {
      const [roundId, answer, startedAt, updatedAt, answeredInRound] = data[0].result as [
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
      ];
      const decimals = data[1].result as number;

      setPriceData({
        price: formatPrice(answer, decimals),
        decimals,
        updatedAt: Number(updatedAt),
      });
    }
  }, [data]);

  return {
    priceData,
    isLoading,
  };
}

/**
 * Hook to convert USD to ETH using current price
 */
export function useUSDToETH(usdAmount: number) {
  const { priceData } = useETHPrice();

  if (!priceData) return null;

  return convertUSDToETH(usdAmount, priceData.price);
}

/**
 * Hook to convert ETH to USD using current price
 */
export function useETHToUSD(ethAmount: number) {
  const { priceData } = useETHPrice();

  if (!priceData) return null;

  return convertETHToUSD(ethAmount, priceData.price);
}

/**
 * Hook to get contribution amounts in both USD and ETH
 */
export function useContributionAmounts(groupAddress: Address) {
  const [amounts, setAmounts] = useState<{
    ethAmount: string;
    usdAmount: string;
    isUSDDenominated: boolean;
  } | null>(null);

  // This would read from the SusuGroup contract
  // For now, returning mock data structure
  // In production, use useReadContract to get these values from the contract

  return amounts;
}

/**
 * Hook for real-time price monitoring with alerts
 */
export function usePriceMonitor(
  thresholds: { high: number; low: number },
  onAlert?: (type: "high" | "low", price: number) => void,
) {
  const { priceData } = useETHPrice();
  const [alerts, setAlerts] = useState<Array<{ type: "high" | "low"; price: number; timestamp: number }>>([]);

  useEffect(() => {
    if (priceData) {
      if (priceData.price >= thresholds.high) {
        const alert = { type: "high" as const, price: priceData.price, timestamp: Date.now() };
        setAlerts(prev => [...prev, alert]);
        onAlert?.("high", priceData.price);
      } else if (priceData.price <= thresholds.low) {
        const alert = { type: "low" as const, price: priceData.price, timestamp: Date.now() };
        setAlerts(prev => [...prev, alert]);
        onAlert?.("low", priceData.price);
      }
    }
  }, [priceData, thresholds, onAlert]);

  return {
    currentPrice: priceData?.price,
    alerts,
    clearAlerts: () => setAlerts([]),
  };
}

/**
 * Hook to track price history
 */
export function usePriceHistory(intervalMs: number = 60000, maxPoints: number = 30) {
  const { priceData } = useETHPrice();
  const [history, setHistory] = useState<Array<{ price: number; timestamp: number }>>([]);

  useEffect(() => {
    if (priceData) {
      setHistory(prev => {
        const newHistory = [
          ...prev,
          {
            price: priceData.price,
            timestamp: priceData.updatedAt * 1000,
          },
        ];

        // Keep only last maxPoints
        return newHistory.slice(-maxPoints);
      });
    }
  }, [priceData, maxPoints]);

  return {
    history,
    latest: history[history.length - 1],
    change24h:
      history.length >= 2
        ? ((history[history.length - 1].price - history[0].price) / history[0].price) * 100
        : 0,
  };
}
