"use client";

import { useState, useEffect } from "react";
import { getFarcasterProfile, FarcasterUser } from "~~/services/farcaster/auth";
import { filterMembersBySocial, SocialFilter } from "~~/services/farcaster/discovery";

interface FarcasterFiltersProps {
  onFilterChange: (filter: SocialFilter) => void;
  userFid?: number;
}

export const FarcasterFilters = ({ onFilterChange, userFid }: FarcasterFiltersProps) => {
  const [requireFarcaster, setRequireFarcaster] = useState(false);
  const [minFollowers, setMinFollowers] = useState<number>(0);
  const [showMutualOnly, setShowMutualOnly] = useState(false);
  const [userProfile, setUserProfile] = useState<FarcasterUser | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (userFid) {
        const profile = await getFarcasterProfile(userFid);
        setUserProfile(profile);
      }
    };

    loadUserProfile();
  }, [userFid]);

  useEffect(() => {
    const filter: SocialFilter = {
      requireFarcaster: requireFarcaster,
      minFollowers: minFollowers > 0 ? minFollowers : undefined,
      mutualFollowersWith: showMutualOnly && userFid ? userFid : undefined,
    };

    onFilterChange(filter);
  }, [requireFarcaster, minFollowers, showMutualOnly, userFid, onFilterChange]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Farcaster Filters</h3>
      </div>

      <div className="space-y-4">
        {/* Require Farcaster Account */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-gray-700">Only show groups with Farcaster members</span>
          <input
            type="checkbox"
            checked={requireFarcaster}
            onChange={e => setRequireFarcaster(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
        </label>

        {/* Minimum Followers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum followers: {minFollowers > 0 ? minFollowers.toLocaleString() : "Any"}
          </label>
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={minFollowers}
            onChange={e => setMinFollowers(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${(minFollowers / 10000) * 100}%, rgb(229, 231, 235) ${(minFollowers / 10000) * 100}%, rgb(229, 231, 235) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>5K</span>
            <span>10K</span>
          </div>
        </div>

        {/* Mutual Followers Only */}
        {userFid && (
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">Only show mutual connections</span>
              {userProfile && (
                <span className="text-xs text-gray-500">
                  You follow {userProfile.followingCount?.toLocaleString() || 0} users
                </span>
              )}
            </div>
            <input
              type="checkbox"
              checked={showMutualOnly}
              onChange={e => setShowMutualOnly(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
          </label>
        )}
      </div>

      {/* Active Filters Summary */}
      {(requireFarcaster || minFollowers > 0 || showMutualOnly) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {requireFarcaster && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                Farcaster Required
              </span>
            )}
            {minFollowers > 0 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                {minFollowers.toLocaleString()}+ Followers
              </span>
            )}
            {showMutualOnly && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                Mutual Connections
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
