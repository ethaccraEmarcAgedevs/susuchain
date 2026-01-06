"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ReferralCodeDisplay } from "~~/components/Referral/ReferralCodeDisplay";
import { ReferralStats } from "~~/components/Referral/ReferralStats";
import { ReferralTree } from "~~/components/Referral/ReferralTree";
import { ClaimRewardsCard } from "~~/components/Referral/ClaimRewardsCard";
import { CreateCodeModal } from "~~/components/Referral/CreateCodeModal";
import { useReferralDashboard } from "~~/hooks/referral/useReferralData";
import { extractReferralCodeFromURL, storeReferralCode } from "~~/services/referral/code-generator";

export default function ReferralsPage() {
  const { address } = useAccount();
  const { stats, referees, tier, tierName, availableBonuses, isLoading, hasReferralCode, pendingRewards } =
    useReferralDashboard(address);

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Handle referral code from URL
  useEffect(() => {
    const codeFromURL = extractReferralCodeFromURL();
    if (codeFromURL) {
      storeReferralCode(codeFromURL);
    }
  }, []);

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Referral Program</h1>
          <p className="text-xl text-gray-600 mb-8">Connect your wallet to view your referral dashboard</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Referral Program</h1>
        <p className="text-xl text-gray-600">
          Invite friends to SusuChain and earn rewards together
        </p>
      </div>

      {/* Tier Badge */}
      {hasReferralCode && (
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full">
            <span className="text-2xl">
              {tier === 5 && "👑"}
              {tier === 4 && "💎"}
              {tier === 3 && "⭐"}
              {tier === 2 && "🔥"}
              {tier === 1 && "✨"}
              {tier === 0 && "🌱"}
            </span>
            <span className="font-bold text-lg">{tierName} Tier</span>
            {tier > 0 && (
              <span className="text-sm bg-white/20 px-2 py-1 rounded">
                {tier === 5 && "2x"}
                {tier === 4 && "1.75x"}
                {tier === 3 && "1.5x"}
                {tier === 2 && "1.25x"}
                {tier === 1 && "1.1x"} rewards
              </span>
            )}
          </div>
        </div>
      )}

      {/* Create Code Section */}
      {!hasReferralCode && (
        <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 mb-8">
          <div className="card-body text-center">
            <h2 className="card-title text-3xl mb-4 justify-center">Get Started</h2>
            <p className="text-lg text-gray-700 mb-6">
              Create your referral code to start inviting friends and earning rewards
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => setShowCreateModal(true)}>
              Create Referral Code
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {hasReferralCode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Code & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Referral Code Display */}
            <ReferralCodeDisplay code={stats?.referralCode || ""} />

            {/* Statistics */}
            <ReferralStats
              directReferrals={Number(stats?.directReferrals || 0)}
              indirectReferrals={Number(stats?.indirectReferrals || 0)}
              qualifiedReferrals={Number(stats?.qualifiedReferrals || 0)}
              totalRewards={Number(stats?.totalRewards || 0)}
              tier={tier}
            />

            {/* Referral Tree */}
            <ReferralTree referees={referees} address={address} />
          </div>

          {/* Right Column - Rewards */}
          <div className="space-y-6">
            <ClaimRewardsCard
              pendingRewards={pendingRewards}
              availableBonuses={availableBonuses}
            />

            {/* How it Works */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-xl mb-4">How it Works</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="badge badge-primary badge-lg">1</div>
                      <div>
                        <p className="font-semibold">Share your code</p>
                        <p className="text-sm text-gray-600">
                          Invite friends using your unique referral code
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start gap-3">
                      <div className="badge badge-primary badge-lg">2</div>
                      <div>
                        <p className="font-semibold">They join & contribute</p>
                        <p className="text-sm text-gray-600">
                          Friends complete 3 contributions within 30 days
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start gap-3">
                      <div className="badge badge-primary badge-lg">3</div>
                      <div>
                        <p className="font-semibold">Earn rewards</p>
                        <p className="text-sm text-gray-600">
                          Get 5% of their first contribution + bonuses
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Benefits */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-xl mb-4">Tier Benefits</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>🌱 Novice (0-2)</span>
                    <span className="font-semibold">1x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✨ Active (3-9)</span>
                    <span className="font-semibold">1.1x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔥 Pro (10-49)</span>
                    <span className="font-semibold">1.25x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>⭐ Expert (50-99)</span>
                    <span className="font-semibold">1.5x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💎 Elite (100-499)</span>
                    <span className="font-semibold">1.75x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>👑 Legend (500+)</span>
                    <span className="font-semibold">2x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Link */}
      <div className="text-center">
        <a href="/referrals/leaderboard" className="btn btn-outline btn-lg">
          View Leaderboard
        </a>
      </div>

      {/* Create Code Modal */}
      {showCreateModal && (
        <CreateCodeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
