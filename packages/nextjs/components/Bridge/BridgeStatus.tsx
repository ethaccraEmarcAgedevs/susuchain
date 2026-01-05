"use client";

import { BridgeTransaction } from "~~/services/bridge/base-bridge";
import { getBridgeProgress, formatTimeRemaining, getEstimatedTimeRemaining } from "~~/services/bridge/bridge-monitor";

interface BridgeStatusProps {
  transaction: BridgeTransaction;
}

export const BridgeStatus = ({ transaction }: BridgeStatusProps) => {
  const progress = getBridgeProgress(transaction);
  const timeRemaining = getEstimatedTimeRemaining(transaction);
  const formattedTime = formatTimeRemaining(timeRemaining);

  const getStatusColor = () => {
    switch (transaction.status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "waiting_claim":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  const getStatusText = () => {
    switch (transaction.status) {
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "waiting_claim":
        return "Ready to Claim";
      default:
        return "In Progress";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Bridge {transaction.amount} {transaction.asset}
          </h3>
          <p className="text-sm text-gray-600">
            {transaction.asset === "USDC" ? "via Circle CCTP" : "via Base Bridge"}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Progress Bar */}
      {transaction.status === "pending" && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">~{formattedTime} remaining</p>
        </div>
      )}

      {/* Transaction Details */}
      <div className="space-y-2">
        {transaction.sourceTxHash && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Source Tx:</span>
            <a
              href={`https://basescan.org/tx/${transaction.sourceTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-mono"
            >
              {transaction.sourceTxHash.slice(0, 10)}...
            </a>
          </div>
        )}

        {transaction.destinationTxHash && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Destination Tx:</span>
            <a
              href={`https://basescan.org/tx/${transaction.destinationTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-mono"
            >
              {transaction.destinationTxHash.slice(0, 10)}...
            </a>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Started:</span>
          <span className="text-gray-900">
            {new Date(transaction.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action Button */}
      {transaction.status === "waiting_claim" && (
        <button className="w-full mt-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors">
          Claim on Base
        </button>
      )}

      {transaction.status === "completed" && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
          <p className="text-sm text-green-700 font-medium">✓ Successfully bridged to Base</p>
        </div>
      )}
    </div>
  );
};
