"use client";

import { formatEther } from "viem";
import { usePlatformStats } from "~~/hooks/scaffold-eth/usePlatformAnalytics";

export default function PlatformStatsCards() {
  const { platformStats, isLoading } = usePlatformStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!platformStats) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p>No platform statistics available</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Value Locked",
      value: `${parseFloat(formatEther(platformStats.totalValueLocked)).toFixed(4)} ETH`,
      icon: "💰",
      color: "blue",
      subtext: `${formatEther(platformStats.totalContributions)} contributed`,
    },
    {
      label: "Active Groups",
      value: platformStats.activeGroups.toString(),
      icon: "👥",
      color: "green",
      subtext: `${platformStats.totalGroups} total groups`,
    },
    {
      label: "Total Members",
      value: platformStats.totalMembers.toString(),
      icon: "🤝",
      color: "purple",
      subtext: `${platformStats.averageGroupSize.toFixed(1)} avg per group`,
    },
    {
      label: "Total Payouts",
      value: `${parseFloat(formatEther(platformStats.totalPayouts)).toFixed(4)} ETH`,
      icon: "💸",
      color: "yellow",
      subtext: `${platformStats.completedGroups} completed cycles`,
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
              {stat.icon}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.subtext}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
