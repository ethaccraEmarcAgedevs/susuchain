"use client";

import { useEffect, useState } from "react";
import { Address } from "viem";
import { getUserCredentials, getVerificationBadge, UserCredentials } from "~~/utils/coinbase-credentials";

interface VerificationBadgeProps {
  address: Address;
  showDetails?: boolean;
}

/**
 * Displays Coinbase verification badge for user
 */
export function VerificationBadge({ address, showDetails = false }: VerificationBadgeProps) {
  const [credentials, setCredentials] = useState<UserCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCredentials() {
      try {
        const creds = await getUserCredentials(address);
        setCredentials(creds);
      } catch (error) {
        console.error("Error fetching credentials:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCredentials();
  }, [address]);

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs">
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600">Checking...</span>
      </div>
    );
  }

  if (!credentials || credentials.verificationScore === 0) {
    return null;
  }

  const badge = getVerificationBadge(credentials.verificationScore);

  return (
    <div className="inline-block">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-xs font-medium ${badge.color}`}>
        <span className="text-sm">{badge.icon}</span>
        <span>{badge.label}</span>
        {credentials.verificationScore >= 55 && (
          <span className="text-xs opacity-75">({credentials.verificationScore})</span>
        )}
      </div>

      {showDetails && credentials.verificationScore > 0 && (
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          {credentials.coinbaseVerified && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Coinbase Verified</span>
            </div>
          )}
          {credentials.phoneVerified && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Phone Verified</span>
            </div>
          )}
          {credentials.emailVerified && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Email Verified</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
