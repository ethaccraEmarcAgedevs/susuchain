import { useQuery } from "@apollo/client";
import { Address } from "viem";
import { GET_MEMBER_ANALYTICS } from "~~/services/graphql/queries";

export interface MemberGroupData {
  id: string;
  group: {
    id: string;
    name: string;
    ensName: string;
  };
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
  contributions: MemberContribution[];
  payoutsReceived: MemberPayout[];
}

export interface MemberContribution {
  id: string;
  amount: bigint;
  timestamp: bigint;
  isOnTime: boolean;
  round: {
    roundNumber: number;
  };
}

export interface MemberPayout {
  id: string;
  amount: bigint;
  timestamp: bigint;
  round: {
    roundNumber: number;
  };
}

export interface MemberSummary {
  totalGroups: number;
  activeGroups: number;
  totalSaved: bigint;
  totalReceived: bigint;
  netBalance: bigint;
  averageReliability: number;
  totalContributions: number;
  onTimeRate: number;
}

/**
 * Hook to fetch analytics for a specific member across all groups
 */
export function useMemberAnalytics(memberAddress?: Address) {
  const { data, loading, error, refetch } = useQuery(GET_MEMBER_ANALYTICS, {
    variables: { memberAddress: memberAddress?.toLowerCase() },
    skip: !memberAddress,
    pollInterval: 30000,
  });

  const memberGroups: MemberGroupData[] = data?.members
    ? data.members.map((member: any) => ({
        ...member,
        joinedAt: BigInt(member.joinedAt),
        totalContributions: BigInt(member.totalContributions),
        totalPayoutsReceived: BigInt(member.totalPayoutsReceived),
        reliabilityScore: parseFloat(member.reliabilityScore),
        contributions: member.contributions.map((c: any) => ({
          ...c,
          amount: BigInt(c.amount),
          timestamp: BigInt(c.timestamp),
        })),
        payoutsReceived: member.payoutsReceived.map((p: any) => ({
          ...p,
          amount: BigInt(p.amount),
          timestamp: BigInt(p.timestamp),
        })),
      }))
    : [];

  // Calculate member summary statistics
  const calculateSummary = (): MemberSummary | null => {
    if (memberGroups.length === 0) return null;

    const totalGroups = memberGroups.length;
    const activeGroups = memberGroups.filter(m => m.isActive).length;

    const totalSaved = memberGroups.reduce((sum, m) => sum + m.totalContributions, BigInt(0));
    const totalReceived = memberGroups.reduce((sum, m) => sum + m.totalPayoutsReceived, BigInt(0));
    const netBalance = totalSaved - totalReceived;

    const totalReliability = memberGroups.reduce((sum, m) => sum + m.reliabilityScore, 0);
    const averageReliability = totalReliability / memberGroups.length;

    const totalContributions = memberGroups.reduce((sum, m) => sum + m.contributionCount, 0);

    const allContributions = memberGroups.flatMap(m => m.contributions);
    const onTimeContributions = allContributions.filter(c => c.isOnTime).length;
    const onTimeRate = allContributions.length > 0 ? (onTimeContributions / allContributions.length) * 100 : 100;

    return {
      totalGroups,
      activeGroups,
      totalSaved,
      totalReceived,
      netBalance,
      averageReliability,
      totalContributions,
      onTimeRate,
    };
  };

  const memberSummary = calculateSummary();

  return {
    memberGroups,
    memberSummary,
    isLoading: loading,
    error,
    refetch,
  };
}

/**
 * Hook to get member reliability trend over time
 */
export function useMemberReliabilityTrend(memberAddress?: Address) {
  const { memberGroups, isLoading } = useMemberAnalytics(memberAddress);

  const reliabilityTrend = memberGroups.map(group => ({
    groupName: group.group.name,
    reliabilityScore: group.reliabilityScore,
    contributionCount: group.contributionCount,
    missedContributions: group.missedContributions,
  }));

  return {
    reliabilityTrend,
    isLoading,
  };
}
