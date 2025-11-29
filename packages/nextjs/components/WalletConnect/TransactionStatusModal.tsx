"use client";

import { useEffect, useState } from "react";
import { Hash } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerTxLink } from "~~/utils/scaffold-eth";

interface TransactionStatusModalProps {
  hash?: Hash;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionStatusModal = ({ hash, isOpen, onClose }: TransactionStatusModalProps) => {
  const { targetNetwork } = useTargetNetwork();
  const [estimatedTime, setEstimatedTime] = useState(15);

  const {
    data: receipt,
    isLoading,
    isSuccess,
    isError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setEstimatedTime(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (!isOpen || !hash) return null;

  const explorerLink = getBlockExplorerTxLink(targetNetwork.id, hash);

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Transaction Status</h3>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center gap-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <div className="text-center">
                <p className="font-semibold">Transaction Pending</p>
                <p className="text-sm text-base-content/70">Estimated time: ~{estimatedTime}s</p>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="alert alert-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-bold">Transaction Confirmed!</h3>
                <div className="text-xs">Block: {receipt?.blockNumber.toString()}</div>
              </div>
            </div>
          )}

          {isError && (
            <div className="alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Transaction failed or was rejected</span>
            </div>
          )}

          <div>
            <label className="label">
              <span className="label-text">Transaction Hash</span>
            </label>
            <code className="block p-2 bg-base-200 rounded text-xs break-all">{hash}</code>
          </div>

          {explorerLink && (
            <a href={explorerLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline w-full">
              View on Block Explorer
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          )}
        </div>

        <div className="modal-action">
          <button className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};
