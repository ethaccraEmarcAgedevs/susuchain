"use client";

import { usePriceHistory } from "~~/hooks/chainlink/usePriceFeed";
import { formatPriceDisplay } from "~~/services/chainlink/price-feed-client";

export function PriceChart() {
  const { history, latest, change24h } = usePriceHistory();

  if (history.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">ETH Price Chart</h3>
          <div className="flex items-center justify-center h-40">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  const maxPrice = Math.max(...history.map(h => h.price));
  const minPrice = Math.min(...history.map(h => h.price));
  const priceRange = maxPrice - minPrice;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h3 className="card-title">ETH Price Trend</h3>
          {latest && (
            <div className="text-right">
              <div className="text-2xl font-bold">{formatPriceDisplay(latest.price, "USD")}</div>
              <div className={`text-sm ${change24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                {change24h >= 0 ? "↑" : "↓"} {Math.abs(change24h).toFixed(2)}%
              </div>
            </div>
          )}
        </div>

        {/* Simple Line Chart */}
        <div className="relative h-40 bg-gray-50 rounded-lg p-4">
          <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="0" x2="400" y2="0" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="0" y1="25" x2="400" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="0" y1="75" x2="400" y2="75" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="0" y1="100" x2="400" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />

            {/* Price line */}
            <polyline
              points={history
                .map((point, index) => {
                  const x = (index / (history.length - 1)) * 400;
                  const y = 100 - ((point.price - minPrice) / priceRange) * 100;
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />

            {/* Area fill */}
            <polygon
              points={[
                "0,100",
                ...history.map((point, index) => {
                  const x = (index / (history.length - 1)) * 400;
                  const y = 100 - ((point.price - minPrice) / priceRange) * 100;
                  return `${x},${y}`;
                }),
                "400,100",
              ].join(" ")}
              fill="#3b82f6"
              fillOpacity="0.1"
            />
          </svg>

          {/* Price range labels */}
          <div className="absolute top-0 left-0 text-xs text-gray-500">
            ${maxPrice.toFixed(0)}
          </div>
          <div className="absolute bottom-0 left-0 text-xs text-gray-500">
            ${minPrice.toFixed(0)}
          </div>
        </div>

        {/* Time range indicator */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{history.length} data points</span>
          <span>Last {Math.floor((Date.now() - history[0].timestamp) / 60000)}m</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact price trend indicator
 */
export function PriceTrend() {
  const { change24h, latest } = usePriceHistory();

  if (!latest) return null;

  const isPositive = change24h >= 0;

  return (
    <div className="flex items-center gap-2">
      <div className={`badge ${isPositive ? "badge-success" : "badge-error"}`}>
        {isPositive ? "↑" : "↓"} {Math.abs(change24h).toFixed(2)}%
      </div>
      <span className="text-sm text-gray-600">24h</span>
    </div>
  );
}
