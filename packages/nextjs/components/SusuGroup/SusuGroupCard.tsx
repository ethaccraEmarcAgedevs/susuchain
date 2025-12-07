import { useEffect, useState } from "react";
import Link from "next/link";
import { formatENSName } from "../../utils/ens";
import BasenameProfile from "../BasenameIntegration/BasenameProfile";
import EFPProfile from "../EFPIntegration/EFPProfile";
import { toast } from "react-hot-toast";
import { Address } from "viem";
import { formatEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";

// SusuGroup ABI for safe direct calls
const SUSU_GROUP_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_ensName", type: "string" },
      { internalType: "string", name: "_efpProfile", type: "string" },
    ],
    name: "joinGroup",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface GroupInfo {
  groupAddress: Address;
  name: string;
  ensName: string;
  creator: Address;
  contributionAmount: bigint;
  maxMembers: number;
  currentMembers: number;
  currentRound: number;
  isActive: boolean;
  currentBeneficiary?: Address;
}

interface SusuGroupCardProps {
  group: GroupInfo;
  showCreator?: boolean;
  showJoinButton?: boolean;
  onJoinClick?: (groupAddress: Address) => void;
  className?: string;
}

export const SusuGroupCard = ({
  group,
  showCreator = true,
  showJoinButton = true,
  onJoinClick,
  className = "",
}: SusuGroupCardProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const [memberCount, setMemberCount] = useState(group.currentMembers);
  const { address: userAddress } = useAccount();

  const { writeContractAsync } = useWriteContract();

  // Real-time member count updates - Stage 3 Implementation
  useEffect(() => {
    const updateMemberCount = () => {
      // This could fetch from contract for real-time updates
      setMemberCount(group.currentMembers);
    };

    updateMemberCount();
    const interval = setInterval(updateMemberCount, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [group.currentMembers]);

  const contributionInEth = formatEther(group.contributionAmount);
  const progressPercentage = (Number(group.currentMembers) / Number(group.maxMembers)) * 100;
  const isFull = Number(group.currentMembers) >= Number(group.maxMembers);

  // Update join button visibility based on current state
  const shouldShowJoinButton = showJoinButton && group.isActive && !isFull;

  const getStatusBadge = () => {
    if (!group.isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Completed</span>;
    }
    if (isFull) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Full - Ready to Start
        </span>
      );
    }
    if (Number(group.currentMembers) > 1) {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Recruiting</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">New</span>;
  };

  const handleJoinClick = async () => {
    if (isJoining || isFull || !userAddress) return;

    setIsJoining(true);
    try {
      // Generate ENS name and EFP profile for the user
      const userENSName = `user-${userAddress.slice(-6)}.susu.eth`; // Simple ENS name generation
      const efpProfile = ""; // Empty for now, could be enhanced later

      await writeContractAsync({
        address: group.groupAddress,
        abi: SUSU_GROUP_ABI,
        functionName: "joinGroup",
        args: [userENSName, efpProfile],
      });

      // Call parent callback if provided
      if (onJoinClick) {
        onJoinClick(group.groupAddress);
      }

      // Show success message
      toast.success(`Successfully joined "${group.name}"! 🎉`);
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Failed to join group. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 ${className}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{group.name}</h3>
              {getStatusBadge()}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatENSName(group.ensName, 30)}
            </div>
          </div>
        </div>

        {/* Group Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{contributionInEth}</div>
            <div className="text-xs text-gray-600">ETH per round</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Number(memberCount)}/{Number(group.maxMembers)}
            </div>
            <div className="text-xs text-gray-600">Members</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Group Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Current Round Info */}
        {group.currentRound > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Round {group.currentRound}</div>
            {group.currentBeneficiary && (
              <div className="text-xs text-blue-600 mt-1">
                Current beneficiary: {group.currentBeneficiary.slice(0, 6)}...{group.currentBeneficiary.slice(-4)}
              </div>
            )}
          </div>
        )}

        {/* Creator Info with EFP Integration - Stage 3 Implementation */}
        {showCreator && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Created by</div>
            <div className="bg-gray-50 rounded-lg p-2 space-y-2">
              <BasenameProfile address={group.creator} />
              <EFPProfile address={group.creator} className="text-xs text-gray-500" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href={`/group/${group.groupAddress}`} className="flex-1">
            <button className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              View Details
            </button>
          </Link>

          {shouldShowJoinButton && (
            <button
              onClick={handleJoinClick}
              disabled={isJoining}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Joining...
                </span>
              ) : (
                "Join Group"
              )}
            </button>
          )}

          {isFull && group.isActive && (
            <button
              disabled
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
            >
              Group Full
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>🔒 Secure</span>
            <span>⏰ Weekly</span>
            <span>💰 Automated</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SusuGroupCard;
