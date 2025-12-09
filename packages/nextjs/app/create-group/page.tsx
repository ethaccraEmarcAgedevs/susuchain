"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hash, parseEther } from "viem";
import { useAccount } from "wagmi";
import BasenameRegistration from "~~/components/BasenameIntegration/BasenameRegistration";
import EFPProfile from "~~/components/EFPIntegration/EFPProfile";
import ENSRegistration from "~~/components/ENSIntegration/ENSRegistration";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAppKitAnalytics } from "~~/hooks/scaffold-eth/useAppKitAnalytics";
import { useRequireAuth } from "~~/hooks/scaffold-eth/useRequireAuth";
import { useTransactionStatus } from "~~/hooks/scaffold-eth/useTransactionStatus";
import { BASE_TOKENS, getAvailableTokens, parseTokenAmount } from "~~/utils/tokens";

interface FormData {
  groupName: string;
  ensName: string;
  contributionAmount: string;
  contributionInterval: string;
  maxMembers: string;
  description: string;
  contributionAsset: string;
}

const CreateGroupPage = () => {
  const router = useRouter();
  useRequireAuth();
  const { address: userAddress, isConnected } = useAccount();
  const [formData, setFormData] = useState<FormData>({
    groupName: "",
    ensName: "",
    contributionAmount: "100",
    contributionInterval: "weekly",
    maxMembers: "5",
    description: "",
    contributionAsset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Default to USDC
  });
  const [isENSValid, setIsENSValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState<Hash | undefined>();

  const { writeContractAsync: createSusuGroup } = useScaffoldWriteContract({
    contractName: "SusuFactory",
  });
  const { trackGroupCreation } = useAppKitAnalytics();

  useTransactionStatus({
    hash: txHash,
    onSuccess: receipt => {
      // Track group creation event
      trackGroupCreation(
        receipt.transactionHash,
        formData.groupName,
        formData.contributionAmount,
        parseInt(formData.maxMembers),
      );
      // Redirect to groups page
      router.push("/groups");
    },
    onError: error => {
      setError(error.message || "Transaction failed");
      setIsCreating(false);
    },
    successMessage: "Group created successfully!",
    pendingMessage: "Creating your Susu group...",
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleENSNameChange = useCallback((ensName: string) => {
    setFormData(prev => ({ ...prev, ensName }));
  }, []);

  const handleENSValidityChange = useCallback((isValid: boolean) => {
    setIsENSValid(isValid);
  }, []);

  const getIntervalInSeconds = (interval: string): number => {
    switch (interval) {
      case "daily":
        return 86400; // 1 day
      case "weekly":
        return 604800; // 7 days
      case "biweekly":
        return 1209600; // 14 days
      case "monthly":
        return 2592000; // 30 days
      default:
        return 604800; // Default to weekly
    }
  };

  const validateForm = (): string | null => {
    if (!formData.groupName.trim()) return "Group name is required";
    if (!formData.ensName.trim()) return "ENS name is required";
    if (!isENSValid) return "ENS name must end with .susu.eth";
    if (!formData.contributionAmount || parseFloat(formData.contributionAmount) <= 0) {
      return "Contribution amount must be greater than 0";
    }
    if (!formData.maxMembers || parseInt(formData.maxMembers) < 2 || parseInt(formData.maxMembers) > 20) {
      return "Group must have between 2 and 20 members";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !userAddress) {
      setError("Please connect your wallet");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const intervalInSeconds = getIntervalInSeconds(formData.contributionInterval);
      const contributionAmountParsed = parseTokenAmount(
        formData.contributionAmount,
        formData.contributionAsset as `0x${string}`,
      );

      const hash = await createSusuGroup({
        functionName: "createSusuGroup",
        args: [
          formData.groupName,
          formData.ensName,
          contributionAmountParsed,
          BigInt(intervalInSeconds),
          BigInt(parseInt(formData.maxMembers)),
          formData.contributionAsset as `0x${string}`,
        ],
      });

      if (hash) {
        setTxHash(hash);
        // Transaction status hook will handle the rest
      }
    } catch (err: any) {
      console.error("Error creating group:", err);
      setError(err.message || "Failed to create group");
      setIsCreating(false);
    }
  };

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
            <p className="text-gray-600 mb-6">You need to connect your wallet to create a Susu group.</p>
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
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Create Your Susu Group</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Set up a new savings circle for your community. Define the contribution amount, schedule, and invite your
            trusted members.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              {/* Group Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Information</h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      id="groupName"
                      value={formData.groupName}
                      onChange={e => handleInputChange("groupName", e.target.value)}
                      placeholder="e.g., Teachers Savings Circle"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  <ENSRegistration
                    groupName={formData.groupName}
                    onENSNameChange={handleENSNameChange}
                    onValidityChange={handleENSValidityChange}
                  />

                  <BasenameRegistration
                    groupName={formData.groupName}
                    onBasenameChange={(basename, isValid) => {
                      console.log("Base Name changed:", basename, "Valid:", isValid);
                    }}
                  />

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Group Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={e => handleInputChange("description", e.target.value)}
                      placeholder="Describe the purpose of your savings group..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Settings</h3>

                <div className="space-y-4">
                  {/* Token Selector */}
                  <div>
                    <label htmlFor="contributionAsset" className="block text-sm font-medium text-gray-700 mb-1">
                      Contribution Asset *
                    </label>
                    <select
                      id="contributionAsset"
                      value={formData.contributionAsset}
                      onChange={e => handleInputChange("contributionAsset", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    >
                      {getAvailableTokens().map(token => (
                        <option key={token.address} value={token.address}>
                          {token.symbol} - {token.name} {token.isStablecoin && "(Stable)"}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.contributionAsset === BASE_TOKENS.USDC.address
                        ? "Recommended: USDC provides stable, predictable amounts"
                        : "ETH value may fluctuate"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contributionAmount" className="block text-sm font-medium text-gray-700 mb-1">
                        Contribution Amount *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="contributionAmount"
                          step={formData.contributionAsset === BASE_TOKENS.USDC.address ? "1" : "0.01"}
                          min={formData.contributionAsset === BASE_TOKENS.USDC.address ? "1" : "0.01"}
                          value={formData.contributionAmount}
                          onChange={e => handleInputChange("contributionAmount", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                        />
                        <span className="absolute right-3 top-2.5 text-sm text-gray-500">
                          {formData.contributionAsset === BASE_TOKENS.USDC.address ? "USDC" : "ETH"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Amount each member contributes per round</p>
                    </div>

                    <div>
                      <label htmlFor="contributionInterval" className="block text-sm font-medium text-gray-700 mb-1">
                        Contribution Schedule *
                      </label>
                      <select
                        id="contributionInterval"
                        value={formData.contributionInterval}
                        onChange={e => handleInputChange("contributionInterval", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Settings</h3>

                <div>
                  <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Members *
                  </label>
                  <input
                    type="number"
                    id="maxMembers"
                    min="2"
                    max="20"
                    value={formData.maxMembers}
                    onChange={e => handleInputChange("maxMembers", e.target.value)}
                    className="w-full md:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">Between 2 and 20 members</p>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating || !formData.groupName.trim()}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Group...
                    </span>
                  ) : (
                    "Create Group"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Group Name:</span>
                  <span className="font-medium">{formData.groupName || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ENS Name:</span>
                  <span className="font-mono text-xs">{formData.ensName || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contribution:</span>
                  <span className="font-medium">{formData.contributionAmount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Schedule:</span>
                  <span className="font-medium capitalize">{formData.contributionInterval}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Members:</span>
                  <span className="font-medium">{formData.maxMembers}</span>
                </div>
              </div>

              {/* Estimated Timeline */}
              {formData.maxMembers && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    <p className="font-medium mb-1">Estimated Duration:</p>
                    <p>
                      {parseInt(formData.maxMembers)} {formData.contributionInterval} cycles
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Creator Profile */}
            {userAddress && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Creator Profile</h3>
                <EFPProfile address={userAddress} showFullProfile={false} />
              </div>
            )}

            {/* Help Card */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700 mb-4">Creating your first Susu group? Here are some tips:</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Start with trusted friends and family</li>
                <li>• Keep contribution amounts manageable</li>
                <li>• Weekly schedules work well for most groups</li>
                <li>• 5-10 members is a good starting size</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupPage;
