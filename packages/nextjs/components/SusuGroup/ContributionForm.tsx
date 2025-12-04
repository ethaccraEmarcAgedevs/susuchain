import { useEffect, useState } from "react";
import { Address, formatEther } from "viem";
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";
import { useAppKitAnalytics } from "~~/hooks/scaffold-eth/useAppKitAnalytics";

const SUSU_GROUP_ABI = [
  {
    inputs: [],
    name: "contributeToRound",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_member", type: "address" },
      { internalType: "uint256", name: "roundNumber", type: "uint256" },
    ],
    name: "hasContributedToRound",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface ContributionFormProps {
  groupAddress: Address;
  contributionAmount: bigint;
  currentRound: number;
  onContributionSuccess?: () => void;
  className?: string;
}

export const ContributionForm = ({
  groupAddress,
  contributionAmount,
  currentRound,
  onContributionSuccess,
  className = "",
}: ContributionFormProps) => {
  const { address: userAddress } = useAccount();
  const [error, setError] = useState("");
  const { trackContribution } = useAppKitAnalytics();

  // Get user's balance
  const { data: balance } = useBalance({
    address: userAddress,
  });

  // Contract write hook
  const { writeContractAsync, data: hash, isPending } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if user has already contributed to this round
  const [hasContributedToRound, setHasContributedToRound] = useState(false);

  useEffect(() => {
    const checkContribution = async () => {
      if (!userAddress || currentRound === 0) {
        setHasContributedToRound(false);
        return;
      }

      try {
        const { readContract } = await import("wagmi/actions");
        const { default: wagmiConfig } = await import("~~/services/web3/wagmiConfig");

        const hasContributed = await readContract(wagmiConfig, {
          address: groupAddress,
          abi: SUSU_GROUP_ABI,
          functionName: "hasContributedToRound",
          args: [userAddress, BigInt(currentRound)],
        });

        setHasContributedToRound(hasContributed as boolean);
      } catch (error) {
        console.error("Error checking contribution status:", error);
        setHasContributedToRound(false);
      }
    };

    checkContribution();
  }, [userAddress, currentRound, groupAddress, isConfirmed]);

  const handleContribute = async () => {
    if (!userAddress || hasContributedToRound || isPending) return;

    setError("");

    try {
      // Check if user has sufficient balance
      const userBalance = balance?.value || 0n;

      if (userBalance < contributionAmount) {
        throw new Error("Insufficient balance for contribution");
      }

      // Show pending toast
      const toastId = toast.loading("Submitting contribution...");

      // Call the smart contract
      const txHash = await writeContractAsync({
        address: groupAddress,
        abi: SUSU_GROUP_ABI,
        functionName: "contributeToRound",
        value: contributionAmount,
      });

      // Update toast
      toast.loading("Waiting for confirmation...", { id: toastId });

      // Track contribution event
      trackContribution(groupAddress, formatEther(contributionAmount), currentRound);

      // Success will be handled by useEffect watching isConfirmed
      toast.success(`Contribution of ${formatEther(contributionAmount)} ETH confirmed!`, { id: toastId });
      onContributionSuccess?.();
    } catch (err: any) {
      console.error("Contribution error:", err);
      const errorMessage = err.message || "Failed to make contribution";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const isContributing = isPending || isConfirming;

  if (!userAddress) {
    return (
      <div className={`p-6 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-yellow-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-yellow-700">You need to connect your wallet to make a contribution.</p>
        </div>
      </div>
    );
  }

  if (hasContributedToRound) {
    return (
      <div className={`p-6 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-green-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-green-800 mb-2">Contribution Complete!</h3>
          <p className="text-sm text-green-700">
            You&apos;ve successfully contributed {formatEther(contributionAmount)} ETH to Round {currentRound}.
          </p>
        </div>
      </div>
    );
  }

  const contributionInEth = formatEther(contributionAmount);
  const userBalanceInEth = balance ? formatEther(balance.value) : "0";
  const hasInsufficientBalance = balance && balance.value < contributionAmount;

  return (
    <div className={`p-6 bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Make Your Contribution</h3>
        <p className="text-sm text-gray-600">
          Round {currentRound} is now active. Contribute to participate in this round.
        </p>
      </div>

      {/* Contribution Amount Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{contributionInEth} ETH</div>
          <div className="text-sm text-blue-700">Required Contribution</div>
        </div>
      </div>

      {/* Balance Check */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Your Balance:</span>
          <span className={`font-medium ${hasInsufficientBalance ? "text-red-600" : "text-green-600"}`}>
            {userBalanceInEth} ETH
          </span>
        </div>
        {hasInsufficientBalance && (
          <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Insufficient balance for contribution
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Contribution Button */}
      <button
        onClick={handleContribute}
        disabled={isContributing || hasInsufficientBalance}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isContributing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing Contribution...
          </span>
        ) : hasInsufficientBalance ? (
          "Insufficient Balance"
        ) : (
          `Contribute ${contributionInEth} ETH`
        )}
      </button>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Your contribution will be pooled with other members</p>
          <p>• The full amount goes to the current round beneficiary</p>
          <p>• You&apos;ll be eligible to receive the pool when it&apos;s your turn</p>
        </div>
      </div>
    </div>
  );
};

export default ContributionForm;
