"use client";

import { usePaymaster } from "~~/hooks/scaffold-eth/usePaymaster";

/**
 * Component to display user's remaining sponsored transactions
 * Shows gas sponsorship status for Base Paymaster
 */
export const SponsoredTxStatus = () => {
  const { isPaymasterAvailable, remainingSponsored, isLoading } = usePaymaster("contributeToRound");

  if (!isPaymasterAvailable) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Checking gas sponsorship...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-green-900 mb-1">Gas Sponsorship on Base</h4>
          <p className="text-sm text-green-800 mb-2">
            You have <span className="font-bold">{remainingSponsored}</span> free transaction
            {remainingSponsored !== 1 ? "s" : ""} remaining
          </p>
          {remainingSponsored > 0 ? (
            <div className="flex items-center gap-1 text-xs text-green-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Your next contributions will be gas-free!</span>
            </div>
          ) : (
            <div className="text-xs text-orange-700">
              <span>You&apos;ve used all sponsored transactions. Regular gas fees will apply.</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-green-700">Sponsorship Progress</span>
          <span className="text-xs text-green-600">{remainingSponsored}/3</span>
        </div>
        <div className="w-full bg-green-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(remainingSponsored / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Info Tooltip */}
      <div className="mt-3 pt-3 border-t border-green-200">
        <details className="text-xs text-green-700">
          <summary className="cursor-pointer font-medium hover:text-green-800">
            How does gas sponsorship work?
          </summary>
          <div className="mt-2 space-y-1 text-green-600">
            <p>• Base Paymaster sponsors your first 3 contribution transactions</p>
            <p>• No ETH needed for gas fees on sponsored transactions</p>
            <p>• After 3 transactions, regular gas fees apply</p>
            <p>• Sponsorship helps new users get started easily</p>
          </div>
        </details>
      </div>
    </div>
  );
};
