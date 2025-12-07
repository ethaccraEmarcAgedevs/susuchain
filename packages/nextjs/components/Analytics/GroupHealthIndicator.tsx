"use client";

import { Address } from "viem";
import { useGroupHealth } from "~~/hooks/scaffold-eth/useGroupAnalytics";

interface GroupHealthIndicatorProps {
  groupAddress: Address;
  className?: string;
}

export default function GroupHealthIndicator({ groupAddress, className = "" }: GroupHealthIndicatorProps) {
  const { health, isLoading } = useGroupHealth(groupAddress);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Health</h3>
        <div className="text-center text-gray-500">No health data available</div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Attention";
  };

  const overallHealth = (health.completionRate + health.averageReliabilityScore + health.activeParticipationRate) / 3;

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Group Health Score</h3>
        <p className="text-sm text-gray-500">Overall performance metrics</p>
      </div>

      {/* Overall Score */}
      <div className={`mb-6 p-4 border-2 rounded-lg ${getHealthColor(overallHealth)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium mb-1">Overall Health</div>
            <div className="text-2xl font-bold">{overallHealth.toFixed(1)}%</div>
          </div>
          <div className="text-sm font-semibold px-3 py-1 bg-white rounded-full">{getHealthLabel(overallHealth)}</div>
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Completion Rate</span>
            <span className="font-medium">{health.completionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${health.completionRate}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Avg. Reliability Score</span>
            <span className="font-medium">{health.averageReliabilityScore.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${health.averageReliabilityScore}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Active Participation</span>
            <span className="font-medium">{health.activeParticipationRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${health.activeParticipationRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Performance */}
      {health.recentRoundPerformance.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Recent Round Performance</div>
          <div className="flex gap-2">
            {health.recentRoundPerformance.map((perf, idx) => (
              <div key={idx} className="flex-1">
                <div className="text-xs text-gray-500 mb-1">R{idx + 1}</div>
                <div
                  className={`h-12 rounded ${perf >= 80 ? "bg-green-500" : perf >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ height: `${perf}%`, minHeight: "8px" }}
                  title={`${perf.toFixed(0)}%`}
                ></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
