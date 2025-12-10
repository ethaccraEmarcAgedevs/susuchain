"use client";

import { Address } from "viem";
import { useReputation } from "~~/hooks/scaffold-eth/useReputation";

interface ReputationBadgeProps {
  address: Address;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ReputationBadge({
  address,
  showScore = true,
  size = "md",
  className = "",
}: ReputationBadgeProps) {
  const { score, isLoading } = useReputation(address);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-full h-5 w-16"></div>
      </div>
    );
  }

  if (!score) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <span className="text-xs text-gray-400">No reputation</span>
      </div>
    );
  }

  const tierColors = {
    Newcomer: "bg-gray-100 text-gray-700 border-gray-300",
    Reliable: "bg-blue-100 text-blue-700 border-blue-300",
    Trusted: "bg-purple-100 text-purple-700 border-purple-300",
    Elite: "bg-yellow-100 text-yellow-700 border-yellow-300",
  };

  const tierIcons = {
    Newcomer: "🌱",
    Reliable: "✅",
    Trusted: "⭐",
    Elite: "👑",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded-full border font-medium ${tierColors[score.tier]} ${sizes[size]}`}
      >
        <span>{tierIcons[score.tier]}</span>
        <span>{score.tier}</span>
        {showScore && <span className="ml-1">({score.total.toFixed(0)})</span>}
      </span>
    </div>
  );
}
