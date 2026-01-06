"use client";

import { formatEther } from "viem";

interface ReferralStatsProps {
  directReferrals: number;
  indirectReferrals: number;
  qualifiedReferrals: number;
  totalRewards: number;
  tier: number;
}

export function ReferralStats({
  directReferrals,
  indirectReferrals,
  qualifiedReferrals,
  totalRewards,
  tier,
}: ReferralStatsProps) {
  const totalReferrals = directReferrals + indirectReferrals;
  const qualificationRate =
    totalReferrals > 0 ? ((qualifiedReferrals / totalReferrals) * 100).toFixed(1) : "0.0";

  const stats = [
    {
      label: "Direct Referrals",
      value: directReferrals,
      icon: "👥",
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Indirect Referrals",
      value: indirectReferrals,
      icon: "🌐",
      color: "bg-purple-100 text-purple-700",
    },
    {
      label: "Qualified Referrals",
      value: qualifiedReferrals,
      icon: "✅",
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Total Rewards",
      value: `${formatEther(BigInt(totalRewards))} ETH`,
      icon: "💰",
      color: "bg-yellow-100 text-yellow-700",
    },
  ];

  const nextMilestone =
    qualifiedReferrals < 10 ? 10 : qualifiedReferrals < 50 ? 50 : qualifiedReferrals < 100 ? 100 : 500;
  const progressToNext = (qualifiedReferrals / nextMilestone) * 100;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-6">Your Stats</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.color} rounded-lg p-4`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{stat.icon}</span>
                <div>
                  <p className="text-sm opacity-80">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Qualification Rate */}
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Qualification Rate</span>
            <span className="text-2xl font-bold">{qualificationRate}%</span>
          </div>
          <progress
            className="progress progress-success w-full"
            value={parseFloat(qualificationRate)}
            max="100"
          ></progress>
          <p className="text-xs text-gray-600 mt-1">
            {qualifiedReferrals} of {totalReferrals} referrals qualified
          </p>
        </div>

        {/* Progress to Next Milestone */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Next Milestone</span>
            <span className="text-lg font-bold">
              {qualifiedReferrals} / {nextMilestone}
            </span>
          </div>
          <progress className="progress progress-primary w-full" value={progressToNext} max="100"></progress>
          <p className="text-xs text-gray-600 mt-1">
            {nextMilestone - qualifiedReferrals} more qualified referrals for{" "}
            {nextMilestone === 10 && "0.1 ETH"}
            {nextMilestone === 50 && "1 ETH"}
            {nextMilestone === 100 && "5 ETH"}
            {nextMilestone === 500 && "30 ETH"} bonus
          </p>
        </div>
      </div>
    </div>
  );
}
