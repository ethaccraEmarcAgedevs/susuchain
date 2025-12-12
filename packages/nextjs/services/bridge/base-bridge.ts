import { parseEther, Address } from "viem";
import { mainnet, base } from "viem/chains";

/**
 * Base L1StandardBridge contract addresses
 */
export const BASE_BRIDGE_ADDRESSES = {
  [mainnet.id]: "0x3154Cf16ccdb4C6d922629664174b904d80F2C35" as Address, // L1StandardBridge on Ethereum
  [base.id]: "0x4200000000000000000000000000000000000010" as Address, // L2StandardBridge on Base
};

/**
 * Bridge transaction data
 */
export interface BridgeTransaction {
  id: string;
  sourceChain: number;
  destinationChain: number;
  asset: "ETH" | "USDC";
  amount: string;
  sourceTxHash?: string;
  destinationTxHash?: string;
  status: "pending" | "waiting_claim" | "completed" | "failed";
  estimatedCompletionTime: number;
  createdAt: number;
}

/**
 * Bridge deposit from Ethereum mainnet to Base
 */
export async function bridgeETHToBase(
  amount: string,
  walletClient: any,
  publicClient: any,
): Promise<string> {
  try {
    const amountWei = parseEther(amount);

    // L1StandardBridge ABI for depositETH
    const bridgeABI = [
      {
        inputs: [
          { internalType: "uint32", name: "_minGasLimit", type: "uint32" },
          { internalType: "bytes", name: "_extraData", type: "bytes" },
        ],
        name: "depositETH",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
    ];

    const hash = await walletClient.writeContract({
      address: BASE_BRIDGE_ADDRESSES[mainnet.id],
      abi: bridgeABI,
      functionName: "depositETH",
      args: [200000, "0x"], // minGasLimit, extraData
      value: amountWei,
    });

    return hash;
  } catch (error) {
    console.error("Error bridging ETH to Base:", error);
    throw error;
  }
}

/**
 * Estimate bridge time for ETH (7 days for optimistic rollup)
 */
export function estimateETHBridgeTime(): number {
  // 7 days in milliseconds
  return 7 * 24 * 60 * 60 * 1000;
}

/**
 * Calculate bridge fees
 */
export async function estimateBridgeFees(
  amount: string,
  asset: "ETH" | "USDC",
  sourceChain: number,
): Promise<{
  gasFee: string;
  bridgeFee: string;
  total: string;
}> {
  // Estimate gas for bridge transaction
  const gasEstimate = asset === "ETH" ? 200000 : 300000;
  const gasPrice = parseEther("0.00000001"); // Approximate gas price

  const gasFee = ((BigInt(gasEstimate) * gasPrice) / parseEther("1")).toString();
  const bridgeFee = "0"; // Base bridge has no additional fees

  const total = gasFee;

  return {
    gasFee,
    bridgeFee,
    total,
  };
}

/**
 * Check if bridge transaction is ready to claim on L2
 */
export async function isBridgeReadyToClaim(txHash: string, publicClient: any): Promise<boolean> {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    if (!receipt) return false;

    // Check if transaction has enough confirmations
    const currentBlock = await publicClient.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;

    // After 7 days (~50400 blocks on Ethereum), withdrawal is ready
    return confirmations >= 50400;
  } catch (error) {
    console.error("Error checking bridge status:", error);
    return false;
  }
}

/**
 * Get bridge transaction status
 */
export async function getBridgeStatus(
  txHash: string,
  sourceChain: number,
  publicClient: any,
): Promise<"pending" | "waiting_claim" | "completed" | "failed"> {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    if (!receipt) return "pending";

    if (receipt.status === "reverted") return "failed";

    // Check confirmations for L1 -> L2 bridge
    if (sourceChain === mainnet.id) {
      const isReady = await isBridgeReadyToClaim(txHash, publicClient);
      return isReady ? "completed" : "pending";
    }

    return "completed";
  } catch (error) {
    console.error("Error getting bridge status:", error);
    return "pending";
  }
}

/**
 * Get recommended bridge amount (minimum to cover gas on Base)
 */
export function getRecommendedBridgeAmount(): string {
  // Recommend at least 0.01 ETH to cover Base gas fees
  return "0.01";
}

/**
 * Validate bridge amount
 */
export function validateBridgeAmount(
  amount: string,
  balance: string,
): {
  isValid: boolean;
  error?: string;
} {
  try {
    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(balance);

    if (isNaN(amountNum) || amountNum <= 0) {
      return { isValid: false, error: "Invalid amount" };
    }

    if (amountNum > balanceNum) {
      return { isValid: false, error: "Insufficient balance" };
    }

    const minAmount = parseFloat(getRecommendedBridgeAmount());
    if (amountNum < minAmount) {
      return {
        isValid: false,
        error: `Minimum bridge amount is ${minAmount} ETH`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Invalid amount format" };
  }
}

/**
 * Get bridge transaction from local storage
 */
export function saveBridgeTransaction(tx: BridgeTransaction): void {
  const existing = getBridgeTransactions();
  existing.push(tx);
  localStorage.setItem("bridge_transactions", JSON.stringify(existing));
}

/**
 * Get all bridge transactions from local storage
 */
export function getBridgeTransactions(): BridgeTransaction[] {
  const stored = localStorage.getItem("bridge_transactions");
  return stored ? JSON.parse(stored) : [];
}

/**
 * Update bridge transaction status
 */
export function updateBridgeTransaction(id: string, updates: Partial<BridgeTransaction>): void {
  const transactions = getBridgeTransactions();
  const index = transactions.findIndex(tx => tx.id === id);

  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    localStorage.setItem("bridge_transactions", JSON.stringify(transactions));
  }
}

/**
 * Get pending bridge transactions
 */
export function getPendingBridgeTransactions(): BridgeTransaction[] {
  return getBridgeTransactions().filter(
    tx => tx.status === "pending" || tx.status === "waiting_claim",
  );
}
