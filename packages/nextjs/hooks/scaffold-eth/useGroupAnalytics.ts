import { useQuery } from "@apollo/client";
import { Address } from "viem";
import { GET_GROUP_ANALYTICS, GET_GROUP_HEALTH } from "~~/services/graphql/queries";

export interface GroupAnalytics {
  id: string;
  name: string;
  ensName: string;
  basename: string | null;
  creator: Address;
  contributionAmount: bigint;
  contributionInterval: bigint;
  maxMembers: number;
  currentMembers: number;
  currentRound: number;
  isActive: boolean;
  totalValueLocked: bigint;
  totalContributions: bigint;
  totalPayouts: bigint;
  createdAt: bigint;
  updatedAt: bigint;
  members: MemberAnalytics[];
  roundHistory: RoundData[];
  contributions: ContributionData[];
  payouts: PayoutData[];
}

export interface MemberAnalytics {
  id: string;
  address: Address;
  ensName: string;
  basename: string | null;
  joinedAt: bigint;
  isActive: boolean;
  totalContributions: bigint;
  totalPayoutsReceived: bigint;
  contributionCount: number;
  missedContributions: number;
  reliabilityScore: number;
}

export interface RoundData {
  id: string;
  roundNumber: number;
  beneficiary: Address;
  startTime: bigint;
  endTime: bigint | null;
  expectedContributions: number;
  actualContributions: number;
  totalAmount: bigint;
  isCompleted: boolean;
}

export interface ContributionData {
  id: string;
  member: {
    address: Address;
    ensName: string;
  };
  amount: bigint;
  timestamp: bigint;
  isOnTime: boolean;
}

export interface PayoutData {
  id: string;
  beneficiary: {
    address: Address;
    ensName: string;
  };
  amount: bigint;
  timestamp: bigint;
}

export interface GroupHealth {
  completionRate: number;
  averageReliabilityScore: number;
  activeParticipationRate: number;
  recentRoundPerformance: number[];
}

/**
 * Hook to fetch comprehensive analytics for a specific group
 */
export function useGroupAnalytics(groupAddress?: Address) {
  const { data, loading, error, refetch } = useQuery(GET_GROUP_ANALYTICS, {
    variables: { groupId: groupAddress?.toLowerCase() },
    skip: !groupAddress,
    pollInterval: 30000, // Poll every 30 seconds for updates
  });

  const groupAnalytics: GroupAnalytics | null = data?.group
    ? {
        ...data.group,
        contributionAmount: BigInt(data.group.contributionAmount),
        contributionInterval: BigInt(data.group.contributionInterval),
        totalValueLocked: BigInt(data.group.totalValueLocked),
        totalContributions: BigInt(data.group.totalContributions),
        totalPayouts: BigInt(data.group.totalPayouts),
        createdAt: BigInt(data.group.createdAt),
        updatedAt: BigInt(data.group.updatedAt),
        members: data.group.members.map((m: any) => ({
          ...m,
          joinedAt: BigInt(m.joinedAt),
          totalContributions: BigInt(m.totalContributions),
          totalPayoutsReceived: BigInt(m.totalPayoutsReceived),
        })),
        roundHistory: data.group.roundHistory.map((r: any) => ({
          ...r,
          startTime: BigInt(r.startTime),
          endTime: r.endTime ? BigInt(r.endTime) : null,
          totalAmount: BigInt(r.totalAmount),
        })),
        contributions: data.group.contributions.map((c: any) => ({
          ...c,
          amount: BigInt(c.amount),
          timestamp: BigInt(c.timestamp),
        })),
        payouts: data.group.payouts.map((p: any) => ({
          ...p,
          amount: BigInt(p.amount),
          timestamp: BigInt(p.timestamp),
        })),
      }
    : null;

  return {
    groupAnalytics,
    isLoading: loading,
    error,
    refetch,
  };
}

/**
 * Hook to calculate group health metrics
 */
export function useGroupHealth(groupAddress?: Address) {
  const { data, loading, error } = useQuery(GET_GROUP_HEALTH, {
    variables: { groupId: groupAddress?.toLowerCase() },
    skip: !groupAddress,
  });

  const calculateHealth = (): GroupHealth | null => {
    if (!data?.group) return null;

    const { roundHistory, members } = data.group;

    // Calculate completion rate
    const completedRounds = roundHistory.filter((r: any) => r.isCompleted).length;
    const completionRate = roundHistory.length > 0 ? (completedRounds / roundHistory.length) * 100 : 0;

    // Calculate average reliability score
    const totalReliability = members.reduce((sum: number, m: any) => sum + parseFloat(m.reliabilityScore), 0);
    const averageReliabilityScore = members.length > 0 ? totalReliability / members.length : 0;

    // Calculate active participation rate
    const activeMembers = members.filter((m: any) => m.isActive).length;
    const activeParticipationRate = members.length > 0 ? (activeMembers / members.length) * 100 : 0;

    // Recent round performance
    const recentRoundPerformance = roundHistory.slice(0, 5).map((r: any) => {
      return r.expectedContributions > 0 ? (r.actualContributions / r.expectedContributions) * 100 : 0;
    });

    return {
      completionRate,
      averageReliabilityScore,
      activeParticipationRate,
      recentRoundPerformance,
    };
  };

  return {
    health: calculateHealth(),
    isLoading: loading,
    error,
  };
}
