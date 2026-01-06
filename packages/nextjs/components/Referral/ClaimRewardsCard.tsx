"use client";

import { useState } from "react";
import { useReferralActions } from "~~/hooks/referral/useReferralActions";

interface ClaimRewardsCardProps {
  pendingRewards: string;
  availableBonuses: Array<{ milestone: number; amount: string }>;
}

export function ClaimRewardsCard({ pendingRewards, availableBonuses }: ClaimRewardsCardProps) {
  const { claimRewards, claimBonus, isClaimingRewards, isClaimingBonus } = useReferralActions();
  const [claimingType, setClaimingType] = useState<"rewards" | "bonus" | null>(null);

  const handleClaimRewards = async () => {
    setClaimingType("rewards");
    try {
      await claimRewards();
    } finally {
      setClaimingType(null);
    }
  };

  const handleClaimBonus = async () => {
    setClaimingType("bonus");
    try {
      await claimBonus();
    } finally {
      setClaimingType(null);
    }
  };

  const hasPendingRewards = parseFloat(pendingRewards) > 0;
  const hasAvailableBonuses = availableBonuses.length > 0;

  return (
    <div className="card bg-gradient-to-br from-green-50 to-blue-50 shadow-xl border-2 border-green-200">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">Claim Rewards</h2>

        {/* Pending Rewards */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Pending Rewards</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-bold text-green-600">{pendingRewards}</span>
            <span className="text-xl text-gray-600 mb-1">ETH</span>
          </div>

          <button
            onClick={handleClaimRewards}
            disabled={!hasPendingRewards || isClaimingRewards}
            className={`btn w-full ${
              hasPendingRewards
                ? "btn-success"
                : "btn-disabled"
            }`}
          >
            {claimingType === "rewards" && isClaimingRewards ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Claiming...
              </>
            ) : (
              <>
                💰 Claim Rewards
              </>
            )}
          </button>

          {!hasPendingRewards && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              No pending rewards yet. Invite friends to start earning!
            </p>
          )}
        </div>

        {/* Available Bonuses */}
        {hasAvailableBonuses && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 border-2 border-yellow-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎉</span>
              <p className="font-semibold text-lg">Milestone Bonus Available!</p>
            </div>

            <div className="space-y-2 mb-4">
              {availableBonuses.map((bonus, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-semibold">{bonus.milestone} Qualified Referrals</span>
                  <span className="badge badge-warning badge-lg">{bonus.amount}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleClaimBonus}
              disabled={isClaimingBonus}
              className="btn btn-warning w-full"
            >
              {claimingType === "bonus" && isClaimingBonus ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Claiming...
                </>
              ) : (
                <>
                  🏆 Claim Bonus
                </>
              )}
            </button>
          </div>
        )}

        {/* Upcoming Milestones */}
        {!hasAvailableBonuses && (
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-semibold mb-3">Upcoming Milestones</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>10 qualified referrals</span>
                <span className="font-semibold">0.1 ETH</span>
              </div>
              <div className="flex justify-between">
                <span>50 qualified referrals</span>
                <span className="font-semibold">1 ETH</span>
              </div>
              <div className="flex justify-between">
                <span>100 qualified referrals</span>
                <span className="font-semibold">5 ETH</span>
              </div>
              <div className="flex justify-between">
                <span>500 qualified referrals</span>
                <span className="font-semibold">30 ETH</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
