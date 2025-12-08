import { useEffect, useState } from "react";
import { Address, erc20Abi, maxUint256 } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isNativeETH } from "~~/utils/tokens";

/**
 * Hook to manage ERC20 token approvals
 */
export function useTokenApproval(tokenAddress?: Address, spenderAddress?: Address, requiredAmount?: bigint) {
  const { address: userAddress } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<Address | undefined>();

  // Check if token is ETH (no approval needed)
  const needsApproval = tokenAddress && !isNativeETH(tokenAddress);

  // Get current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: needsApproval ? tokenAddress : undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
    query: {
      enabled: !!userAddress && !!spenderAddress && !!needsApproval,
    },
  });

  // Write contract for approval
  const { writeContractAsync } = useWriteContract();

  // Wait for approval transaction
  const { isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  useEffect(() => {
    if (isApprovalSuccess) {
      setIsApproving(false);
      refetchAllowance();
    }
  }, [isApprovalSuccess, refetchAllowance]);

  const hasAllowance = (): boolean => {
    if (!needsApproval) return true; // ETH doesn't need approval
    if (!requiredAmount || !currentAllowance) return false;
    return currentAllowance >= requiredAmount;
  };

  const approve = async (amount?: bigint) => {
    if (!tokenAddress || !spenderAddress || !userAddress || !needsApproval) {
      throw new Error("Missing required parameters for approval");
    }

    setIsApproving(true);

    try {
      // Use max approval for better UX (user only approves once)
      const approvalAmount = amount ?? maxUint256;

      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, approvalAmount],
      });

      setApprovalTxHash(hash);
      return hash;
    } catch (error) {
      setIsApproving(false);
      throw error;
    }
  };

  return {
    currentAllowance: currentAllowance ?? 0n,
    hasAllowance: hasAllowance(),
    needsApproval: !!needsApproval,
    isApproving,
    approve,
    refetchAllowance,
  };
}
