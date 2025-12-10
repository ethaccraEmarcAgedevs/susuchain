import { useEffect, useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import {
  calculateReputationScore,
  getReputationRecommendations,
  getTierBenefits,
  ReputationMetrics,
  ReputationScore,
} from "~~/services/eas/reputation-calculator";

/**
 * Hook to get and manage user reputation
 */
export function useReputation(userAddress?: Address) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = userAddress || connectedAddress;

  const [metrics, setMetrics] = useState<ReputationMetrics>({
    totalContributions: 0,
    onTimeContributions: 0,
    lateContributions: 0,
    missedContributions: 0,
    vouchesReceived: 0,
    vouchesGiven: 0,
    groupsCompleted: 0,
    groupsActive: 0,
    accountAge: 0,
    communityFlags: 0,
  });

  const [score, setScore] = useState<ReputationScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReputation() {
      if (!targetAddress) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // In production, fetch real metrics from EAS attestations and subgraph
        // For now, use mock data based on user activity
        const mockMetrics: ReputationMetrics = {
          totalContributions: 0,
          onTimeContributions: 0,
          lateContributions: 0,
          missedContributions: 0,
          vouchesReceived: 0,
          vouchesGiven: 0,
          groupsCompleted: 0,
          groupsActive: 0,
          accountAge: 0,
          communityFlags: 0,
        };

        setMetrics(mockMetrics);

        const calculatedScore = calculateReputationScore(mockMetrics);
        setScore(calculatedScore);
      } catch (error) {
        console.error("Error fetching reputation:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReputation();
  }, [targetAddress]);

  const recommendations = score ? getReputationRecommendations(metrics) : [];
  const tierBenefits = score ? getTierBenefits(score.tier) : [];

  return {
    metrics,
    score,
    recommendations,
    tierBenefits,
    isLoading,
  };
}

/**
 * Hook to get reputation leaderboard
 */
export function useReputationLeaderboard(limit: number = 10) {
  const [leaderboard, setLeaderboard] = useState<Array<{ address: Address; score: number; tier: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);

      try {
        // In production, fetch from subgraph or backend API
        // For now, return empty array
        setLeaderboard([]);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [limit]);

  return {
    leaderboard,
    isLoading,
  };
}
