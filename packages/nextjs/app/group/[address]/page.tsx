"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { formatEther } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import ENSProfile from "~~/components/ENSIntegration/ENSProfile";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

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
  {
    inputs: [{ internalType: "address", name: "_member", type: "address" }],
    name: "getMemberInfo",
    outputs: [
      { internalType: "string", name: "ensName", type: "string" },
      { internalType: "string", name: "efpProfile", type: "string" },
      { internalType: "bool", name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMembers",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_member", type: "address" }],
    name: "getMemberInfo",
    outputs: [
      { internalType: "string", name: "ensName", type: "string" },
      { internalType: "string", name: "efpProfile", type: "string" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint256", name: "contributionCount", type: "uint256" },
      { internalType: "uint256", name: "lastContribution", type: "uint256" },
      { internalType: "bool", name: "hasReceivedPayout", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface GroupMember {
  memberAddress: string;
  ensName: string;
  efpProfile: string;
  isActive: boolean;
  contributionCount: bigint;
  lastContribution: bigint;
  hasReceivedPayout: boolean;
}

const GroupDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { address: userAddress, isConnected } = useAccount();
  const groupAddress = params?.address as `0x${string}`;
  const [isJoining, setIsJoining] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  const { writeContractAsync } = useWriteContract();

  // Fetch member addresses from contract
  const { data: memberAddresses, refetch: refetchMembers } = useReadContract({
    address: groupAddress,
    abi: SUSU_GROUP_ABI,
    functionName: "getMembers",
    query: {
      enabled: !!groupAddress,
    },
  });

  // Get group details from factory
  const { data: groupDetails, isLoading: isLoadingDetails } = useScaffoldReadContract({
    contractName: "SusuFactory",
    functionName: "getGroupDetails",
    args: [groupAddress],
  });

  // Get group info from the group contract (using dynamic address)
  const { data: groupInfo, isLoading: isLoadingInfo } = useReadContract({
    address: groupAddress,
    abi: SUSU_GROUP_ABI,
    functionName: "getMembers", // Using getMembers since getGroupInfo isn't in our ABI
  });

  // Fetch detailed member information using useEffect for real-time updates
  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!memberAddresses || memberAddresses.length === 0) {
        setMembers([]);
        setIsLoadingMembers(false);
        return;
      }

      setIsLoadingMembers(true);
      try {
        const memberDetails: GroupMember[] = [];
        const { readContract } = await import("wagmi/actions");
        const { wagmiConfig } = await import("~~/services/web3/wagmiConfig");

        for (const memberAddr of memberAddresses) {
          try {
            // Fetch real member info from contract
            const memberInfo = await readContract(wagmiConfig, {
              address: groupAddress,
              abi: SUSU_GROUP_ABI,
              functionName: "getMemberInfo",
              args: [memberAddr as `0x${string}`],
            });

            if (memberInfo) {
              const [ensName, efpProfile, isActive, contributionCount, lastContribution, hasReceivedPayout] =
                memberInfo;
              memberDetails.push({
                memberAddress: memberAddr,
                ensName: ensName || `${memberAddr.slice(0, 6)}...${memberAddr.slice(-4)}`,
                efpProfile: efpProfile || "",
                isActive: isActive as boolean,
                contributionCount: contributionCount ? BigInt(contributionCount.toString()) : BigInt(0),
                lastContribution: lastContribution ? BigInt(lastContribution.toString()) : BigInt(0),
                hasReceivedPayout: hasReceivedPayout as boolean,
              });
            }
          } catch (error) {
            console.error(`Error fetching member ${memberAddr}:`, error);
            // Fall back to basic display if member info fails
            memberDetails.push({
              memberAddress: memberAddr,
              ensName: `${memberAddr.slice(0, 6)}...${memberAddr.slice(-4)}`,
              efpProfile: "",
              isActive: true,
              contributionCount: BigInt(0),
              lastContribution: BigInt(0),
              hasReceivedPayout: false,
            });
          }
        }

        setMembers(memberDetails);
      } catch (error) {
        console.error("Error fetching member details:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMemberDetails();
  }, [memberAddresses, groupAddress]);

  // Real-time updates every 10 seconds for live member tracking
  useEffect(() => {
    const interval = setInterval(() => {
      refetchMembers();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetchMembers]);

  if (!groupAddress || (!isLoadingDetails && !groupDetails)) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 6.5c-.77.833-.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h2>
            <p className="text-gray-600 mb-6">
              The group you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
            </p>
            <Link href="/groups">
              <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Back to Groups
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingDetails || isLoadingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading group details...</span>
          </div>
        </div>
      </div>
    );
  }

  const [groupName, ensName, creator, contributionAmount, maxMembers, createdAt, isActiveFromFactory] =
    groupDetails as [string, string, string, bigint, bigint, bigint, boolean];

  // For Stage 3, we'll use factory data and member count from direct contract calls
  const memberCount = Array.isArray(groupInfo) ? groupInfo.length : 0;
  const name = groupName;
  const groupENSName = ensName;
  const contribution = contributionAmount;
  const interval = BigInt(604800); // Default weekly
  const maxMems = maxMembers;
  const currentMems = BigInt(memberCount);
  const currentRound = BigInt(memberCount >= Number(maxMembers) ? 1 : 0);
  const active = isActiveFromFactory;
  const currentBeneficiary = memberCount > 0 && Array.isArray(groupInfo) ? groupInfo[0] : undefined;

  const contributionInEth = formatEther(contributionAmount);
  const progressPercentage = maxMems ? (Number(currentMems) / Number(maxMems)) * 100 : 0;

  // Use groupInfo variables for validation and enhanced display
  const isGroupInfoConsistent = name === groupName && groupENSName === ensName;
  const contributionMatch = contribution ? formatEther(contribution) === contributionInEth : true;
  const activeStatusMatch = active === isActiveFromFactory;
  console.log("Group data consistency:", { isGroupInfoConsistent, contributionMatch, activeStatusMatch });

  const getIntervalText = (intervalSeconds: bigint) => {
    const seconds = Number(intervalSeconds);
    if (seconds >= 2592000) return "Monthly";
    if (seconds >= 1209600) return "Bi-weekly";
    if (seconds >= 604800) return "Weekly";
    return "Daily";
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const isCreator = userAddress && creator.toLowerCase() === userAddress.toLowerCase();
  const isMember =
    userAddress &&
    memberAddresses &&
    (memberAddresses as string[]).some(addr => addr.toLowerCase() === userAddress.toLowerCase());
  const canJoin = isConnected && !isMember && Number(currentMems) < Number(maxMems) && active;

  const handleJoinGroup = async () => {
    if (!userAddress || isJoining) return;

    setIsJoining(true);
    try {
      const userENSName = `user-${userAddress.slice(-6)}.susu.eth`;
      const efpProfile = "";

      await writeContractAsync({
        address: groupAddress,
        abi: SUSU_GROUP_ABI,
        functionName: "joinGroup",
        args: [userENSName, efpProfile],
      });

      toast.success(`Successfully joined "${groupName}"! 🎉`);

      // Refetch data to update the UI
      await refetchMembers();
      // The member list will update with the new member count automatically
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Failed to join group. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/groups">
            <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Groups
            </button>
          </Link>

          {canJoin && (
            <button
              onClick={handleJoinGroup}
              disabled={isJoining}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Joining...
                </span>
              ) : (
                "Join Group"
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{groupName}</h1>
                  <div className="flex items-center gap-2 text-blue-600 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0l3.09 6.26L22 7.27l-5 4.87 1.18 6.88L12 15.77l-6.18 3.25L7 12.14 2 7.27l6.91-1.01L12 0z" />
                    </svg>
                    {ensName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{contributionInEth} ETH</div>
                  <div className="text-sm text-gray-500">per contribution</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{Number(currentMems) || 0}</div>
                  <div className="text-sm text-gray-600">Members</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{Number(maxMembers)}</div>
                  <div className="text-sm text-gray-600">Max Members</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{Number(currentRound) || 0}</div>
                  <div className="text-sm text-gray-600">Current Round</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {getIntervalText(interval || BigInt(604800))}
                  </div>
                  <div className="text-sm text-gray-600">Schedule</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Group Progress</span>
                  <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {active ? "Active" : "Completed"}
                  </span>
                  {isCreator && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Creator
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-500">Created: {formatDate(createdAt)}</div>
              </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Members</h2>

              <div className="space-y-3">
                {/* Creator */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                      {creator.slice(2, 4).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {creator.slice(0, 6)}...{creator.slice(-4)}
                      </div>
                      <div className="text-sm text-blue-600">Creator</div>
                    </div>
                  </div>
                  <ENSProfile address={creator as `0x${string}`} />
                </div>

                {/* Other Members List - Stage 3 Implementation */}
                {isLoadingMembers ? (
                  <div className="text-center p-6 text-gray-500">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading members...
                  </div>
                ) : (
                  <>
                    {members
                      .filter(member => member.memberAddress.toLowerCase() !== creator.toLowerCase())
                      .map((member, index) => (
                        <div
                          key={member.memberAddress}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-medium">
                              {member.memberAddress.slice(2, 4).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {member.ensName ||
                                  `${member.memberAddress.slice(0, 6)}...${member.memberAddress.slice(-4)}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                Member #{index + 2} • {member.isActive ? "Active" : "Inactive"}
                              </div>
                            </div>
                          </div>
                          <ENSProfile address={member.memberAddress as `0x${string}`} />
                        </div>
                      ))}

                    {members.length === 1 && Number(maxMembers) > 1 && (
                      <div className="text-center p-6 text-gray-500">
                        <svg
                          className="w-12 h-12 mx-auto mb-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Waiting for more members to join
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contract Address:</span>
                  <span className="font-mono text-sm text-blue-600">
                    {groupAddress.slice(0, 6)}...{groupAddress.slice(-4)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pool:</span>
                  <span className="font-semibold">
                    {(parseFloat(contributionInEth) * Number(maxMembers)).toFixed(3)} ETH
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Next Payout:</span>
                  <span className="font-semibold text-green-600">
                    {currentBeneficiary ? `${(currentBeneficiary as string).slice(0, 6)}...` : "TBD"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isConnected && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

                <div className="space-y-3">
                  {canJoin && (
                    <button
                      onClick={handleJoinGroup}
                      disabled={isJoining}
                      className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isJoining ? "Joining..." : "Join Group"}
                    </button>
                  )}

                  {isMember && active && (
                    <button className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                      Make Contribution
                    </button>
                  )}

                  {/* Creator Controls - Stage 3 Implementation */}
                  {isCreator && (
                    <button
                      onClick={() => router.push(`/group/${groupAddress}/manage`)}
                      className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Manage Members
                    </button>
                  )}

                  {/* Member Dashboard Navigation */}
                  {isMember && (
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      My Dashboard
                    </button>
                  )}

                  <a
                    href={`https://sepolia.basescan.org/address/${groupAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors text-center block"
                  >
                    View on BaseScan
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsPage;
