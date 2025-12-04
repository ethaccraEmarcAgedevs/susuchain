"use client";

import { Fragment } from "react";
import { Hash } from "viem";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface TransactionStep {
  label: string;
  status: "pending" | "active" | "completed" | "error";
  description?: string;
}

interface TransactionProgressProps {
  steps: TransactionStep[];
  txHash?: Hash;
  explorerUrl?: string;
}

export const TransactionProgress = ({ steps, txHash, explorerUrl }: TransactionProgressProps) => {
  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Fragment key={index}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {step.status === "completed" && (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                )}
                {step.status === "active" && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-blue-600 animate-spin" />
                  </div>
                )}
                {step.status === "pending" && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                  </div>
                )}
                {step.status === "error" && (
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${step.status === "active" ? "text-blue-600" : ""}`}>
                  {step.label}
                </p>
                {step.description && <p className="text-xs text-gray-600 mt-1">{step.description}</p>}
              </div>
            </div>
            {index < steps.length - 1 && <div className="ml-4 w-0.5 h-6 bg-gray-200" />}
          </Fragment>
        ))}
      </div>
      {txHash && explorerUrl && (
        <div className="mt-6 pt-4 border-t">
          <a
            href={`${explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View on block explorer →
          </a>
        </div>
      )}
    </div>
  );
};
