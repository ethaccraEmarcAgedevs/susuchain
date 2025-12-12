"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useNFTMembership, getTierName, getTierGradient, MemberStats } from "~~/hooks/nft/useNFTMembership";
import { AchievementBadge } from "./AchievementBadge";

interface MembershipCardProps {
  address?: string;
  compact?: boolean;
}

export const MembershipCard = ({ address, compact = false }: MembershipCardProps) => {
  const { hasMembership, tokenId, stats, tokenURI, isLoading } = useNFTMembership(address);
  const [nftImage, setNftImage] = useState<string>("");

  useEffect(() => {
    if (tokenURI) {
      try {
        // Extract base64 JSON from data URI
        const base64Data = tokenURI.split(",")[1];
        const jsonString = atob(base64Data);
        const metadata = JSON.parse(jsonString);
        setNftImage(metadata.image);
      } catch (error) {
        console.error("Error parsing NFT metadata:", error);
      }
    }
  }, [tokenURI]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!hasMembership || !stats) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Membership NFT</h3>
        <p className="text-sm text-gray-600">Join a Susu group to mint your membership certificate</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className="rounded-lg p-4 text-white"
        style={{ background: getTierGradient(stats.currentTier) }}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏆</div>
          <div className="flex-1">
            <div className="text-sm opacity-90">Membership #{tokenId}</div>
            <div className="font-bold text-lg">{getTierName(stats.currentTier)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Contributions</div>
            <div className="font-bold text-xl">{stats.totalContributions.toString()}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* NFT Image */}
      {nftImage && (
        <div className="relative">
          <img
            src={nftImage}
            alt={`Membership NFT #${tokenId}`}
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Stats */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {getTierName(stats.currentTier)}
            </h3>
            <p className="text-sm text-gray-600">Membership #{tokenId}</p>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: getTierGradient(stats.currentTier) }}
          >
            {stats.currentTier === 4 ? "👑" : "🏆"}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatItem
            label="Contributions"
            value={stats.totalContributions.toString()}
            icon="💰"
          />
          <StatItem
            label="Groups Completed"
            value={stats.groupsCompleted.toString()}
            icon="✅"
          />
          <StatItem
            label="Reputation"
            value={`${stats.reputationScore.toString()}/100`}
            icon="⭐"
          />
          <StatItem
            label="Total Contributed"
            value={`${parseFloat(formatEther(stats.totalContributedETH)).toFixed(4)} ETH`}
            icon="💎"
          />
        </div>

        {/* Achievements */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Achievements</h4>
          <div className="flex flex-wrap gap-2">
            {stats.hasFirstBlood && (
              <AchievementBadge name="First Blood" icon="🎖️" />
            )}
            {stats.hasVeteran && (
              <AchievementBadge name="Veteran" icon="🎗️" />
            )}
            {stats.hasPerfectRecord && (
              <AchievementBadge name="Perfect Record" icon="⭐" />
            )}
            {stats.hasCommunityBuilder && (
              <AchievementBadge name="Community Builder" icon="👥" />
            )}
            {stats.hasWhale && (
              <AchievementBadge name="Whale" icon="🐋" />
            )}
          </div>
        </div>

        {/* Member Since */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Member since: {new Date(Number(stats.memberSince) * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">{icon}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
    <p className="text-lg font-bold text-gray-900">{value}</p>
  </div>
);
