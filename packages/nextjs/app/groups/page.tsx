"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
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
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Get total number of groups
  const { data: totalGroups } = useScaffoldReadContract({
    contractName: "SusuFactory",
    functionName: "totalGroupsCreated",
  });

  // Get all group addresses
  const { data: allGroupAddresses, isLoading: isLoadingAddresses } = useScaffoldReadContract({
    contractName: "SusuFactory",
    functionName: "getAllGroups",
  });

  // Fetch all group details dynamically
  useEffect(() => {
    const fetchAllGroups = async () => {
      if (!allGroupAddresses || (allGroupAddresses as string[]).length === 0) {
        setGroups([]);
        return;
      }

      setIsLoadingGroups(true);
      const addresses = allGroupAddresses as string[];
      const groupsData: GroupData[] = [];

      try {
        // Fetch details for all groups
        for (const address of addresses) {
          try {
            // Use wagmi's readContract to fetch group details from factory
            const { readContract } = await import("wagmi/actions");
            const { config } = await import("~~/services/web3/wagmiConfig");
            const { default: deployedContracts } = await import("~~/contracts/deployedContracts");
            const { default: scaffoldConfig } = await import("~~/scaffold.config");
            const chainId = scaffoldConfig.targetNetworks[0].id;

            const groupDetails = await readContract(config, {
              address: deployedContracts[chainId].SusuFactory.address,
              abi: deployedContracts[chainId].SusuFactory.abi,
              functionName: "getGroupDetails",
              args: [address as `0x${string}`],
            });

            const [groupName, ensName, creator, contributionAmount, maxMembers, , isActive] = groupDetails as [
              string,
              string,
              string,
              bigint,
              bigint,
              bigint,
              boolean,
            ];

            // Fetch live member count from group contract
            const groupInfo = await readContract(config, {
              address: address as `0x${string}`,
              abi: SUSU_GROUP_ABI,
              functionName: "getGroupInfo",
            });

            const currentMembers = groupInfo ? groupInfo[5] : BigInt(1);

            groupsData.push({
              groupAddress: address,
              groupName,
              ensName,
              contributionAmount,
              contributionInterval: BigInt("604800"), // Default weekly
              maxMembers,
              currentMembers: BigInt(currentMembers.toString()),
              isActive,
              creator,
            });
          } catch (error) {
            console.error(`Error fetching group at ${address}:`, error);
          }
        }

        setGroups(groupsData);
      } catch (error) {
        console.error("Error fetching all groups:", error);
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchAllGroups();
  }, [allGroupAddresses]);

  // Auto-refresh all groups every 10 seconds
  useEffect(() => {
    if (!allGroupAddresses || (allGroupAddresses as string[]).length === 0) return;

    const interval = setInterval(async () => {
      const addresses = allGroupAddresses as string[];
      const updatedGroups = [...groups];

      for (let i = 0; i < addresses.length; i++) {
        try {
          const { readContract } = await import("wagmi/actions");
          const { config } = await import("~~/services/web3/wagmiConfig");
          const groupInfo = await readContract(config, {
            address: addresses[i] as `0x${string}`,
            abi: SUSU_GROUP_ABI,
            functionName: "getGroupInfo",
          });

          if (groupInfo && updatedGroups[i]) {
            updatedGroups[i].currentMembers = BigInt(groupInfo[5].toString());
            updatedGroups[i].isActive = groupInfo[7] as boolean;
          }
        } catch (error) {
          console.error(`Error refreshing group ${i}:`, error);
        }
      }

      setGroups(updatedGroups);
    }, 10000);

    return () => clearInterval(interval);
  }, [allGroupAddresses, groups]);

  const isLoading = isLoadingAddresses || isLoadingGroups;

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
