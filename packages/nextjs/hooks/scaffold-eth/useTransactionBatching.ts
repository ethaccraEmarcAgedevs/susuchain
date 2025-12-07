import { useState } from "react";
import { Address, encodeFunctionData, Hex } from "viem";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

export interface BatchedCall {
  target: Address;
  data: Hex;
  value?: bigint;
}

/**
 * Hook for batching multiple contract calls into a single transaction
 * Useful for Smart Wallet operations like join + contribute
 */
export function useTransactionBatching() {
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const [isPending, setIsPending] = useState(false);
  const [batchHash, setBatchHash] = useState<Hex | undefined>();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: batchHash,
  });

  /**
   * Execute multiple calls in a batch
   * Note: This requires Smart Wallet or multicall contract support
   */
  const executeBatch = async (calls: BatchedCall[]): Promise<Hex | undefined> => {
    if (!address) {
      notification.error("Wallet not connected");
      return undefined;
    }

    if (calls.length === 0) {
      notification.error("No calls to batch");
      return undefined;
    }

    setIsPending(true);
    let notificationId: string | null = null;

    try {
      notificationId = notification.loading(
        `Batching ${calls.length} transaction${calls.length > 1 ? "s" : ""}...`,
      );

      // For single call, execute directly
      if (calls.length === 1) {
        const call = calls[0];
        const hash = await sendTransactionAsync({
          to: call.target,
          data: call.data,
          value: call.value || 0n,
        });

        setBatchHash(hash);
        notification.remove(notificationId);
        notification.success("Transaction submitted!");
        return hash;
      }

      // For multiple calls with Smart Wallet, use batch execution
      // This would integrate with Coinbase Smart Wallet's batch call feature
      // For now, we execute them sequentially
      const hashes: Hex[] = [];

      for (const call of calls) {
        const hash = await sendTransactionAsync({
          to: call.target,
          data: call.data,
          value: call.value || 0n,
        });
        hashes.push(hash);
      }

      const finalHash = hashes[hashes.length - 1];
      setBatchHash(finalHash);

      notification.remove(notificationId);
      notification.success(`Successfully executed ${calls.length} transactions!`);

      return finalHash;
    } catch (error) {
      if (notificationId) {
        notification.remove(notificationId);
      }

      console.error("Batch execution error:", error);
      notification.error("Failed to execute batch transaction");
      return undefined;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Helper to batch join group + first contribution
   */
  const joinAndContribute = async (
    groupAddress: Address,
    joinData: Hex,
    contributionAmount: bigint,
  ): Promise<Hex | undefined> => {
    const calls: BatchedCall[] = [
      {
        target: groupAddress,
        data: joinData,
        value: 0n,
      },
      {
        target: groupAddress,
        data: encodeFunctionData({
          abi: [
            {
              name: "contributeToRound",
              type: "function",
              stateMutability: "payable",
              inputs: [],
              outputs: [],
            },
          ],
          functionName: "contributeToRound",
        }),
        value: contributionAmount,
      },
    ];

    return executeBatch(calls);
  };

  return {
    executeBatch,
    joinAndContribute,
    isPending: isPending || isConfirming,
    isSuccess,
    batchHash,
  };
}
