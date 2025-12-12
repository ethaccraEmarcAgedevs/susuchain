"use client";

interface AchievementBadgeProps {
  name: string;
  icon: string;
  description?: string;
  unlocked?: boolean;
}

export const AchievementBadge = ({
  name,
  icon,
  description,
  unlocked = true,
}: AchievementBadgeProps) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        unlocked
          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md"
          : "bg-gray-200 text-gray-400 opacity-50"
      }`}
      title={description}
    >
      <span className="text-base">{icon}</span>
      <span>{name}</span>
    </div>
  );
};
