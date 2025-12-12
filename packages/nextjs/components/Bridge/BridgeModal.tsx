"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { mainnet, arbitrum, optimism, polygon, base } from "viem/chains";
import { bridgeETHToBase, estimateETHBridgeTime, validateBridgeAmount, saveBridgeTransaction } from "~~/services/bridge/base-bridge";
import { bridgeUSDCViaCCTP, estimateCCTPBridgeTime, validateUSDCBridgeAmount, isCCTPSupported } from "~~/services/bridge/cctp-bridge";

interface BridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BridgeModal = ({ isOpen, onClose }: BridgeModalProps) => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [selectedAsset, setSelectedAsset] = useState<"ETH" | "USDC">("ETH");
  const [amount, setAmount] = useState("");
  const [isBridging, setIsBridging] = useState(false);
  const [error, setError] = useState("");

  const sourceChainId = chain?.id || mainnet.id;
  const canUseCCTP = selectedAsset === "USDC" && isCCTPSupported(sourceChainId);

  const handleBridge = async () => {
    if (!address || !walletClient || !publicClient) {
      setError("Please connect your wallet");
      return;
    }

    // Validate amount
    const validation = selectedAsset === "ETH"
      ? validateBridgeAmount(amount, "1") // Placeholder balance
      : validateUSDCBridgeAmount(amount, "1000"); // Placeholder balance

    if (!validation.isValid) {
      setError(validation.error || "Invalid amount");
      return;
    }

    setIsBridging(true);
    setError("");

    try {
      let txHash: string;
      let estimatedTime: number;

      if (selectedAsset === "USDC" && canUseCCTP) {
        // Use CCTP for USDC
        const result = await bridgeUSDCViaCCTP(
          amount,
          sourceChainId,
          base.id,
          address,
          walletClient,
        );
        txHash = result.txHash;
        estimatedTime = estimateCCTPBridgeTime();

        // Save transaction
        saveBridgeTransaction({
          id: `${txHash}-${Date.now()}`,
          sourceChain: sourceChainId,
          destinationChain: base.id,
          asset: "USDC",
          amount,
          sourceTxHash: txHash,
          status: "pending",
          estimatedCompletionTime: estimatedTime,
          createdAt: Date.now(),
        });
      } else {
        // Use Base bridge for ETH
        txHash = await bridgeETHToBase(amount, walletClient, publicClient);
        estimatedTime = estimateETHBridgeTime();

        // Save transaction
        saveBridgeTransaction({
          id: `${txHash}-${Date.now()}`,
          sourceChain: sourceChainId,
          destinationChain: base.id,
          asset: "ETH",
          amount,
          sourceTxHash: txHash,
          status: "pending",
          estimatedCompletionTime: estimatedTime,
          createdAt: Date.now(),
        });
      }

      // Success
      onClose();
      setAmount("");
    } catch (err: any) {
      setError(err.message || "Bridge transaction failed");
    } finally {
      setIsBridging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Bridge to Base</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Asset Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Asset</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedAsset("ETH")}
              className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                selectedAsset === "ETH"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              ETH
            </button>
            <button
              onClick={() => setSelectedAsset("USDC")}
              className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                selectedAsset === "USDC"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              USDC
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Bridge Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">Estimated Time</p>
              <p className="text-xs text-blue-700">
                {selectedAsset === "USDC" && canUseCCTP
                  ? "~20 minutes (via Circle CCTP)"
                  : "~7 days (optimistic rollup)"}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Bridge Button */}
        <button
          onClick={handleBridge}
          disabled={isBridging || !amount}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBridging ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              Bridging...
            </span>
          ) : (
            "Bridge to Base"
          )}
        </button>

        {/* Educational Note */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            {selectedAsset === "USDC" && canUseCTP
              ? "USDC uses Circle's CCTP for fast bridging"
              : "Bridging to Base is secure via official Base bridge"}
          </p>
        </div>
      </div>
    </div>
  );
};
