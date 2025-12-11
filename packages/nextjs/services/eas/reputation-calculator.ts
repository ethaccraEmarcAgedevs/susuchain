import { Address } from "viem";
import { AttestationData, ContributionAttestation, VouchAttestation } from "./eas-client";

export interface ReputationScore {
  total: number;
  breakdown: {
    onTimeContributions: number;
    trustedVouches: number;
    groupCompletions: number;
    ecosystemTenure: number;
    communityFlags: number;
  };
  tier: "Newcomer" | "Reliable" | "Trusted" | "Elite";
  badges: string[];
}

export interface ReputationMetrics {
  totalContributions: number;
  onTimeContributions: number;
  lateContributions: number;
  missedContributions: number;
  vouchesReceived: number;
  vouchesGiven: number;
  groupsCompleted: number;
  groupsActive: number;
  accountAge: number; // in days
  communityFlags: number;
}

// Scoring weights (must sum to 100)
const WEIGHTS = {
  ON_TIME_CONTRIBUTIONS: 40,
  TRUSTED_VOUCHES: 25,
  GROUP_COMPLETIONS: 20,
  ECOSYSTEM_TENURE: 10,
  COMMUNITY_FLAGS: 5, // Negative impact
};

// Tier thresholds
const TIER_THRESHOLDS = {
  ELITE: 85,
  TRUSTED: 70,
  RELIABLE: 50,
  NEWCOMER: 0,
};

// Badge criteria
const BADGE_CRITERIA = {
  PERFECT_RECORD: (m: ReputationMetrics) => m.onTimeContributions >= 10 && m.lateContributions === 0,
  COMMUNITY_BUILDER: (m: ReputationMetrics) => m.vouchesGiven >= 5,
  TRUSTED_MEMBER: (m: ReputationMetrics) => m.vouchesReceived >= 10,
  VETERAN: (m: ReputationMetrics) => m.groupsCompleted >= 5,
  PIONEER: (m: ReputationMetrics) => m.accountAge >= 180, // 6 months
  HUNDRED_PERCENT: (m: ReputationMetrics) =>
    m.totalContributions > 0 && m.onTimeContributions === m.totalContributions,
};

/**
 * Calculate comprehensive reputation score
 */
export function calculateReputationScore(metrics: ReputationMetrics): ReputationScore {
  const breakdown = {
    onTimeContributions: calculateOnTimeScore(metrics),
    trustedVouches: calculateVouchScore(metrics),
    groupCompletions: calculateCompletionScore(metrics),
    ecosystemTenure: calculateTenureScore(metrics),
    communityFlags: calculateFlagPenalty(metrics),
  };

  const total = Math.max(
    0,
    Math.min(
      100,
      breakdown.onTimeContributions +
        breakdown.trustedVouches +
        breakdown.groupCompletions +
        breakdown.ecosystemTenure -
        breakdown.communityFlags,
    ),
  );

  const tier = determineTier(total);
  const badges = determineBadges(metrics);

  return {
    total,
    breakdown,
    tier,
    badges,
  };
}

/**
 * Calculate on-time contribution score (40% weight)
 */
function calculateOnTimeScore(metrics: ReputationMetrics): number {
  if (metrics.totalContributions === 0) return 0;

  const onTimeRate = metrics.onTimeContributions / metrics.totalContributions;
  const baseScore = onTimeRate * WEIGHTS.ON_TIME_CONTRIBUTIONS;

  // Bonus for perfect record
  const perfectBonus = onTimeRate === 1.0 && metrics.totalContributions >= 5 ? 5 : 0;

  return Math.min(WEIGHTS.ON_TIME_CONTRIBUTIONS, baseScore + perfectBonus);
}

/**
 * Calculate vouch score (25% weight)
 */
function calculateVouchScore(metrics: ReputationMetrics): number {
  // Diminishing returns after 10 vouches
  const effectiveVouches = Math.min(metrics.vouchesReceived, 10);
  const vouchScore = (effectiveVouches / 10) * WEIGHTS.TRUSTED_VOUCHES;

  // Bonus for being a voucher yourself (community builder)
  const voucherBonus = Math.min(metrics.vouchesGiven, 5) * 0.5;

  return Math.min(WEIGHTS.TRUSTED_VOUCHES, vouchScore + voucherBonus);
}

/**
 * Calculate group completion score (20% weight)
 */
function calculateCompletionScore(metrics: ReputationMetrics): number {
  // Diminishing returns after 5 completed groups
  const effectiveCompletions = Math.min(metrics.groupsCompleted, 5);
  const baseScore = (effectiveCompletions / 5) * WEIGHTS.GROUP_COMPLETIONS;

  // Penalty for abandoned groups (active groups that didn't complete)
  const abandonmentRate =
    metrics.groupsActive > 0 ? (metrics.groupsActive - metrics.groupsCompleted) / metrics.groupsActive : 0;
  const penalty = abandonmentRate * 5;

  return Math.max(0, baseScore - penalty);
}

/**
 * Calculate ecosystem tenure score (10% weight)
 */
function calculateTenureScore(metrics: ReputationMetrics): number {
  // Full score at 1 year (365 days)
  const maxDays = 365;
  const tenureRate = Math.min(metrics.accountAge / maxDays, 1);

  return tenureRate * WEIGHTS.ECOSYSTEM_TENURE;
}

/**
 * Calculate community flag penalty (5% max penalty)
 */
function calculateFlagPenalty(metrics: ReputationMetrics): number {
  // Each flag is worth 2.5% penalty, max 2 flags considered
  const effectiveFlags = Math.min(metrics.communityFlags, 2);
  return effectiveFlags * 2.5;
}

/**
 * Determine reputation tier based on score
 */
function determineTier(score: number): ReputationScore["tier"] {
  if (score >= TIER_THRESHOLDS.ELITE) return "Elite";
  if (score >= TIER_THRESHOLDS.TRUSTED) return "Trusted";
  if (score >= TIER_THRESHOLDS.RELIABLE) return "Reliable";
  return "Newcomer";
}

/**
 * Determine earned badges based on metrics
 */
function determineBadges(metrics: ReputationMetrics): string[] {
  const badges: string[] = [];

  if (BADGE_CRITERIA.PERFECT_RECORD(metrics)) {
    badges.push("Perfect Record");
  }
  if (BADGE_CRITERIA.HUNDRED_PERCENT(metrics)) {
    badges.push("100% On-Time");
  }
  if (BADGE_CRITERIA.COMMUNITY_BUILDER(metrics)) {
    badges.push("Community Builder");
  }
  if (BADGE_CRITERIA.TRUSTED_MEMBER(metrics)) {
    badges.push("Trusted Member");
  }
  if (BADGE_CRITERIA.VETERAN(metrics)) {
    badges.push("Veteran");
  }
  if (BADGE_CRITERIA.PIONEER(metrics)) {
    badges.push("Pioneer");
  }

  return badges;
}

/**
 * Get tier benefits description
 */
export function getTierBenefits(tier: ReputationScore["tier"]): string[] {
  const benefits: Record<ReputationScore["tier"], string[]> = {
    Newcomer: ["Access to basic groups", "Standard contribution terms"],
    Reliable: ["Priority in group matching", "Lower collateral requirements", "Access to medium-value groups"],
    Trusted: [
      "Create private groups",
      "Reduced fees (10% discount)",
      "Access to high-value groups",
      "Dispute resolution priority",
    ],
    Elite: [
      "Maximum fee discount (25%)",
      "Create elite-only groups",
      "Governance voting rights",
      "Early access to new features",
      "Premium support",
    ],
  };

  return benefits[tier];
}

/**
 * Calculate reputation trend (improving, stable, declining)
 */
export function calculateReputationTrend(
  currentMetrics: ReputationMetrics,
  previousMetrics: ReputationMetrics,
): "improving" | "stable" | "declining" {
  const currentScore = calculateReputationScore(currentMetrics).total;
  const previousScore = calculateReputationScore(previousMetrics).total;

  const difference = currentScore - previousScore;

  if (difference > 2) return "improving";
  if (difference < -2) return "declining";
  return "stable";
}

/**
 * Get recommendation for improving reputation
 */
export function getReputationRecommendations(metrics: ReputationMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.onTimeContributions / Math.max(metrics.totalContributions, 1) < 0.8) {
    recommendations.push("Make more on-time contributions to improve your reliability score");
  }

  if (metrics.vouchesReceived < 5) {
    recommendations.push("Participate actively to earn vouches from trusted members");
  }

  if (metrics.groupsCompleted < 3) {
    recommendations.push("Complete more group cycles to build your track record");
  }

  if (metrics.vouchesGiven < 3) {
    recommendations.push("Vouch for reliable members to become a community builder");
  }

  if (recommendations.length === 0) {
    recommendations.push("Keep up the excellent work! Your reputation is strong.");
  }

  return recommendations;
}
