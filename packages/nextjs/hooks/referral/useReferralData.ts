import { useEffect, useState } from "react";
import { Address, formatEther } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

const chainId = 84532; // Base Sepolia

export interface ReferrerStats {
  referralCode: string;
  directReferrals: bigint;
  indirectReferrals: bigint;
  qualifiedReferrals: bigint;
  totalRewards: bigint;
  pendingRewards: bigint;
  claimedRewards: bigint;
  hasCustomCode: boolean;
}

export interface Referral {
  referrer: Address;
  referee: Address;
  timestamp: bigint;
  contributionCount: bigint;
  qualified: boolean;
  rewardsEarned: bigint;
  active: boolean;
}

/**
 * Hook to get referrer statistics
 */
export function useReferrerStats(address?: Address) {
  const { data: stats, isLoading } = useReadContract({
    address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
    abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
    functionName: "getReferrerStats",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    stats: stats as ReferrerStats | undefined,
    isLoading,
  };
}

/**
 * Hook to get referrer code by address
 */
export function useReferralCode(address?: Address) {
  const { data: code, isLoading } = useReadContract({
    address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
    abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
    functionName: "referrerToCode",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    code: code as string | undefined,
    isLoading,
  };
}

/**
 * Hook to get referrer address by code
 */
export function useReferrerByCode(code?: string) {
  const { data: referrerAddress, isLoading } = useReadContract({
    address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
    abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
    functionName: "codeToReferrer",
    args: code ? [code] : undefined,
    query: {
      enabled: !!code && code.length > 0,
    },
  });

  return {
    referrerAddress: referrerAddress as Address | undefined,
    isLoading,
    isValid: referrerAddress !== "0x0000000000000000000000000000000000000000",
  };
}

/**
 * Hook to get referral data for a referee
 */
export function useReferralData(address?: Address) {
  const { data: referral, isLoading } = useReadContract({
    address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
    abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
    functionName: "referrals",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    referral: referral as Referral | undefined,
    isLoading,
  };
}

/**
 * Hook to get all referees for a referrer
 */
export function useReferees(address?: Address) {
  const { data: referees, isLoading } = useReadContract({
    address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
    abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
    functionName: "getReferees",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    referees: (referees as Address[]) || [],
    isLoading,
  };
}

/**
 * Hook to check if referral is qualified
 */
export function useIsReferralQualified(address?: Address) {
  const { data: qualified, isLoading } = useReadContract({
    address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
    abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
    functionName: "isReferralQualified",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    qualified: qualified as boolean | undefined,
    isLoading,
  };
}

/**
 * Hook to check milestone bonus availability
 */
export function useMilestoneBonuses(address?: Address) {
  const contracts = [
    {
      address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
      abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
      functionName: "bonus10Claimed",
      args: address ? [address] : undefined,
    },
    {
      address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
      abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
      functionName: "bonus50Claimed",
      args: address ? [address] : undefined,
    },
  ];

  const { data, isLoading } = useReadContracts({
    contracts: contracts,
    query: {
      enabled: !!address,
    },
  });

  return {
    bonus10Claimed: data?.[0]?.result as boolean | undefined,
    bonus50Claimed: data?.[1]?.result as boolean | undefined,
    isLoading,
  };
}

/**
 * Hook to get complete referral dashboard data
 */
export function useReferralDashboard(address?: Address) {
  const { stats, isLoading: statsLoading } = useReferrerStats(address);
  const { referees, isLoading: refereesLoading } = useReferees(address);
  const { referral, isLoading: referralLoading } = useReferralData(address);
  const { bonus10Claimed, bonus50Claimed, isLoading: bonusLoading } = useMilestoneBonuses(address);

  const [tier, setTier] = useState<number>(0);
  const [tierName, setTierName] = useState<string>("Novice");

  useEffect(() => {
    if (stats) {
      const qualified = Number(stats.qualifiedReferrals);
      let calculatedTier = 0;
      let name = "Novice";

      if (qualified >= 500) {
        calculatedTier = 5;
        name = "Legend";
      } else if (qualified >= 100) {
        calculatedTier = 4;
        name = "Elite";
      } else if (qualified >= 50) {
        calculatedTier = 3;
        name = "Expert";
      } else if (qualified >= 10) {
        calculatedTier = 2;
        name = "Pro";
      } else if (qualified >= 3) {
        calculatedTier = 1;
        name = "Active";
      }

      setTier(calculatedTier);
      setTierName(name);
    }
  }, [stats]);

  const availableBonuses = [];
  if (stats && !bonus10Claimed && Number(stats.qualifiedReferrals) >= 10) {
    availableBonuses.push({ milestone: 10, amount: "0.1 ETH" });
  }
  if (stats && !bonus50Claimed && Number(stats.qualifiedReferrals) >= 50) {
    availableBonuses.push({ milestone: 50, amount: "1 ETH" });
  }

  return {
    stats,
    referees,
    referral,
    tier,
    tierName,
    availableBonuses,
    isLoading: statsLoading || refereesLoading || referralLoading || bonusLoading,
    hasReferralCode: stats?.referralCode && stats.referralCode.length > 0,
    pendingRewards: stats ? formatEther(stats.pendingRewards) : "0",
    totalRewards: stats ? formatEther(stats.totalRewards) : "0",
    claimedRewards: stats ? formatEther(stats.claimedRewards) : "0",
  };
}

/**
 * Hook to calculate estimated rewards
 */
export function useEstimatedRewards(contributionAmount: bigint, tier: number = 0) {
  const DIRECT_REWARD_RATE = 500; // 5%
  const BASIS_POINTS = 10000;

  const tierMultipliers: { [key: number]: number } = {
    0: 10000, // 1x
    1: 11000, // 1.1x
    2: 12500, // 1.25x
    3: 15000, // 1.5x
    4: 17500, // 1.75x
    5: 20000, // 2x
  };

  const baseReward = (contributionAmount * BigInt(DIRECT_REWARD_RATE)) / BigInt(BASIS_POINTS);
  const multiplier = tierMultipliers[tier] || 10000;
  const directReward = (baseReward * BigInt(multiplier)) / BigInt(BASIS_POINTS);

  return {
    directReward,
    directRewardFormatted: formatEther(directReward),
    multiplier: multiplier / 100, // Convert to percentage (e.g., 110 for 1.1x)
  };
}
