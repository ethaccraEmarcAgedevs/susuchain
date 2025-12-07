"use client";

import { useMemo } from "react";
import { formatEther } from "viem";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { DailyStats } from "~~/hooks/scaffold-eth/usePlatformAnalytics";

interface TVLChartProps {
  dailyStats: DailyStats[];
  className?: string;
}

export default function TVLChart({ dailyStats, className = "" }: TVLChartProps) {
  const chartData = useMemo(() => {
    return dailyStats
      .slice()
      .reverse()
      .map(stat => ({
        date: new Date(Number(stat.timestamp) * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        tvl: parseFloat(formatEther(stat.totalValueLocked)),
        contributions: parseFloat(formatEther(stat.contributionVolume)),
      }));
  }, [dailyStats]);

  if (chartData.length === 0) {
    return (
      <div className={`bg-white rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Value Locked (TVL)</h3>
        <div className="text-center text-gray-500 py-12">No data available</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Total Value Locked (TVL)</h3>
        <p className="text-sm text-gray-500">Total ETH locked in all active Susu groups</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorTVL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: "12px" }} />
          <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} tickFormatter={value => `${value.toFixed(2)} ETH`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
            formatter={(value: number) => [`${value.toFixed(4)} ETH`, "TVL"]}
          />
          <Area type="monotone" dataKey="tvl" stroke="#3b82f6" strokeWidth={2} fill="url(#colorTVL)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
