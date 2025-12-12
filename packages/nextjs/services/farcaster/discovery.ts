import { FarcasterUser, getFarcasterProfile, getMutualFollowers, checkFollowRelationship } from "./auth";

export interface SocialFilter {
  requireFarcaster?: boolean;
  minFollowers?: number;
  mutualFollowersWith?: number;
  followedBy?: number;
  inChannel?: string;
}

export interface GroupSocialScore {
  groupAddress: string;
  totalMembers: number;
  farcasterMembers: number;
  avgFollowerCount: number;
  mutualConnections: number;
  socialScore: number;
}

/**
 * Filter group members by Farcaster criteria
 */
export const filterMembersBySocial = async (
  memberAddresses: string[],
  filter: SocialFilter,
): Promise<string[]> => {
  const filteredMembers: string[] = [];

  for (const address of memberAddresses) {
    const meetsFilter = await checkMemberFilter(address, filter);
    if (meetsFilter) {
      filteredMembers.push(address);
    }
  }

  return filteredMembers;
};

/**
 * Check if a member meets social filter criteria
 */
const checkMemberFilter = async (address: string, filter: SocialFilter): Promise<boolean> => {
  try {
    // Import here to avoid circular dependency
    const { getFidByAddress } = await import("./auth");
    const fid = await getFidByAddress(address);

    if (filter.requireFarcaster && !fid) {
      return false;
    }

    if (!fid) {
      return !filter.requireFarcaster;
    }

    const profile = await getFarcasterProfile(fid);
    if (!profile) return false;

    // Check minimum followers
    if (filter.minFollowers && (profile.followerCount || 0) < filter.minFollowers) {
      return false;
    }

    // Check mutual followers
    if (filter.mutualFollowersWith) {
      const mutualFollowers = await getMutualFollowers(fid, filter.mutualFollowersWith);
      if (mutualFollowers.length === 0) {
        return false;
      }
    }

    // Check if followed by specific FID
    if (filter.followedBy) {
      const isFollowed = await checkFollowRelationship(filter.followedBy, fid);
      if (!isFollowed) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking member filter:", error);
    return false;
  }
};

/**
 * Calculate social score for a group
 */
export const calculateGroupSocialScore = async (
  groupAddress: string,
  memberAddresses: string[],
): Promise<GroupSocialScore> => {
  let farcasterMembers = 0;
  let totalFollowers = 0;
  const memberFids: number[] = [];

  // Import here to avoid circular dependency
  const { getFidByAddress } = await import("./auth");

  // Gather FIDs and follower counts
  for (const address of memberAddresses) {
    const fid = await getFidByAddress(address);
    if (fid) {
      farcasterMembers++;
      memberFids.push(fid);

      const profile = await getFarcasterProfile(fid);
      if (profile && profile.followerCount) {
        totalFollowers += profile.followerCount;
      }
    }
  }

  // Calculate mutual connections
  let mutualConnections = 0;
  for (let i = 0; i < memberFids.length; i++) {
    for (let j = i + 1; j < memberFids.length; j++) {
      const isFollowing = await checkFollowRelationship(memberFids[i], memberFids[j]);
      if (isFollowing) {
        mutualConnections++;
      }
    }
  }

  const avgFollowerCount = farcasterMembers > 0 ? totalFollowers / farcasterMembers : 0;

  // Calculate social score (0-100)
  // Formula: 40% Farcaster adoption + 30% avg followers (normalized) + 30% mutual connections (normalized)
  const adoptionScore = (farcasterMembers / memberAddresses.length) * 40;
  const followerScore = Math.min((avgFollowerCount / 1000) * 30, 30); // Normalized to 1000 followers = max score
  const connectionScore = Math.min((mutualConnections / memberAddresses.length) * 30, 30);

  const socialScore = Math.round(adoptionScore + followerScore + connectionScore);

  return {
    groupAddress,
    totalMembers: memberAddresses.length,
    farcasterMembers,
    avgFollowerCount: Math.round(avgFollowerCount),
    mutualConnections,
    socialScore,
  };
};

/**
 * Get recommended groups based on user's Farcaster network
 */
export const getRecommendedGroups = async (
  userFid: number,
  allGroupAddresses: string[],
  getMembersFunction: (groupAddress: string) => Promise<string[]>,
): Promise<string[]> => {
  const recommendations: { groupAddress: string; score: number }[] = [];

  for (const groupAddress of allGroupAddresses) {
    const members = await getMembersFunction(groupAddress);
    let score = 0;

    // Import here to avoid circular dependency
    const { getFidByAddress } = await import("./auth");

    // Calculate score based on connections
    for (const memberAddress of members) {
      const memberFid = await getFidByAddress(memberAddress);
      if (!memberFid) continue;

      // Check if user follows this member
      const isFollowing = await checkFollowRelationship(userFid, memberFid);
      if (isFollowing) {
        score += 10;
      }

      // Check mutual followers
      const mutualFollowers = await getMutualFollowers(userFid, memberFid);
      score += mutualFollowers.length * 2;
    }

    if (score > 0) {
      recommendations.push({ groupAddress, score });
    }
  }

  // Sort by score and return addresses
  return recommendations.sort((a, b) => b.score - a.score).map(r => r.groupAddress);
};

/**
 * Get Farcaster user profiles for group members
 */
export const getGroupFarcasterProfiles = async (
  memberAddresses: string[],
): Promise<Map<string, FarcasterUser>> => {
  const profiles = new Map<string, FarcasterUser>();

  // Import here to avoid circular dependency
  const { getFidByAddress } = await import("./auth");

  for (const address of memberAddresses) {
    const fid = await getFidByAddress(address);
    if (fid) {
      const profile = await getFarcasterProfile(fid);
      if (profile) {
        profiles.set(address, profile);
      }
    }
  }

  return profiles;
};

/**
 * Search for users by Farcaster username
 */
export const searchFarcasterUsers = async (query: string, limit = 10): Promise<FarcasterUser[]> => {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: {
          accept: "application/json",
          api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to search Farcaster users");
    }

    const data = await response.json();

    return data.result.users.map((user: any) => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text || "",
      custody: user.custody_address,
      verifications: user.verifications || [],
      followerCount: user.follower_count,
      followingCount: user.following_count,
    }));
  } catch (error) {
    console.error("Error searching Farcaster users:", error);
    return [];
  }
};

/**
 * Get channel members
 */
export const getChannelMembers = async (channelId: string): Promise<number[]> => {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/channel/members?id=${channelId}&limit=1000`,
      {
        headers: {
          accept: "application/json",
          api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.members.map((member: { fid: number }) => member.fid);
  } catch (error) {
    console.error("Error getting channel members:", error);
    return [];
  }
};
