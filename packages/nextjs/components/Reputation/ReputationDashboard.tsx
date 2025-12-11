"use client";

import { Address } from "viem";
import { useReputation } from "~~/hooks/scaffold-eth/useReputation";

interface ReputationDashboardProps {
  address: Address;
  className?: string;
}

export default function ReputationDashboard({ address, className = "" }: ReputationDashboardProps) {
  const { score, metrics, recommendations, tierBenefits, isLoading } = useReputation(address);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!score) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reputation Score</h3>
        <p className="text-gray-500">No reputation data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Reputation Score</h3>
        <div className="flex items-center gap-3">
          <div className="text-4xl font-bold text-blue-600">{score.total.toFixed(0)}</div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-gray-700">{score.tier}</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${score.total}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h4>
        <div className="space-y-2">
          <ScoreItem label="On-Time Contributions" value={score.breakdown.onTimeContributions} max={40} />
          <ScoreItem label="Trusted Vouches" value={score.breakdown.trustedVouches} max={25} />
          <ScoreItem label="Group Completions" value={score.breakdown.groupCompletions} max={20} />
          <ScoreItem label="Ecosystem Tenure" value={score.breakdown.ecosystemTenure} max={10} />
          {score.breakdown.communityFlags > 0 && (
            <ScoreItem
              label="Community Flags"
              value={-score.breakdown.communityFlags}
              max={5}
              isNegative
            />
          )}
        </div>
      </div>

      {/* Badges */}
      {score.badges.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Earned Badges</h4>
          <div className="flex flex-wrap gap-2">
            {score.badges.map((badge, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 text-xs font-medium rounded-full border border-yellow-300"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tier Benefits */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Benefits</h4>
        <ul className="space-y-1">
          {tierBenefits.map((benefit, idx) => (
            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Improve Your Score</h4>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">💡</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ScoreItem({
  label,
  value,
  max,
  isNegative = false,
}: {
  label: string;
  value: number;
  max: number;
  isNegative?: boolean;
}) {
  const percentage = (Math.abs(value) / max) * 100;
  const displayValue = value.toFixed(1);

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${isNegative ? "text-red-600" : "text-gray-900"}`}>
          {isNegative && value < 0 ? "" : "+"}{displayValue}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${isNegative ? "bg-red-500" : "bg-green-500"}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
