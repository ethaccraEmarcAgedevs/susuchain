import { useQuery } from "@apollo/client";
import {
  GET_PLATFORM_STATS,
  GET_DAILY_STATS,
  GET_WEEKLY_STATS,
  GET_MONTHLY_STATS,
  GET_TOP_GROUPS,
} from "~~/services/graphql/queries";

export interface PlatformStats {
  totalGroups: number;
  activeGroups: number;
  completedGroups: number;
  totalMembers: number;
  totalValueLocked: bigint;
  totalContributions: bigint;
  totalPayouts: bigint;
  averageGroupSize: number;
  averageContributionAmount: bigint;
  updatedAt: bigint;
}

export interface DailyStats {
  id: string;
  date: string;
  timestamp: bigint;
  groupsCreated: number;
  membersJoined: number;
  contributionsMade: number;
  contributionVolume: bigint;
  payoutsCompleted: number;
  payoutVolume: bigint;
  activeGroups: number;
  totalValueLocked: bigint;
}

export interface WeeklyStats {
  id: string;
  week: string;
  startTimestamp: bigint;
  endTimestamp: bigint;
  groupsCreated: number;
  membersJoined: number;
  contributionsMade: number;
  contributionVolume: bigint;
  payoutsCompleted: number;
  payoutVolume: bigint;
  averageGroupSize: number;
  memberRetention: number;
}

export interface MonthlyStats {
  id: string;
  month: string;
  startTimestamp: bigint;
  endTimestamp: bigint;
  groupsCreated: number;
  membersJoined: number;
  contributionsMade: number;
  contributionVolume: bigint;
  payoutsCompleted: number;
  payoutVolume: bigint;
  growthRate: number;
}

/**
 * Hook to fetch platform-wide statistics
 */
export function usePlatformStats() {
  const { data, loading, error, refetch } = useQuery(GET_PLATFORM_STATS, {
    pollInterval: 60000, // Poll every minute
  });

  const platformStats: PlatformStats | null = data?.platformStats
    ? {
        ...data.platformStats,
        totalValueLocked: BigInt(data.platformStats.totalValueLocked),
        totalContributions: BigInt(data.platformStats.totalContributions),
        totalPayouts: BigInt(data.platformStats.totalPayouts),
        averageGroupSize: parseFloat(data.platformStats.averageGroupSize),
        averageContributionAmount: BigInt(data.platformStats.averageContributionAmount),
        updatedAt: BigInt(data.platformStats.updatedAt),
      }
    : null;

  return {
    platformStats,
    isLoading: loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch daily statistics for charts
 */
export function useDailyStats(days: number = 30) {
  const { data, loading, error } = useQuery(GET_DAILY_STATS, {
    variables: {
      first: days,
      skip: 0,
      orderBy: "timestamp",
      orderDirection: "desc",
    },
  });

  const dailyStats: DailyStats[] = data?.dailyStats
    ? data.dailyStats.map((stat: any) => ({
        ...stat,
        timestamp: BigInt(stat.timestamp),
        contributionVolume: BigInt(stat.contributionVolume),
        payoutVolume: BigInt(stat.payoutVolume),
        totalValueLocked: BigInt(stat.totalValueLocked),
      }))
    : [];

  return {
    dailyStats,
    isLoading: loading,
    error,
  };
}

/**
 * Hook to fetch weekly statistics
 */
export function useWeeklyStats(weeks: number = 12) {
  const { data, loading, error } = useQuery(GET_WEEKLY_STATS, {
    variables: {
      first: weeks,
      orderDirection: "desc",
    },
  });

  const weeklyStats: WeeklyStats[] = data?.weeklyStats
    ? data.weeklyStats.map((stat: any) => ({
        ...stat,
        startTimestamp: BigInt(stat.startTimestamp),
        endTimestamp: BigInt(stat.endTimestamp),
        contributionVolume: BigInt(stat.contributionVolume),
        payoutVolume: BigInt(stat.payoutVolume),
        averageGroupSize: parseFloat(stat.averageGroupSize),
        memberRetention: parseFloat(stat.memberRetention),
      }))
    : [];

  return {
    weeklyStats,
    isLoading: loading,
    error,
  };
}

/**
 * Hook to fetch monthly statistics
 */
export function useMonthlyStats(months: number = 6) {
  const { data, loading, error } = useQuery(GET_MONTHLY_STATS, {
    variables: {
      first: months,
    },
  });

  const monthlyStats: MonthlyStats[] = data?.monthlyStats
    ? data.monthlyStats.map((stat: any) => ({
        ...stat,
        startTimestamp: BigInt(stat.startTimestamp),
        endTimestamp: BigInt(stat.endTimestamp),
        contributionVolume: BigInt(stat.contributionVolume),
        payoutVolume: BigInt(stat.payoutVolume),
        growthRate: parseFloat(stat.growthRate),
      }))
    : [];

  return {
    monthlyStats,
    isLoading: loading,
    error,
  };
}

/**
 * Hook to fetch top performing groups
 */
export function useTopGroups(count: number = 10) {
  const { data, loading, error } = useQuery(GET_TOP_GROUPS, {
    variables: {
      first: count,
    },
    pollInterval: 60000,
  });

  const topGroups = data?.groups
    ? data.groups.map((group: any) => ({
        ...group,
        contributionAmount: BigInt(group.contributionAmount),
        totalValueLocked: BigInt(group.totalValueLocked),
        totalContributions: BigInt(group.totalContributions),
        createdAt: BigInt(group.createdAt),
      }))
    : [];

  return {
    topGroups,
    isLoading: loading,
    error,
  };
}
