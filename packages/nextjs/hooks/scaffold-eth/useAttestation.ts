import { useState } from "react";
import { Address } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

/**
 * Hook to create attestations on-chain
 */
export function useAttestation() {
  const { address: userAddress } = useAccount();
  const [isAttesting, setIsAttesting] = useState(false);

  const { writeContractAsync } = useWriteContract();

  /**
   * Attest a contribution
   */
  const attestContribution = async (
    attestationHelperAddress: Address,
    member: Address,
    group: Address,
    round: bigint,
    amount: bigint,
    isOnTime: boolean,
  ) => {
    if (!userAddress) {
      throw new Error("Wallet not connected");
    }

    setIsAttesting(true);

    try {
      const hash = await writeContractAsync({
        address: attestationHelperAddress,
        abi: [
          {
            inputs: [
              { name: "member", type: "address" },
              { name: "group", type: "address" },
              { name: "round", type: "uint256" },
              { name: "amount", type: "uint256" },
              { name: "isOnTime", type: "bool" },
            ],
            name: "attestContribution",
            outputs: [{ type: "bytes32" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "attestContribution",
        args: [member, group, round, amount, isOnTime],
      });

      return hash;
    } catch (error) {
      console.error("Error creating contribution attestation:", error);
      throw error;
    } finally {
      setIsAttesting(false);
    }
  };

  /**
   * Attest a vouch
   */
  const attestVouch = async (attestationHelperAddress: Address, vouchee: Address, reason: string) => {
    if (!userAddress) {
      throw new Error("Wallet not connected");
    }

    setIsAttesting(true);

    try {
      const hash = await writeContractAsync({
        address: attestationHelperAddress,
        abi: [
          {
            inputs: [
              { name: "voucher", type: "address" },
              { name: "vouchee", type: "address" },
              { name: "reason", type: "string" },
            ],
            name: "attestVouch",
            outputs: [{ type: "bytes32" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "attestVouch",
        args: [userAddress, vouchee, reason],
      });

      return hash;
    } catch (error) {
      console.error("Error creating vouch attestation:", error);
      throw error;
    } finally {
      setIsAttesting(false);
    }
  };

  /**
   * Attest group completion
   */
  const attestGroupCompletion = async (
    attestationHelperAddress: Address,
    member: Address,
    group: Address,
    totalRounds: bigint,
  ) => {
    if (!userAddress) {
      throw new Error("Wallet not connected");
    }

    setIsAttesting(true);

    try {
      const hash = await writeContractAsync({
        address: attestationHelperAddress,
        abi: [
          {
            inputs: [
              { name: "member", type: "address" },
              { name: "group", type: "address" },
              { name: "totalRounds", type: "uint256" },
            ],
            name: "attestGroupCompletion",
            outputs: [{ type: "bytes32" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "attestGroupCompletion",
        args: [member, group, totalRounds],
      });

      return hash;
    } catch (error) {
      console.error("Error creating group completion attestation:", error);
      throw error;
    } finally {
      setIsAttesting(false);
    }
  };

  return {
    attestContribution,
    attestVouch,
    attestGroupCompletion,
    isAttesting,
  };
}
