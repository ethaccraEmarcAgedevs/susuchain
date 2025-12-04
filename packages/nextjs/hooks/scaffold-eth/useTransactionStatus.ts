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
      const explorerUrl = `${targetNetwork.blockExplorers?.default.url}/tx/${hash}`;
      toastIdRef.current = toast.loading(
        `${pendingMessage} - View on explorer: ${explorerUrl}`,
        { duration: Infinity },
      );
    }

    if (isSuccess && !hasShownSuccess.current) {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
      const explorerUrl = `${targetNetwork.blockExplorers?.default.url}/tx/${hash}`;
      toast.success(
        `${successMessage} - View: ${explorerUrl}`,
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
        `Transaction failed: ${error?.message || "Unknown error"}`,
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
