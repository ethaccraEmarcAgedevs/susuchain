"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { MembershipCard } from "~~/components/NFT";
import { useNFTMembership } from "~~/hooks/nft/useNFTMembership";
import { useAchievements } from "~~/hooks/nft/useAchievements";

const NFTGalleryPage = () => {
  const { address, isConnected } = useAccount();
  const { hasMembership, stats, mintMembership, isLoading } = useNFTMembership();
  const { achievements, unlockedCount, totalCount, progressPercentage } = useAchievements(stats);

  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async () => {
    setIsMinting(true);
    try {
      await mintMembership();
    } catch (error) {
      console.error("Error minting NFT:", error);
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">Connect your wallet to view your NFT membership certificate.</p>
            <Link href="/">
              <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Go Back Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading your membership...</span>
        </div>
      </div>
    );
  }

  if (!hasMembership) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🎖️</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Your Membership NFT</h2>
            <p className="text-lg text-gray-600 mb-8">
              Mint your unique NFT membership certificate to track your Susu journey and unlock achievements!
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Your NFT includes:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-xl">🏆</span>
                  <div>
                    <span className="font-medium">Dynamic Tier System</span>
                    <p className="text-sm text-gray-600">Bronze → Silver → Gold → Platinum → Trusted Elder</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <span className="font-medium">Live Statistics</span>
                    <p className="text-sm text-gray-600">Contributions, groups completed, and reputation score</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">🎯</span>
                  <div>
                    <span className="font-medium">Achievement Badges</span>
                    <p className="text-sm text-gray-600">Unlock special badges as you participate</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">🎨</span>
                  <div>
                    <span className="font-medium">Beautiful Design</span>
                    <p className="text-sm text-gray-600">SVG artwork that updates with your progress</p>
                  </div>
                </li>
              </ul>
            </div>
            <button
              onClick={handleMint}
              disabled={isMinting}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isMinting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Minting...
                </span>
              ) : (
                "Mint My NFT"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Membership NFT</h1>
          <p className="text-lg text-gray-600">Your dynamic certificate of participation in Susu groups</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NFT Card */}
          <div className="lg:col-span-2">
            <MembershipCard />
          </div>

          {/* Achievements */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
                <span className="text-sm font-medium text-gray-600">
                  {unlockedCount}/{totalCount}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{Math.round(progressPercentage)}% Complete</p>
              </div>

              {/* Achievement List */}
              <div className="space-y-3">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      achievement.unlocked
                        ? "border-purple-200 bg-purple-50"
                        : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{achievement.name}</h4>
                          {achievement.unlocked && (
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link href="/groups">
                  <button className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Join More Groups
                  </button>
                </Link>
                <Link href="/create-group">
                  <button className="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
                    Create a Group
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTGalleryPage;
