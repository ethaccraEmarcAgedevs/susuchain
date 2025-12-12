import { MemberStats } from "./useNFTMembership";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export const useAchievements = (stats: MemberStats | null) => {
  if (!stats) {
    return {
      achievements: [],
      unlockedCount: 0,
      totalCount: 5,
      progressPercentage: 0,
    };
  }

  const achievements: Achievement[] = [
    {
      id: "first_blood",
      name: "First Blood",
      description: "Made your first contribution to a Susu group",
      icon: "🎖️",
      unlocked: stats.hasFirstBlood,
    },
    {
      id: "veteran",
      name: "Veteran",
      description: "Completed 10 or more Susu groups",
      icon: "🎗️",
      unlocked: stats.hasVeteran,
    },
    {
      id: "perfect_record",
      name: "Perfect Record",
      description: "Made 10+ contributions with zero late payments",
      icon: "⭐",
      unlocked: stats.hasPerfectRecord,
    },
    {
      id: "community_builder",
      name: "Community Builder",
      description: "Invited 5 or more members to join Susu groups",
      icon: "👥",
      unlocked: stats.hasCommunityBuilder,
    },
    {
      id: "whale",
      name: "Whale",
      description: "Contributed a total of 10 ETH or more",
      icon: "🐋",
      unlocked: stats.hasWhale,
    },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercentage = (unlockedCount / totalCount) * 100;

  return {
    achievements,
    unlockedCount,
    totalCount,
    progressPercentage,
  };
};

export const getAchievementProgress = (stats: MemberStats | null) => {
  if (!stats) return {};

  return {
    first_blood: {
      current: Number(stats.totalContributions),
      target: 1,
      progress: Number(stats.totalContributions) >= 1 ? 100 : (Number(stats.totalContributions) / 1) * 100,
    },
    veteran: {
      current: Number(stats.groupsCompleted),
      target: 10,
      progress: Math.min((Number(stats.groupsCompleted) / 10) * 100, 100),
    },
    perfect_record: {
      current: Number(stats.totalContributions),
      target: 10,
      latePayments: Number(stats.latePayments),
      progress:
        Number(stats.latePayments) === 0 && Number(stats.totalContributions) >= 10
          ? 100
          : (Number(stats.totalContributions) / 10) * 100,
    },
    community_builder: {
      current: Number(stats.membersInvited),
      target: 5,
      progress: Math.min((Number(stats.membersInvited) / 5) * 100, 100),
    },
    whale: {
      current: Number(stats.totalContributedETH) / 1e18,
      target: 10,
      progress: Math.min((Number(stats.totalContributedETH) / 1e18 / 10) * 100, 100),
    },
  };
};
