import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export enum Tier {
  Bronze = 0,
  Silver = 1,
  Gold = 2,
  Platinum = 3,
  TrustedElder = 4,
}

export interface MemberStats {
  totalContributions: bigint;
  groupsCompleted: bigint;
  reputationScore: bigint;
  memberSince: bigint;
  totalContributedETH: bigint;
  latePayments: bigint;
  membersInvited: bigint;
  currentTier: Tier;
  hasFirstBlood: boolean;
  hasVeteran: boolean;
  hasPerfectRecord: boolean;
  hasCommunityBuilder: boolean;
  hasWhale: boolean;
}

export const useNFTMembership = (memberAddress?: string) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = memberAddress || connectedAddress;

  // Check if user has membership NFT
  const { data: hasMembership, isLoading: isCheckingMembership } = useScaffoldReadContract({
    contractName: "SusuMembershipNFT",
    functionName: "hasMembership",
    args: [targetAddress],
  });

  // Get token ID
  const { data: tokenId } = useScaffoldReadContract({
    contractName: "SusuMembershipNFT",
    functionName: "addressToTokenId",
    args: [targetAddress],
  });

  // Get member stats
  const { data: memberStats, refetch: refetchStats } = useScaffoldReadContract({
    contractName: "SusuMembershipNFT",
    functionName: "getMemberStats",
    args: [targetAddress],
    query: {
      enabled: !!hasMembership && !!targetAddress,
    },
  });

  // Get token URI
  const { data: tokenURI } = useScaffoldReadContract({
    contractName: "SusuMembershipNFT",
    functionName: "tokenURI",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  // Mint membership NFT
  const { writeContractAsync: mintMembership } = useScaffoldWriteContract("SusuMembershipNFT");

  const handleMintMembership = async () => {
    if (!targetAddress) return;

    try {
      await mintMembership({
        functionName: "mintMembership",
        args: [targetAddress],
      });
      await refetchStats();
    } catch (error) {
      console.error("Error minting membership:", error);
      throw error;
    }
  };

  // Parse stats into readable format
  const stats: MemberStats | null = memberStats
    ? {
        totalContributions: memberStats[0] as bigint,
        groupsCompleted: memberStats[1] as bigint,
        reputationScore: memberStats[2] as bigint,
        memberSince: memberStats[3] as bigint,
        totalContributedETH: memberStats[4] as bigint,
        latePayments: memberStats[5] as bigint,
        membersInvited: memberStats[6] as bigint,
        currentTier: memberStats[7] as Tier,
        hasFirstBlood: memberStats[8] as boolean,
        hasVeteran: memberStats[9] as boolean,
        hasPerfectRecord: memberStats[10] as boolean,
        hasCommunityBuilder: memberStats[11] as boolean,
        hasWhale: memberStats[12] as boolean,
      }
    : null;

  return {
    hasMembership: !!hasMembership,
    tokenId: tokenId ? Number(tokenId) : null,
    stats,
    tokenURI: tokenURI as string | undefined,
    isLoading: isCheckingMembership,
    mintMembership: handleMintMembership,
    refetchStats,
  };
};

export const getTierName = (tier: Tier): string => {
  switch (tier) {
    case Tier.TrustedElder:
      return "Trusted Elder";
    case Tier.Platinum:
      return "Platinum";
    case Tier.Gold:
      return "Gold";
    case Tier.Silver:
      return "Silver";
    case Tier.Bronze:
    default:
      return "Bronze";
  }
};

export const getTierColor = (tier: Tier): string => {
  switch (tier) {
    case Tier.TrustedElder:
      return "#9333ea"; // Purple
    case Tier.Platinum:
      return "#e5e7eb"; // Platinum
    case Tier.Gold:
      return "#fbbf24"; // Gold
    case Tier.Silver:
      return "#94a3b8"; // Silver
    case Tier.Bronze:
    default:
      return "#cd7f32"; // Bronze
  }
};

export const getTierGradient = (tier: Tier): string => {
  const color = getTierColor(tier);
  return `linear-gradient(135deg, ${color}, #1e40af)`;
};
