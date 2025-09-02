import { Address } from "viem";

export interface EFPProfile {
  address: Address;
  handle?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  reputation: ReputationScore;
  tags: string[];
  joinedAt?: Date;
}

export interface ReputationScore {
  total: number;
  breakdown: {
    susuParticipation: number;
    paymentReliability: number;
    communityTrust: number;
    socialScore: number;
  };
  level: "NEW" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
}

export interface SusuReputation {
  totalGroups: number;
  completedGroups: number;
  totalContributions: number;
  onTimePayments: number;
  latePayments: number;
  missedPayments: number;
  averageGroupSize: number;
  trustScore: number; // 0-100
}

// Mock EFP API - In production this would connect to the actual EFP protocol
class EFPService {
  private baseUrl = "https://api.efp.eth"; // Mock URL
  private cache = new Map<string, EFPProfile>();

  async getProfile(address: Address): Promise<EFPProfile | null> {
    try {
      // Check cache first
      const cached = this.cache.get(address);
      if (cached) return cached;

      // For now, return mock data since EFP is still in development
      const mockProfile = this.generateMockProfile(address);

      // In production, this would be:
      // const response = await fetch(`${this.baseUrl}/profile/${address}`);
      // const profile = await response.json();

      this.cache.set(address, mockProfile);
      return mockProfile;
    } catch (error) {
      console.error("Error fetching EFP profile:", error);
      return null;
    }
  }

  async updateProfile(address: Address, updates: Partial<EFPProfile>): Promise<boolean> {
    try {
      // In production, this would submit a transaction to update the profile
      const existingProfile = await this.getProfile(address);
      if (!existingProfile) return false;

      const updatedProfile = { ...existingProfile, ...updates };
      this.cache.set(address, updatedProfile);

      return true;
    } catch (error) {
      console.error("Error updating EFP profile:", error);
      return false;
    }
  }

  async updateSusuReputation(address: Address, reputationData: Partial<SusuReputation>): Promise<boolean> {
    try {
      const profile = await this.getProfile(address);
      if (!profile) return false;

      // Update reputation based on Susu activity
      const updatedReputation = this.calculateReputation(reputationData);
      profile.reputation = updatedReputation;

      this.cache.set(address, profile);
      return true;
    } catch (error) {
      console.error("Error updating Susu reputation:", error);
      return false;
    }
  }

  async verifyProfile(address: Address): Promise<boolean> {
    try {
      // In production, this would perform verification checks
      // such as checking for ENS ownership, social media verification, etc.
      const profile = await this.getProfile(address);
      if (!profile) return false;

      profile.verified = true;
      this.cache.set(address, profile);

      return true;
    } catch (error) {
      console.error("Error verifying profile:", error);
      return false;
    }
  }

  async getFollowers(address: Address): Promise<Address[]> {
    try {
      console.log("Fetching followers for:", address);
      // Mock followers data
      return [
        "0x1234567890123456789012345678901234567890" as Address,
        "0x2345678901234567890123456789012345678901" as Address,
      ];
    } catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
  }

  async getFollowing(address: Address): Promise<Address[]> {
    try {
      console.log("Fetching following for:", address);
      // Mock following data
      return [
        "0x3456789012345678901234567890123456789012" as Address,
        "0x4567890123456789012345678901234567890123" as Address,
      ];
    } catch (error) {
      console.error("Error fetching following:", error);
      return [];
    }
  }

  private generateMockProfile(address: Address): EFPProfile {
    // Generate deterministic mock data based on address
    const hash = address.slice(2, 10);
    const num = parseInt(hash, 16);

    const handles = ["susu_member", "savings_guru", "trad_saver", "community_leader", "trusty_saver"];
    const locations = ["Accra", "Kumasi", "Tamale", "Cape Coast", "Tema"];

    return {
      address,
      handle: `${handles[num % handles.length]}_${hash.slice(0, 4)}`,
      bio: "Traditional savings enthusiast participating in Susu groups",
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
      location: locations[num % locations.length],
      verified: num % 3 === 0, // 33% verified rate
      followersCount: (num % 100) + 5,
      followingCount: (num % 50) + 3,
      reputation: this.calculateReputation({
        totalGroups: (num % 10) + 1,
        completedGroups: (num % 8) + 1,
        totalContributions: (num % 50) + 5,
        onTimePayments: (num % 40) + 5,
        latePayments: num % 3,
        missedPayments: num % 2,
        trustScore: Math.min(95, (num % 80) + 20),
      }),
      tags: this.generateTags(address),
      joinedAt: new Date(Date.now() - (num % 365) * 24 * 60 * 60 * 1000),
    };
  }

  private calculateReputation(susuData: Partial<SusuReputation>): ReputationScore {
    const {
      totalGroups = 0,
      completedGroups = 0,
      totalContributions = 0,
      onTimePayments = 0,
      latePayments = 0,
      missedPayments = 0,
      trustScore = 50,
    } = susuData;

    // Calculate penalty impact from late/missed payments
    const penaltyImpact = latePayments * 0.5 + missedPayments * 2.0;
    console.log("Payment behavior analysis:", { latePayments, missedPayments, penaltyImpact });

    // Calculate individual components
    const susuParticipation = Math.min(100, (completedGroups / Math.max(1, totalGroups)) * 100);
    const paymentReliability = totalContributions > 0 ? Math.min(100, (onTimePayments / totalContributions) * 100) : 0;
    const communityTrust = trustScore;
    const socialScore = Math.min(100, totalGroups * 10 + completedGroups * 15);

    const total = Math.round(
      susuParticipation * 0.3 + paymentReliability * 0.3 + communityTrust * 0.2 + socialScore * 0.2,
    );

    let level: ReputationScore["level"] = "NEW";
    if (total >= 80) level = "PLATINUM";
    else if (total >= 60) level = "GOLD";
    else if (total >= 40) level = "SILVER";
    else if (total >= 20) level = "BRONZE";

    return {
      total,
      breakdown: {
        susuParticipation: Math.round(susuParticipation),
        paymentReliability: Math.round(paymentReliability),
        communityTrust: Math.round(communityTrust),
        socialScore: Math.round(socialScore),
      },
      level,
    };
  }

  private generateTags(address: Address): string[] {
    const allTags = [
      "susu-veteran",
      "reliable-payer",
      "group-organizer",
      "community-builder",
      "savings-expert",
      "trusted-member",
      "early-adopter",
      "ghana-based",
      "weekly-contributor",
    ];

    const hash = address.slice(2, 10);
    const num = parseInt(hash, 16);
    const tagCount = (num % 4) + 1;

    const shuffled = allTags.sort(() => (num % 3) - 1);
    return shuffled.slice(0, tagCount);
  }
}

// Export singleton instance
export const efpService = new EFPService();

// Helper functions
export const getReputationColor = (level: ReputationScore["level"]): string => {
  switch (level) {
    case "PLATINUM":
      return "text-purple-600 bg-purple-100";
    case "GOLD":
      return "text-yellow-600 bg-yellow-100";
    case "SILVER":
      return "text-gray-600 bg-gray-100";
    case "BRONZE":
      return "text-orange-600 bg-orange-100";
    default:
      return "text-blue-600 bg-blue-100";
  }
};

export const getReputationIcon = (level: ReputationScore["level"]): string => {
  switch (level) {
    case "PLATINUM":
      return "💎";
    case "GOLD":
      return "🥇";
    case "SILVER":
      return "🥈";
    case "BRONZE":
      return "🥉";
    default:
      return "🌟";
  }
};

export const formatReputationScore = (score: number): string => {
  return `${score}/100`;
};

export const getTrustLevel = (trustScore: number): string => {
  if (trustScore >= 90) return "Excellent";
  if (trustScore >= 75) return "Very Good";
  if (trustScore >= 60) return "Good";
  if (trustScore >= 40) return "Fair";
  return "Building Trust";
};

export const isEFPProfileComplete = (profile: EFPProfile): boolean => {
  return !!(profile.handle && profile.bio && profile.avatar && profile.location);
};

// Export types and service
export default efpService;
