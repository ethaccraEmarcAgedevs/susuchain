"use client";

import { useState } from "react";

interface VouchingSystemProps {
  groupAddress: `0x${string}`;
  members: Array<{
    memberAddress: string;
    ensName: string;
    contributionCount: bigint;
    isActive: boolean;
  }>;
  currentUserAddress?: string;
  onVouch?: (memberAddress: string, voucherAddress: string) => Promise<void>;
}

interface VouchRecord {
  voucher: string;
  voucherName: string;
  timestamp: number;
  reputation: number;
}

/**
 * VouchingSystem Component
 *
 * Implements traditional Ghanaian/African Susu vouching system where:
 * - Existing trusted members vouch for new members
 * - Members build reputation through consistent contributions
 * - Community accountability is enforced through social bonds
 * - Trust is visualized through vouching relationships
 */
export const VouchingSystem = ({ members, currentUserAddress, onVouch }: VouchingSystemProps) => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isVouching, setIsVouching] = useState(false);
  const [vouchMessage, setVouchMessage] = useState("");
  const isConnected = !!currentUserAddress;

  // Mock vouch records - in production this would come from the contract
  const [vouchRecords] = useState<Record<string, VouchRecord[]>>({
    // Example structure - would be fetched from blockchain
  });

  // Calculate member reputation based on contributions and vouches
  const calculateReputation = (member: { memberAddress: string; contributionCount: bigint; isActive: boolean }) => {
    const contributionScore = Number(member.contributionCount) * 10;
    const vouchCount = vouchRecords[member.memberAddress]?.length || 0;
    const vouchScore = vouchCount * 15;
    const activeBonus = member.isActive ? 20 : 0;

    return Math.min(100, contributionScore + vouchScore + activeBonus);
  };

  // Get reputation badge color and label
  const getReputationBadge = (reputation: number) => {
    if (reputation >= 80) return { color: "badge-success", label: "Trusted Elder" };
    if (reputation >= 60) return { color: "badge-info", label: "Reliable Member" };
    if (reputation >= 40) return { color: "badge-warning", label: "Active Member" };
    return { color: "badge-ghost", label: "New Member" };
  };

  // Check if current user can vouch (must be a member with good standing)
  const canVouch = () => {
    if (!isConnected || !currentUserAddress) return false;
    const currentMember = members.find(m => m.memberAddress.toLowerCase() === currentUserAddress.toLowerCase());
    if (!currentMember) return false;
    return currentMember.contributionCount >= 2n; // Must have at least 2 contributions
  };

  const handleVouch = async (memberAddress: string) => {
    if (!currentUserAddress || !canVouch()) {
      return;
    }

    setIsVouching(true);
    try {
      if (onVouch) {
        await onVouch(memberAddress, currentUserAddress);
      }
      setVouchMessage("");
      setSelectedMember(null);
    } catch (error) {
      console.error("Vouching failed:", error);
    } finally {
      setIsVouching(false);
    }
  };

  return (
    <div className="bg-base-200 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold">Community Vouching System</h3>
          <p className="text-sm text-base-content/70">Traditional Susu trust through member vouching</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="alert alert-info mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div className="text-sm">
          <p className="font-semibold">How Vouching Works:</p>
          <p>
            Just like traditional Susu in Ghana, trusted members can vouch for others. Build your reputation through
            consistent contributions and community trust. Members with 2+ contributions can vouch for others.
          </p>
        </div>
      </div>

      {/* Member Reputation List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-lg mb-3">Member Reputation</h4>
        {members.map(member => {
          const reputation = calculateReputation(member);
          const badge = getReputationBadge(reputation);
          const vouches = vouchRecords[member.memberAddress] || [];
          const isCurrentUser = member.memberAddress.toLowerCase() === currentUserAddress?.toLowerCase();

          return (
            <div key={member.memberAddress} className="bg-base-100 rounded-lg p-4 border border-base-300">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{member.ensName}</span>
                    {isCurrentUser && <span className="badge badge-sm badge-primary">You</span>}
                  </div>
                  <div className="text-xs text-base-content/60 font-mono">
                    {member.memberAddress.slice(0, 6)}...{member.memberAddress.slice(-4)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`badge ${badge.color} badge-sm mb-1`}>{badge.label}</div>
                  <div className="text-xs text-base-content/70">{reputation}/100 trust</div>
                </div>
              </div>

              {/* Reputation Progress Bar */}
              <div className="w-full bg-base-300 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${
                    reputation >= 80
                      ? "bg-success"
                      : reputation >= 60
                        ? "bg-info"
                        : reputation >= 40
                          ? "bg-warning"
                          : "bg-base-content/30"
                  }`}
                  style={{ width: `${reputation}%` }}
                ></div>
              </div>

              {/* Contribution Stats */}
              <div className="flex items-center gap-4 text-xs text-base-content/70 mb-2">
                <span>Contributions: {member.contributionCount.toString()}</span>
                <span>Vouches: {vouches.length}</span>
                <span className={member.isActive ? "text-success" : "text-error"}>
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Vouch Button */}
              {!isCurrentUser && canVouch() && (
                <div className="mt-3">
                  {selectedMember === member.memberAddress ? (
                    <div className="space-y-2">
                      <textarea
                        className="textarea textarea-bordered textarea-sm w-full"
                        placeholder="Why are you vouching for this member? (Optional)"
                        value={vouchMessage}
                        onChange={e => setVouchMessage(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          className="btn btn-primary btn-sm flex-1"
                          onClick={() => handleVouch(member.memberAddress)}
                          disabled={isVouching}
                        >
                          {isVouching ? <span className="loading loading-spinner loading-xs"></span> : "Confirm Vouch"}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSelectedMember(null);
                            setVouchMessage("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-outline btn-primary btn-sm"
                      onClick={() => setSelectedMember(member.memberAddress)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
                        />
                      </svg>
                      Vouch for Member
                    </button>
                  )}
                </div>
              )}

              {/* Show existing vouches */}
              {vouches.length > 0 && (
                <div className="mt-3 pt-3 border-t border-base-300">
                  <div className="text-xs font-semibold mb-2">Vouched by:</div>
                  <div className="flex flex-wrap gap-2">
                    {vouches.map((vouch, idx) => (
                      <div key={idx} className="badge badge-sm badge-outline">
                        {vouch.voucherName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!canVouch() && isConnected && (
        <div className="alert alert-warning mt-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-sm">
            You need at least 2 contributions to vouch for other members. Keep contributing to build your trust!
          </span>
        </div>
      )}
    </div>
  );
};
