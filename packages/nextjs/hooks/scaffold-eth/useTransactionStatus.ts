"use client";

import { useEffect, useRef } from "react";
import { Hash } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";
import { useTargetNetwork } from "./useTargetNetwork";

interface TransactionStatusOptions {
  hash?: Hash;
  onSuccess?: (receipt: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  pendingMessage?: string;
}

export function useTransactionStatus({
  hash,
  onSuccess,
  onError,
  successMessage = "Transaction confirmed!",
  pendingMessage = "Transaction pending...",
}: TransactionStatusOptions) {
  const { targetNetwork } = useTargetNetwork();
  const toastIdRef = useRef<string>();
  const hasShownSuccess = useRef(false);

  const { data: receipt, isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!hash) return;

    if (isLoading && !toastIdRef.current) {
      toastIdRef.current = toast.loading(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{pendingMessage}</p>
          <a
            href={`${targetNetwork.blockExplorers?.default.url}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View on explorer →
          </a>
        </div>,
        { duration: Infinity },
      );
    }

    if (isSuccess && !hasShownSuccess.current) {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{successMessage}</p>
          <a
            href={`${targetNetwork.blockExplorers?.default.url}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 hover:underline"
          >
            View transaction →
          </a>
        </div>,
        { duration: 5000 },
      );
      hasShownSuccess.current = true;
      if (onSuccess && receipt) {
        onSuccess(receipt);
      }
    }

    if (isError) {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Transaction failed</p>
          <p className="text-xs">{error?.message || "Unknown error"}</p>
        </div>,
        { duration: 5000 },
      );
      if (onError && error) {
        onError(error);
      }
    }

    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = undefined;
      }
    };
  }, [hash, isLoading, isSuccess, isError, error, receipt, onSuccess, onError, successMessage, pendingMessage, targetNetwork]);

  return {
    receipt,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}
