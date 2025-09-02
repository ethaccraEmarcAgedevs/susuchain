"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import SusuGroupCard from "~~/components/SusuGroup/SusuGroupCard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// SusuGroup ABI for direct calls - this is safer and more reliable than generated types
const SUSU_GROUP_ABI = [
  {
    inputs: [],
    name: "getGroupInfo",
    outputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "ensName", type: "string" },
      { internalType: "uint256", name: "contribution", type: "uint256" },
      { internalType: "uint256", name: "interval", type: "uint256" },
      { internalType: "uint256", name: "maxMems", type: "uint256" },
      { internalType: "uint256", name: "currentMems", type: "uint256" },
      { internalType: "uint256", name: "round", type: "uint256" },
      { internalType: "bool", name: "active", type: "bool" },
      { internalType: "address", name: "currentBeneficiary", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
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

interface GroupData {
  groupAddress: string;
  groupName: string;
  ensName: string;
  contributionAmount: bigint;
  contributionInterval: bigint;
  maxMembers: bigint;
  currentMembers: bigint;
  isActive: boolean;
  creator: string;
}

const GroupsPage = () => {
  const { address: userAddress, isConnected } = useAccount();
  const [selectedFilter, setSelectedFilter] = useState<"all" | "my-groups" | "joinable">("all");

  // Get total number of groups (use totalGroupsCreated instead)
  const { data: totalGroups } = useScaffoldReadContract({
    contractName: "SusuFactory",
    functionName: "totalGroupsCreated",
  });

  // Get all groups addresses
  const { data: allGroupAddresses, isLoading: isLoadingAddresses } = useScaffoldReadContract({
    contractName: "SusuFactory",
    functionName: "getAllGroups",
  });

  // Get group details for each address
  const firstGroupAddress = allGroupAddresses && (allGroupAddresses as string[])[0];
  const secondGroupAddress = allGroupAddresses && (allGroupAddresses as string[])[1];

  const { data: firstGroupDetails } = useScaffoldReadContract({
    contractName: "SusuFactory",
    functionName: "getGroupDetails",
    args: [firstGroupAddress as `0x${string}`],
  });

  const { data: secondGroupDetails } = useScaffoldReadContract({
    contractName: "SusuFactory",
    functionName: "getGroupDetails",
    args: [secondGroupAddress as `0x${string}`],
  });

  // Get live group info for first group (includes current member count)
  const { data: firstGroupInfo, refetch: refetchFirstInfo } = useReadContract({
    address: firstGroupAddress as `0x${string}`,
    abi: SUSU_GROUP_ABI,
    functionName: "getGroupInfo",
    query: {
      enabled: !!firstGroupAddress,
      refetchInterval: 5000, // Auto-refetch every 5 seconds
    },
  });

  // Get live group info for second group (includes current member count)
  const { data: secondGroupInfo, refetch: refetchSecondInfo } = useReadContract({
    address: secondGroupAddress as `0x${string}`,
    abi: SUSU_GROUP_ABI,
    functionName: "getGroupInfo",
    query: {
      enabled: !!secondGroupAddress,
      refetchInterval: 5000, // Auto-refetch every 5 seconds
    },
  });

  // Extract member counts from group info (type-safe way)
  const firstGroupMemberCount = firstGroupInfo ? firstGroupInfo[5] : null; // currentMems is at index 5
  const secondGroupMemberCount = secondGroupInfo ? secondGroupInfo[5] : null;

  // Build groups array from fetched data
  const groups: GroupData[] = [];

  if (firstGroupAddress && firstGroupDetails) {
    const [groupName, ensName, creator, contributionAmount, maxMembers, createdAt, isActive] = firstGroupDetails as [
      string,
      string,
      string,
      bigint,
      bigint,
      bigint,
      boolean,
    ];

    // Log group creation time for analytics
    console.log(`Group "${groupName}" created at:`, new Date(Number(createdAt) * 1000).toISOString());

    groups.push({
      groupAddress: firstGroupAddress,
      groupName,
      ensName,
      contributionAmount,
      contributionInterval: BigInt("604800"), // Default weekly
      maxMembers,
      currentMembers: firstGroupMemberCount ? BigInt(firstGroupMemberCount.toString()) : BigInt("1"), // Use live member count
      isActive,
      creator,
    });
  }

  if (secondGroupAddress && secondGroupDetails) {
    const [groupName, ensName, creator, contributionAmount, maxMembers, createdAt, isActive] = secondGroupDetails as [
      string,
      string,
      string,
      bigint,
      bigint,
      bigint,
      boolean,
    ];

    // Log second group creation time for analytics
    console.log(`Group "${groupName}" created at:`, new Date(Number(createdAt) * 1000).toISOString());

    groups.push({
      groupAddress: secondGroupAddress,
      groupName,
      ensName,
      contributionAmount,
      contributionInterval: BigInt("604800"), // Default weekly
      maxMembers,
      currentMembers: secondGroupMemberCount ? BigInt(secondGroupMemberCount.toString()) : BigInt("1"), // Use live member count
      isActive,
      creator,
    });
  }

  // Debug logging
  useEffect(() => {
    console.log("Debug Groups Page:");
    console.log("- allGroupAddresses:", allGroupAddresses);
    console.log("- firstGroupAddress:", firstGroupAddress);
    console.log("- firstGroupDetails:", firstGroupDetails);
    console.log("- firstGroupInfo:", firstGroupInfo);
    console.log("- firstGroupMemberCount:", firstGroupMemberCount);
    console.log("- secondGroupInfo:", secondGroupInfo);
    console.log("- secondGroupMemberCount:", secondGroupMemberCount);
    console.log("- groups:", groups);
    console.log("- userAddress:", userAddress);
  }, [
    allGroupAddresses,
    firstGroupAddress,
    firstGroupDetails,
    firstGroupInfo,
    firstGroupMemberCount,
    secondGroupInfo,
    secondGroupMemberCount,
    groups,
    userAddress,
  ]);

  // Auto-refresh group info every 10 seconds to keep data fresh
  useEffect(() => {
    const interval = setInterval(async () => {
      if (firstGroupAddress) await refetchFirstInfo();
      if (secondGroupAddress) await refetchSecondInfo();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [firstGroupAddress, secondGroupAddress, refetchFirstInfo, refetchSecondInfo]);

  const isLoading = isLoadingAddresses;

  const filteredGroups = groups.filter(group => {
    if (selectedFilter === "my-groups") {
      return userAddress && group.creator.toLowerCase() === userAddress.toLowerCase();
    }
    if (selectedFilter === "joinable") {
      return group.currentMembers < group.maxMembers && group.isActive; // Should be active and have space
    }
    return true; // "all"
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">You need to connect your wallet to view and join Susu groups.</p>
            <Link href="/">
              <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Go Back Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Susu Groups</h1>
            <p className="text-lg text-gray-600">Discover and join savings circles in your community</p>
          </div>
          <Link href="/create-group">
            <button className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Create New Group
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{totalGroups?.toString() || "0"}</p>
                <p className="text-gray-600">Total Groups</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{groups.filter(g => g.isActive).length}</p>
                <p className="text-gray-600">Active Groups</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {groups.filter(g => g.currentMembers < g.maxMembers && !g.isActive).length}
                </p>
                <p className="text-gray-600">Joinable Groups</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFilter === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Groups ({groups.length})
          </button>
          <button
            onClick={() => setSelectedFilter("my-groups")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFilter === "my-groups" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            My Groups ({groups.filter(g => userAddress && g.creator.toLowerCase() === userAddress.toLowerCase()).length}
            )
          </button>
          <button
            onClick={() => setSelectedFilter("joinable")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFilter === "joinable" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Joinable ({groups.filter(g => g.currentMembers < g.maxMembers && !g.isActive).length})
          </button>
        </div>

        {/* Debug Info - Remove this in production */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Debug Info:</h3>
          <p className="text-sm text-yellow-700">
            Total Group Addresses: {allGroupAddresses ? (allGroupAddresses as string[]).length : 0}
          </p>
          <p className="text-sm text-yellow-700">First Group Address: {firstGroupAddress || "None"}</p>
          <p className="text-sm text-yellow-700">Groups Array Length: {groups.length}</p>
          <p className="text-sm text-yellow-700">Your Address: {userAddress || "Not connected"}</p>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading groups...</span>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {selectedFilter === "all" && "No groups found"}
              {selectedFilter === "my-groups" && "You haven't created any groups yet"}
              {selectedFilter === "joinable" && "No joinable groups available"}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedFilter === "all" && "Be the first to create a Susu group!"}
              {selectedFilter === "my-groups" && "Start by creating your first savings circle."}
              {selectedFilter === "joinable" && "Check back later or create a new group."}
            </p>
            <Link href="/create-group">
              <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Create First Group
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group, index) => (
              <SusuGroupCard
                key={`${group.groupAddress}-${index}`}
                group={{
                  groupAddress: group.groupAddress as `0x${string}`,
                  name: group.groupName,
                  ensName: group.ensName,
                  creator: group.creator as `0x${string}`,
                  contributionAmount: group.contributionAmount,
                  maxMembers: Number(group.maxMembers),
                  currentMembers: Number(group.currentMembers),
                  currentRound: 0, // Will be fetched in component
                  isActive: group.isActive,
                }}
                showCreator={true}
                showJoinButton={group.isActive && group.currentMembers < group.maxMembers}
                onJoinClick={async groupAddress => {
                  // Refresh data for the specific group that was joined
                  setTimeout(async () => {
                    // Refresh group info (includes member counts)
                    if (groupAddress === firstGroupAddress) {
                      await refetchFirstInfo();
                    } else if (groupAddress === secondGroupAddress) {
                      await refetchSecondInfo();
                    }
                  }, 2000); // Wait 2 seconds for transaction to be processed
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
