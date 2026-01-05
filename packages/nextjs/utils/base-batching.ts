import { Address, encodeFunctionData, Hex } from "viem";

/**
 * Base Transaction Batching Utilities
 * Optimize gas by batching multiple transactions using Multicall
 */

// Multicall3 is deployed on Base at this address
export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11" as const;

export interface BatchCall {
  target: Address;
  allowFailure: boolean;
  callData: Hex;
}

export interface BatchResult {
  success: boolean;
  returnData: Hex;
}

/**
 * Encode multiple contract calls for batching
 */
export function encodeBatchCalls(calls: BatchCall[]): Hex {
  // Multicall3.aggregate3 function
  const multicall3Abi = [
    {
      inputs: [
        {
          components: [
            { name: "target", type: "address" },
            { name: "allowFailure", type: "bool" },
            { name: "callData", type: "bytes" },
          ],
          name: "calls",
          type: "tuple[]",
        },
      ],
      name: "aggregate3",
      outputs: [
        {
          components: [
            { name: "success", type: "bool" },
            { name: "returnData", type: "bytes" },
          ],
          name: "returnData",
          type: "tuple[]",
        },
      ],
      stateMutability: "payable",
      type: "function",
    },
  ] as const;

  return encodeFunctionData({
    abi: multicall3Abi,
    functionName: "aggregate3",
    args: [calls],
  });
}

/**
 * Create a batch call for joining a group
 */
export function createJoinGroupCall(groupAddress: Address, joinCallData: Hex): BatchCall {
  return {
    target: groupAddress,
    allowFailure: false,
    callData: joinCallData,
  };
}

/**
 * Create a batch call for making a contribution
 */
export function createContributeCall(groupAddress: Address, contributeCallData: Hex): BatchCall {
  return {
    target: groupAddress,
    allowFailure: false,
    callData: contributeCallData,
  };
}

/**
 * Create a batch call for token approval
 */
export function createApprovalCall(tokenAddress: Address, approvalCallData: Hex): BatchCall {
  return {
    target: tokenAddress,
    allowFailure: false,
    callData: approvalCallData,
  };
}

/**
 * Batch join + contribute in one transaction
 * Common pattern: approve USDC, join group, make first contribution
 */
export function batchJoinAndContribute(
  approveCall: BatchCall,
  joinCall: BatchCall,
  contributeCall: BatchCall,
): BatchCall[] {
  return [approveCall, joinCall, contributeCall];
}

/**
 * Estimate gas savings from batching
 */
export function estimateBatchGasSavings(numTransactions: number): {
  individual: bigint;
  batched: bigint;
  savings: bigint;
  savingsPercent: number;
} {
  // Base transaction cost: 21000 gas
  const baseTxCost = BigInt(21000);

  // Estimated per-call overhead in batch: 5000 gas
  const batchCallOverhead = BigInt(5000);

  // Individual transactions
  const individualGas = baseTxCost * BigInt(numTransactions);

  // Batched transactions (one base cost + overhead per call)
  const batchedGas = baseTxCost + batchCallOverhead * BigInt(numTransactions);

  const savings = individualGas - batchedGas;
  const savingsPercent = Number((savings * BigInt(100)) / individualGas);

  return {
    individual: individualGas,
    batched: batchedGas,
    savings,
    savingsPercent,
  };
}

/**
 * Check if batching is worth it
 * On Base with extremely low gas, batching is beneficial for 2+ txs
 */
export function shouldBatchTransactions(numTransactions: number): boolean {
  return numTransactions >= 2;
}
