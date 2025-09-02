import { useEffect, useState } from "react";
import { ENSProfile as ENSProfileType, formatENSName, getENSProfile, reverseResolveAddress } from "../../utils/ens";
import { Address } from "viem";
import { useAccount } from "wagmi";

interface ENSProfileProps {
  address?: Address;
  ensName?: string;
  showFullProfile?: boolean;
  className?: string;
}

export const ENSProfile = ({ address, ensName, showFullProfile = false, className = "" }: ENSProfileProps) => {
  const { address: connectedAddress } = useAccount();
  const [profile, setProfile] = useState<ENSProfileType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const targetAddress = address || connectedAddress;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!ensName && !targetAddress) return;

      setLoading(true);
      setError("");

      try {
        let profileData: ENSProfileType | null = null;

        if (ensName) {
          // Fetch profile by ENS name
          profileData = await getENSProfile(ensName);
        } else if (targetAddress) {
          // Reverse resolve address to get ENS name, then fetch profile
          const resolvedName = await reverseResolveAddress(targetAddress);
          if (resolvedName) {
            profileData = await getENSProfile(resolvedName);
          }
        }

        setProfile(profileData);
      } catch (err) {
        setError("Failed to load ENS profile");
        console.error("ENS profile error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [ensName, targetAddress]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className={`text-red-500 text-sm ${className}`}>{error}</div>;
  }

  if (!profile) {
    // Show address if no ENS profile found
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {targetAddress ? targetAddress.slice(2, 4).toUpperCase() : "??"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {targetAddress ? `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}` : "Unknown"}
          </div>
          <div className="text-sm text-gray-500">No ENS name</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={`${profile.name} avatar`}
              className="w-10 h-10 rounded-full object-cover"
              onError={e => {
                // Fallback to gradient avatar on error
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={`w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold ${profile.avatar ? "hidden" : "flex"}`}
          >
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Name and Address */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{formatENSName(profile.name, 25)}</div>
          <div className="text-sm text-gray-500 truncate">
            {profile.address.slice(0, 6)}...{profile.address.slice(-4)}
          </div>
        </div>

        {/* ENS Badge */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ENS
          </span>
        </div>
      </div>

      {/* Extended Profile Info */}
      {showFullProfile && (
        <div className="mt-4 space-y-3">
          {profile.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">Bio</h4>
              <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
            </div>
          )}

          {/* Social Links */}
          <div className="flex flex-wrap gap-2">
            {profile.twitter && (
              <a
                href={`https://twitter.com/${profile.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                @{profile.twitter}
              </a>
            )}

            {profile.github && (
              <a
                href={`https://github.com/${profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                {profile.github}
              </a>
            )}

            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Website
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ENSProfile;
