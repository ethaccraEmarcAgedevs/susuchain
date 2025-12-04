"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { Address } from "viem";
import { useAccount, useReadContract } from "wagmi";
import SusuGroupCard from "~~/components/SusuGroup/SusuGroupCard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: userAddress, isConnected } = useAccount();
  const [recentGroups, setRecentGroups] = useState<Address[]>([]);

  // Track user engagement for analytics (to be used in welcome notifications later)
  const userWelcomeMessage = userAddress
    ? `Welcome back, ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}!`
    : "Connect your wallet to get started";
  console.log("User status:", userWelcomeMessage);

  // Get recent groups from factory
  const { data: allGroups } = useScaffoldReadContract({
    contractName: "SusuFactory",
    functionName: "getRecentGroups",
    args: [BigInt(6)], // Get 6 most recent groups
  });

  const { data: totalStats } = useScaffoldReadContract({
    contractName: "SusuFactory",
    functionName: "getTotalStats",
  });

  useEffect(() => {
    if (allGroups && Array.isArray(allGroups)) {
      setRecentGroups([...allGroups]); // Create mutable copy
    } else {
      setRecentGroups([]); // Handle undefined case properly
    }
  }, [allGroups]);

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Base Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-6">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">B</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">Built on Base Network</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-blue-600">SusuChain</span>
              <br />
              <span className="text-2xl md:text-3xl font-normal text-gray-600">
                Your Traditional Susu, Now on Blockchain
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join decentralized savings circles with smart contracts, ENS names, and automated payouts. Build financial
              security with your community, backed by Base network.
            </p>

            {!isConnected ? (
              <div className="flex flex-col items-center gap-4 mb-6">
                <p className="text-lg font-semibold text-gray-700">Connect your wallet to get started</p>
                <div className="text-sm text-gray-500">Click &quot;Connect Wallet&quot; in the top right corner</div>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <>
                  <Link href="/create-group">
                    <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg">
                      Create a Group
                    </button>
                  </Link>
                  <Link href="/groups">
                    <button className="px-8 py-3 bg-white hover:bg-gray-50 text-blue-600 font-semibold border-2 border-blue-600 rounded-lg transition-colors">
                      Join a Group
                    </button>
                  </Link>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-base text-gray-600 mb-2">
                    👆 Look for the <span className="font-bold">Connect Wallet</span> button in the header
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {totalStats && (
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{totalStats[0]?.toString() || "0"}</div>
                <div className="text-lg text-gray-600">Groups Created</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{totalStats[1]?.toString() || "0"}</div>
                <div className="text-lg text-gray-600">Active Groups</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600">{totalStats[2]?.toString() || "0"}</div>
                <div className="text-lg text-gray-600">Completed Groups</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How SusuChain Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create or Join</h3>
              <p className="text-gray-600">
                Create a new savings group or join an existing one with your ENS name and EFP profile.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Contribute Weekly</h3>
              <p className="text-gray-600">
                Make your contribution each week. Smart contracts ensure transparency and automatic payouts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Receive Payout</h3>
              <p className="text-gray-600">
                When it&apos;s your turn, receive the full pool amount automatically via smart contract.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Groups Section */}
      {recentGroups.length > 0 && (
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Recent Groups</h2>
              <Link href="/groups">
                <button className="text-blue-600 hover:text-blue-800 font-medium">View All Groups →</button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentGroups.slice(0, 6).map((groupAddress, index) => (
                <GroupCardWrapper key={index} groupAddress={groupAddress} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Savings Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of Ghanaians who are building financial security with SusuChain.
          </p>

          {isConnected ? (
            <Link href="/create-group">
              <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Create Your First Group
              </button>
            </Link>
          ) : (
            <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Connect Wallet to Get Started
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// Component to wrap group cards with data fetching
const GroupCardWrapper = ({ groupAddress }: { groupAddress: Address }) => {
  const { data: groupDetails } = useScaffoldReadContract({
    contractName: "SusuFactory",
    functionName: "getGroupDetails",
    args: [groupAddress],
  });

  // For the wrapper component, we'll use factory data only
  // Fetch live group info for accurate member count and status
  const { data: groupInfo } = useReadContract({
    address: groupAddress,
    abi: [
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
    ],
    functionName: "getGroupInfo",
    query: {
      enabled: !!groupAddress && !!groupDetails,
    },
  });

  if (!groupDetails) {
    return <div className="animate-pulse bg-gray-200 h-80 rounded-xl"></div>;
  }

  const [groupName, ensName, creator, contributionAmount, maxMembers, , isActive] = groupDetails;

  const currentMembers = groupInfo ? Number(groupInfo[5]) : 1;
  const currentRound = groupInfo ? Number(groupInfo[6]) : 0;
  const active = groupInfo ? (groupInfo[7] as boolean) : isActive;

  const groupData = {
    groupAddress,
    name: groupName,
    ensName: ensName,
    creator: creator,
    contributionAmount: contributionAmount,
    maxMembers: Number(maxMembers),
    currentMembers,
    currentRound,
    isActive: active,
  };

  return <SusuGroupCard group={groupData} showCreator={false} />;
};

export default Home;
