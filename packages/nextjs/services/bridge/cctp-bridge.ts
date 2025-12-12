import { Address, parseUnits, encodeFunctionData } from "viem";
import { mainnet, arbitrum, optimism, polygon, base } from "viem/chains";

/**
 * Circle CCTP contracts
 */
export const CCTP_CONTRACTS = {
  TokenMessenger: {
    [mainnet.id]: "0xbd3fa81b58ba92a82136038b25adec7066af3155" as Address,
    [arbitrum.id]: "0x19330d10d9cc8751218eaf51e8885d058642e08a" as Address,
    [optimism.id]: "0x2B4069517957735bE00ceE0fadAE88a26365528f" as Address,
    [polygon.id]: "0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE" as Address,
    [base.id]: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962" as Address,
  },
  MessageTransmitter: {
    [mainnet.id]: "0x0a992d191deec32afe36203ad87d7d289a738f81" as Address,
    [arbitrum.id]: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca" as Address,
    [optimism.id]: "0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8" as Address,
    [polygon.id]: "0xF3be9355363857F3e001be68856A2f96b4C39Ba9" as Address,
    [base.id]: "0xAD09780d193884d503182aD4588450C416D6F9D4" as Address,
  },
};

/**
 * USDC contract addresses
 */
export const USDC_ADDRESSES = {
  [mainnet.id]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
  [arbitrum.id]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address,
  [optimism.id]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address,
  [polygon.id]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as Address,
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address,
};

/**
 * CCTP domain mappings
 */
export const CCTP_DOMAINS = {
  [mainnet.id]: 0,
  [arbitrum.id]: 3,
  [optimism.id]: 2,
  [polygon.id]: 7,
  [base.id]: 6,
};

/**
 * Bridge USDC using CCTP
 */
export async function bridgeUSDCViaCCTP(
  amount: string,
  sourceChain: number,
  destinationChain: number,
  recipient: Address,
  walletClient: any,
): Promise<{ txHash: string; messageHash: string }> {
  try {
    const amountUsdc = parseUnits(amount, 6); // USDC has 6 decimals

    // First approve USDC spending
    const usdcABI = [
      {
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];

    await walletClient.writeContract({
      address: USDC_ADDRESSES[sourceChain],
      abi: usdcABI,
      functionName: "approve",
      args: [CCTP_CONTRACTS.TokenMessenger[sourceChain], amountUsdc],
    });

    // Then call depositForBurn
    const tokenMessengerABI = [
      {
        inputs: [
          { name: "amount", type: "uint256" },
          { name: "destinationDomain", type: "uint32" },
          { name: "mintRecipient", type: "bytes32" },
          { name: "burnToken", type: "address" },
        ],
        name: "depositForBurn",
        outputs: [{ name: "nonce", type: "uint64" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];

    // Convert address to bytes32
    const mintRecipient = `0x${recipient.slice(2).padStart(64, "0")}`;

    const hash = await walletClient.writeContract({
      address: CCTP_CONTRACTS.TokenMessenger[sourceChain],
      abi: tokenMessengerABI,
      functionName: "depositForBurn",
      args: [
        amountUsdc,
        CCTP_DOMAINS[destinationChain],
        mintRecipient,
        USDC_ADDRESSES[sourceChain],
      ],
    });

    // Message hash will be extracted from transaction logs
    const messageHash = ""; // Will be populated from event logs

    return { txHash: hash, messageHash };
  } catch (error) {
    console.error("Error bridging USDC via CCTP:", error);
    throw error;
  }
}

/**
 * Get CCTP attestation from Circle API
 */
export async function getCCTPAttestation(messageHash: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://iris-api.circle.com/attestations/${messageHash}`,
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.attestation || null;
  } catch (error) {
    console.error("Error fetching CCTP attestation:", error);
    return null;
  }
}

/**
 * Receive USDC on destination chain
 */
export async function receiveUSDCOnBase(
  message: string,
  attestation: string,
  walletClient: any,
): Promise<string> {
  try {
    const messageTransmitterABI = [
      {
        inputs: [
          { name: "message", type: "bytes" },
          { name: "attestation", type: "bytes" },
        ],
        name: "receiveMessage",
        outputs: [{ name: "success", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];

    const hash = await walletClient.writeContract({
      address: CCTP_CONTRACTS.MessageTransmitter[base.id],
      abi: messageTransmitterABI,
      functionName: "receiveMessage",
      args: [message, attestation],
    });

    return hash;
  } catch (error) {
    console.error("Error receiving USDC on Base:", error);
    throw error;
  }
}

/**
 * Estimate CCTP bridge time (typically 15-20 minutes)
 */
export function estimateCCTPBridgeTime(): number {
  // 20 minutes in milliseconds
  return 20 * 60 * 1000;
}

/**
 * Check if CCTP bridge is ready to claim
 */
export async function isCCTPReadyToClaim(messageHash: string): Promise<boolean> {
  const attestation = await getCCTPAttestation(messageHash);
  return attestation !== null;
}

/**
 * Auto-complete CCTP bridge when ready
 */
export async function autoCompleteCCTPBridge(
  messageHash: string,
  message: string,
  walletClient: any,
): Promise<string | null> {
  try {
    // Poll for attestation
    let attestation = await getCCTPAttestation(messageHash);
    let attempts = 0;
    const maxAttempts = 40; // 20 minutes with 30-second intervals

    while (!attestation && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      attestation = await getCCTPAttestation(messageHash);
      attempts++;
    }

    if (!attestation) {
      console.error("Failed to get attestation after maximum attempts");
      return null;
    }

    // Receive on destination chain
    const txHash = await receiveUSDCOnBase(message, attestation, walletClient);
    return txHash;
  } catch (error) {
    console.error("Error auto-completing CCTP bridge:", error);
    return null;
  }
}

/**
 * Get supported CCTP chains
 */
export function getSupportedCCTPChains(): number[] {
  return [mainnet.id, arbitrum.id, optimism.id, polygon.id];
}

/**
 * Check if chain supports CCTP
 */
export function isCCTPSupported(chainId: number): boolean {
  return getSupportedCCTPChains().includes(chainId);
}

/**
 * Estimate CCTP fees
 */
export async function estimateCCTPFees(
  amount: string,
  sourceChain: number,
): Promise<{
  gasFee: string;
  bridgeFee: string;
  total: string;
}> {
  // CCTP has no bridge fee, only gas
  const gasEstimate = 300000; // Approximate
  const gasPrice = "0.00000001"; // Approximate

  const gasFee = (gasEstimate * parseFloat(gasPrice)).toString();
  const bridgeFee = "0";

  return {
    gasFee,
    bridgeFee,
    total: gasFee,
  };
}

/**
 * Validate USDC bridge amount
 */
export function validateUSDCBridgeAmount(
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
      return { isValid: false, error: "Insufficient USDC balance" };
    }

    // Minimum 1 USDC to bridge
    if (amountNum < 1) {
      return { isValid: false, error: "Minimum bridge amount is 1 USDC" };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Invalid amount format" };
  }
}
