"use client";

import { Address } from "viem";
import { useBaseName } from "~~/hooks/scaffold-eth/useBaseName";

interface BasenameProfileProps {
  address: Address;
  showAvatar?: boolean;
  showFullProfile?: boolean;
}

/**
 * Display Base Name profile for an address
 * Replaces ENSProfile with Base L2 name resolution
 */
export default function BasenameProfile({ address, showAvatar = false, showFullProfile = false }: BasenameProfileProps) {
  const { basename, profile, isLoading } = useBaseName(address);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (!basename && !profile) {
    return (
      <div className="text-sm text-gray-500">
        {address.slice(0, 6)}...{address.slice(-4)}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showAvatar && profile?.avatar && (
        <img src={profile.avatar} alt={basename || "Avatar"} className="w-8 h-8 rounded-full" />
      )}

      <div>
        {basename && (
          <div className="font-medium text-blue-600">
            {basename}
          </div>
        )}

        {showFullProfile && profile && (
          <div className="text-xs text-gray-500 space-y-1 mt-1">
            {profile.description && <p>{profile.description}</p>}
            {profile.twitter && (
              <a
                href={`https://twitter.com/${profile.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                @{profile.twitter}
              </a>
            )}
          </div>
        )}

        {!showFullProfile && (
          <div className="text-xs text-gray-400">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}
