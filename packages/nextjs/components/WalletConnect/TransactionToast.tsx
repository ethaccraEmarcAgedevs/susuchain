"use client";

import { Hash } from "viem";
import { CheckCircleIcon, ExclamationCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

interface TransactionToastProps {
  status: "pending" | "success" | "error";
  message: string;
  txHash?: Hash;
  explorerUrl?: string;
  errorMessage?: string;
}

export const TransactionToast = ({ status, message, txHash, explorerUrl, errorMessage }: TransactionToastProps) => {
  const icons = {
    pending: <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />,
    success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    error: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">{icons[status]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{message}</p>
        {errorMessage && <p className="text-xs text-gray-600 mt-1">{errorMessage}</p>}
        {txHash && explorerUrl && (
          <a
            href={`${explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            View on explorer →
          </a>
        )}
      </div>
    </div>
  );
};
