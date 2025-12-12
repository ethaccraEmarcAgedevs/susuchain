"use client";

import { Tier, getTierName, getTierColor } from "~~/hooks/nft/useNFTMembership";

interface TierIndicatorProps {
  tier: Tier;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const TierIndicator = ({ tier, size = "md", showLabel = true }: TierIndicatorProps) => {
  const tierName = getTierName(tier);
  const tierColor = getTierColor(tier);

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  const getTierIcon = (t: Tier): string => {
    switch (t) {
      case Tier.TrustedElder:
        return "👑";
      case Tier.Platinum:
        return "💎";
      case Tier.Gold:
        return "🏆";
      case Tier.Silver:
        return "🥈";
      case Tier.Bronze:
      default:
        return "🥉";
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-lg`}
        style={{ backgroundColor: tierColor }}
      >
        <span>{getTierIcon(tier)}</span>
      </div>
      {showLabel && (
        <span className="font-semibold text-gray-700">{tierName}</span>
      )}
    </div>
  );
};
