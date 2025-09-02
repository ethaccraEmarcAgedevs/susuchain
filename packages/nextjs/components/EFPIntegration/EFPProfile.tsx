import { useEffect, useState } from "react";
import {
  EFPProfile as EFPProfileType,
  efpService,
  formatReputationScore,
  getReputationColor,
  getReputationIcon,
  getTrustLevel,
} from "../../utils/efp";
import { Address } from "viem";

interface EFPProfileProps {
  address: Address;
  showFullProfile?: boolean;
  showReputation?: boolean;
  className?: string;
}

export const EFPProfile = ({
  address,
  showFullProfile = false,
  showReputation = true,
  className = "",
}: EFPProfileProps) => {
  const [profile, setProfile] = useState<EFPProfileType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!address) return;

      setLoading(true);
      setError("");

      try {
        const profileData = await efpService.getProfile(address);
        setProfile(profileData);
      } catch (err) {
        setError("Failed to load EFP profile");
        console.error("EFP profile error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [address]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return <div className={`text-red-500 text-sm ${className}`}>{error || "No EFP profile found"}</div>;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          <img
            src={profile.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`}
            alt={`${profile.handle} avatar`}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          />
          {profile.verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {profile.handle || `Member ${address.slice(0, 6)}`}
            </h3>
            {profile.verified && <span className="text-blue-500 text-sm">✓</span>}
          </div>

          <div className="text-sm text-gray-500 truncate">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>

          {profile.location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {profile.location}
            </div>
          )}

          {/* Reputation Badge */}
          {showReputation && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReputationColor(profile.reputation.level)}`}
              >
                {getReputationIcon(profile.reputation.level)} {profile.reputation.level}
              </span>
              <span className="text-xs text-gray-500">{formatReputationScore(profile.reputation.total)}</span>
            </div>
          )}
        </div>

        {/* Follow Stats (compact) */}
        <div className="text-right text-xs text-gray-500">
          <div>{profile.followersCount} followers</div>
          <div>{profile.followingCount} following</div>
        </div>
      </div>

      {/* Extended Profile */}
      {showFullProfile && (
        <div className="mt-4 space-y-4">
          {profile.bio && (
            <div>
              <p className="text-sm text-gray-600">{profile.bio}</p>
            </div>
          )}

          {/* Reputation Breakdown */}
          {showReputation && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span>Reputation Score</span>
                <span className="text-xl">{getReputationIcon(profile.reputation.level)}</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Susu Participation</div>
                  <div className="font-medium">{profile.reputation.breakdown.susuParticipation}/100</div>
                </div>
                <div>
                  <div className="text-gray-600">Payment Reliability</div>
                  <div className="font-medium">{profile.reputation.breakdown.paymentReliability}/100</div>
                </div>
                <div>
                  <div className="text-gray-600">Community Trust</div>
                  <div className="font-medium">{profile.reputation.breakdown.communityTrust}/100</div>
                </div>
                <div>
                  <div className="text-gray-600">Social Score</div>
                  <div className="font-medium">{profile.reputation.breakdown.socialScore}/100</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Trust Level:</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {getTrustLevel(profile.reputation.breakdown.communityTrust)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {profile.tags.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {profile.website && (
            <div>
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Visit Website
              </a>
            </div>
          )}

          {/* Join Date */}
          {profile.joinedAt && (
            <div className="text-xs text-gray-500">EFP member since {profile.joinedAt.toLocaleDateString()}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default EFPProfile;
