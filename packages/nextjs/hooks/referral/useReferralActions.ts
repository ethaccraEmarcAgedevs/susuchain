import { useState } from "react";
import { Address, parseEther } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";

const chainId = 84532; // Base Sepolia

/**
 * Hook for creating referral codes
 */
export function useCreateReferralCode() {
  const [isCreating, setIsCreating] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const createCode = async (code: string) => {
    try {
      setIsCreating(true);

      const tx = await writeContractAsync({
        address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
        abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
        functionName: "createReferralCode",
        args: [code],
      });

      notification.success(`Referral code created: ${code}`);
      return tx;
    } catch (error: any) {
      console.error("Error creating referral code:", error);
      notification.error(error?.message || "Failed to create referral code");
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createCode,
    isCreating,
  };
}

/**
 * Hook for claiming rewards
 */
export function useClaimRewards() {
  const [isClaiming, setIsClaiming] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const claimRewards = async () => {
    try {
      setIsClaiming(true);

      const tx = await writeContractAsync({
        address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
        abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
        functionName: "claimRewards",
      });

      notification.success("Rewards claimed successfully!");
      return tx;
    } catch (error: any) {
      console.error("Error claiming rewards:", error);
      notification.error(error?.message || "Failed to claim rewards");
      throw error;
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    claimRewards,
    isClaiming,
  };
}

/**
 * Hook for claiming milestone bonuses
 */
export function useClaimMilestoneBonus() {
  const [isClaiming, setIsClaiming] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const claimBonus = async () => {
    try {
      setIsClaiming(true);

      const tx = await writeContractAsync({
        address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
        abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
        functionName: "claimMilestoneBonus",
      });

      notification.success("Milestone bonus claimed!");
      return tx;
    } catch (error: any) {
      console.error("Error claiming bonus:", error);
      notification.error(error?.message || "Failed to claim milestone bonus");
      throw error;
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    claimBonus,
    isClaiming,
  };
}

/**
 * Hook for recording referrals (called by SusuGroup contracts)
 */
export function useRecordReferral() {
  const [isRecording, setIsRecording] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const recordReferral = async (referee: Address, referralCode: string) => {
    try {
      setIsRecording(true);

      const tx = await writeContractAsync({
        address: deployedContracts[chainId]?.ReferralRegistry?.address as Address,
        abi: deployedContracts[chainId]?.ReferralRegistry?.abi,
        functionName: "recordReferral",
        args: [referee, referralCode],
      });

      return tx;
    } catch (error: any) {
      console.error("Error recording referral:", error);
      throw error;
    } finally {
      setIsRecording(false);
    }
  };

  return {
    recordReferral,
    isRecording,
  };
}

/**
 * Hook for all referral actions
 */
export function useReferralActions() {
  const { createCode, isCreating } = useCreateReferralCode();
  const { claimRewards, isClaiming: isClaimingRewards } = useClaimRewards();
  const { claimBonus, isClaiming: isClaimingBonus } = useClaimMilestoneBonus();

  return {
    createCode,
    claimRewards,
    claimBonus,
    isCreating,
    isClaimingRewards,
    isClaimingBonus,
    isBusy: isCreating || isClaimingRewards || isClaimingBonus,
  };
}

/**
 * Hook with transaction confirmation tracking
 */
export function useReferralActionsWithConfirmation() {
  const [txHash, setTxHash] = useState<Address | undefined>();

  const { createCode: createCodeRaw, isCreating } = useCreateReferralCode();
  const { claimRewards: claimRewardsRaw, isClaiming: isClaimingRewards } = useClaimRewards();
  const { claimBonus: claimBonusRaw, isClaiming: isClaimingBonus } = useClaimMilestoneBonus();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const createCode = async (code: string) => {
    const hash = await createCodeRaw(code);
    setTxHash(hash as Address);
    return hash;
  };

  const claimRewards = async () => {
    const hash = await claimRewardsRaw();
    setTxHash(hash as Address);
    return hash;
  };

  const claimBonus = async () => {
    const hash = await claimBonusRaw();
    setTxHash(hash as Address);
    return hash;
  };

  return {
    createCode,
    claimRewards,
    claimBonus,
    isCreating,
    isClaimingRewards,
    isClaimingBonus,
    isConfirming,
    isConfirmed,
    txHash,
    isBusy: isCreating || isClaimingRewards || isClaimingBonus || isConfirming,
  };
}
