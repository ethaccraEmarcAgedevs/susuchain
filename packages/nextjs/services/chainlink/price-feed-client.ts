import { Address } from "viem";

/**
 * Chainlink Price Feed integration for Base
 */

// Chainlink Price Feed Addresses on Base
export const CHAINLINK_ADDRESSES = {
  BASE_SEPOLIA: {
    ETH_USD: "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1" as Address,
    USDC_USD: "0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165" as Address,
  },
  BASE_MAINNET: {
    ETH_USD: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70" as Address,
    USDC_USD: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B" as Address,
  },
};

export interface PriceData {
  price: bigint;
  decimals: number;
  updatedAt: number;
  roundId: bigint;
}

export interface PriceHistory {
  timestamp: number;
  price: number;
  change24h?: number;
}

/**
 * Convert price with decimals to human-readable number
 */
export function formatPrice(price: bigint, decimals: number): number {
  return Number(price) / Math.pow(10, decimals);
}

/**
 * Convert USD amount to ETH amount
 */
export function convertUSDToETH(usdAmount: number, ethPriceUSD: number): number {
  if (ethPriceUSD === 0) return 0;
  return usdAmount / ethPriceUSD;
}

/**
 * Convert ETH amount to USD amount
 */
export function convertETHToUSD(ethAmount: number, ethPriceUSD: number): number {
  return ethAmount * ethPriceUSD;
}

/**
 * Calculate percentage change between two prices
 */
export function calculatePriceChange(oldPrice: number, newPrice: number): {
  change: number;
  changePercent: number;
  isIncrease: boolean;
} {
  const change = newPrice - oldPrice;
  const changePercent = (change / oldPrice) * 100;

  return {
    change,
    changePercent,
    isIncrease: change >= 0,
  };
}

/**
 * Check if price is stale (older than 1 hour)
 */
export function isPriceStale(updatedAt: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const hourAgo = now - 3600;
  return updatedAt < hourAgo;
}

/**
 * Format price for display with currency symbol
 */
export function formatPriceDisplay(price: number, currency: "USD" | "ETH" = "USD"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } else {
    return `${price.toFixed(6)} ETH`;
  }
}

/**
 * Calculate contribution adjustment based on price change
 */
export function calculateAdjustedContribution(
  baseUSDAmount: number,
  currentETHPrice: number,
  maxAdjustmentPercent: number = 20,
): {
  requiredETH: number;
  adjustment: number;
  adjustmentPercent: number;
  capped: boolean;
} {
  const requiredETH = convertUSDToETH(baseUSDAmount, currentETHPrice);

  return {
    requiredETH,
    adjustment: 0, // Calculation depends on previous price
    adjustmentPercent: 0,
    capped: false,
  };
}

/**
 * Generate price trend indicator
 */
export function getPriceTrend(priceHistory: PriceHistory[]): {
  trend: "up" | "down" | "stable";
  strength: "strong" | "moderate" | "weak";
} {
  if (priceHistory.length < 2) {
    return { trend: "stable", strength: "weak" };
  }

  const recentPrices = priceHistory.slice(-5);
  let ups = 0;
  let downs = 0;

  for (let i = 1; i < recentPrices.length; i++) {
    if (recentPrices[i].price > recentPrices[i - 1].price) ups++;
    else if (recentPrices[i].price < recentPrices[i - 1].price) downs++;
  }

  const trend = ups > downs ? "up" : downs > ups ? "down" : "stable";
  const strength = Math.abs(ups - downs) >= 3 ? "strong" : Math.abs(ups - downs) >= 2 ? "moderate" : "weak";

  return { trend, strength };
}

/**
 * Get price feed address for network
 */
export function getPriceFeedAddress(chainId: number, asset: "ETH" | "USDC"): Address {
  const isMainnet = chainId === 8453; // Base mainnet
  const feeds = isMainnet ? CHAINLINK_ADDRESSES.BASE_MAINNET : CHAINLINK_ADDRESSES.BASE_SEPOLIA;

  return asset === "ETH" ? feeds.ETH_USD : feeds.USDC_USD;
}

/**
 * Estimate gas for price update
 */
export function estimatePriceUpdateGas(): bigint {
  // Approximate gas for calling Chainlink price feed
  return BigInt(100000); // 100k gas
}

/**
 * Format timestamp to readable date
 */
export function formatPriceTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Calculate price volatility (standard deviation)
 */
export function calculateVolatility(priceHistory: number[]): number {
  if (priceHistory.length < 2) return 0;

  const mean = priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length;
  const squaredDiffs = priceHistory.map(price => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / priceHistory.length;

  return Math.sqrt(variance);
}

/**
 * Get price alert thresholds
 */
export function getPriceAlertThresholds(currentPrice: number): {
  high: number;
  low: number;
  extreme: number;
} {
  return {
    high: currentPrice * 1.1, // 10% increase
    low: currentPrice * 0.9, // 10% decrease
    extreme: currentPrice * 0.8, // 20% decrease (circuit breaker)
  };
}

/**
 * Mock price history generator (for testing/demo)
 */
export function generateMockPriceHistory(
  basePrice: number,
  days: number = 30,
): PriceHistory[] {
  const history: PriceHistory[] = [];
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const price = basePrice * (1 + randomVariation);

    history.push({
      timestamp: Math.floor(timestamp / 1000),
      price,
    });
  }

  // Calculate 24h changes
  for (let i = 1; i < history.length; i++) {
    const change = ((history[i].price - history[i - 1].price) / history[i - 1].price) * 100;
    history[i].change24h = change;
  }

  return history;
}

/**
 * Check if price deviation requires circuit breaker
 */
export function shouldTriggerCircuitBreaker(
  oldPrice: number,
  newPrice: number,
  threshold: number = 0.2, // 20%
): boolean {
  const change = Math.abs(newPrice - oldPrice) / oldPrice;
  return change > threshold;
}

/**
 * Format large numbers with K/M suffix
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  } else {
    return num.toFixed(2);
  }
}
