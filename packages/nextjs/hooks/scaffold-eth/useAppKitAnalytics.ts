"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { trackEvent } from "~~/lib/analytics";
import {
  trackChainSwitch,
  trackConnectionFailure,
  trackConnectionSuccess,
  trackModalClose,
  trackModalOpen,
  trackSessionDuration,
  trackTransaction,
  trackWrongNetworkWarning,
} from "~~/lib/walletconnect-analytics";

/**
 * Hook for tracking Susu-specific and WalletConnect analytics events
 *
 * Tracks key user actions:
 * - Group creation
 * - Contributions
 * - Payouts
 * - ENS/EFP linking
 * - Wallet connections
 * - Chain switching
 * - Transactions
 * - Session duration
 *
 * Events are sent to WalletConnect Cloud for comprehensive analytics.
 */
export function useAppKitAnalytics() {
  const { address, connector } = useAccount();
  const chainId = useChainId();
  const sessionStartRef = useRef<number>(Date.now());
  const previousChainRef = useRef<number | undefined>(chainId);

  // Track session duration on unmount
  useEffect(() => {
    return () => {
      const sessionDuration = Date.now() - sessionStartRef.current;
      if (sessionDuration > 1000) {
        // Only track if session was > 1 second
        trackSessionDuration(sessionDuration);
      }
    };
  }, []);

  // Track chain switches
  useEffect(() => {
    if (previousChainRef.current && chainId && previousChainRef.current !== chainId) {
      trackChainSwitch({
        fromChain: previousChainRef.current,
        toChain: chainId,
        success: true,
        userInitiated: true,
      });
    }
    previousChainRef.current = chainId;
  }, [chainId]);

  /**
   * Track group creation event
   */
  const trackGroupCreation = useCallback(
    (groupAddress: string, groupName: string, contributionAmount: string, maxMembers: number) => {
      trackEvent({
        name: "group_created",
        properties: {
          groupAddress,
          groupName,
          contributionAmount,
          maxMembers,
          chainId,
          creator: address,
        },
        userId: address,
      });
    },
    [address, chainId],
  );

  /**
   * Track contribution event
   */
  const trackContribution = useCallback(
    (groupAddress: string, amount: string, round: number) => {
      trackEvent({
        name: "contribution_submitted",
        properties: {
          groupAddress,
          amount,
          round,
          chainId,
          contributor: address,
        },
        userId: address,
      });
    },
    [address, chainId],
  );

  /**
   * Track payout claim event
   */
  const trackPayout = useCallback(
    (groupAddress: string, recipient: string, amount: string) => {
      trackEvent({
        name: "payout_claimed",
        properties: {
          groupAddress,
          recipient,
          amount,
          chainId,
          claimer: address,
        },
        userId: address,
      });
    },
    [address, chainId],
  );

  /**
   * Track ENS linking event
   */
  const trackENSLinked = useCallback(
    (walletAddress: string, ensName: string) => {
      trackEvent({
        name: "ens_linked",
        properties: {
          walletAddress,
          ensName,
          chainId,
        },
        userId: address,
      });
    },
    [address, chainId],
  );

  /**
   * Track group join event
   */
  const trackGroupJoin = useCallback(
    (groupAddress: string, groupName: string) => {
      trackEvent({
        name: "group_joined",
        properties: {
          groupAddress,
          groupName,
          chainId,
          member: address,
        },
        userId: address,
      });
    },
    [address, chainId],
  );

  /**
   * Track wallet connection event
   */
  const trackWalletConnection = useCallback(
    (walletType: string, connectionTime?: number) => {
      trackEvent({
        name: "wallet_connected",
        properties: {
          walletType,
          chainId,
          address,
        },
        userId: address,
      });

      // Also track in WalletConnect Cloud
      if (connectionTime) {
        trackConnectionSuccess(walletType, connectionTime);
      }
    },
    [address, chainId],
  );

  /**
   * Track wallet connection failure
   */
  const trackWalletConnectionError = useCallback((walletType: string, errorMessage: string, retryCount: number) => {
    trackConnectionFailure(walletType, errorMessage, retryCount);
  }, []);

  /**
   * Track wrong network warning shown
   */
  const trackNetworkMismatch = useCallback(
    (expectedChain: number) => {
      if (chainId) {
        trackWrongNetworkWarning(chainId, expectedChain);
      }
    },
    [chainId],
  );

  /**
   * Track transaction submission
   */
  const trackTransactionSubmit = useCallback(
    (type: string, status: "pending" | "success" | "failed", errorReason?: string) => {
      trackTransaction({
        type,
        status,
        errorReason,
      });
    },
    [],
  );

  /**
   * Track wallet modal open
   */
  const trackWalletModalOpen = useCallback(() => {
    trackModalOpen();
  }, []);

  /**
   * Track wallet modal close
   */
  const trackWalletModalClose = useCallback((connected: boolean) => {
    trackModalClose(connected);
  }, []);

  return {
    trackGroupCreation,
    trackContribution,
    trackPayout,
    trackENSLinked,
    trackGroupJoin,
    trackWalletConnection,
    trackWalletConnectionError,
    trackNetworkMismatch,
    trackTransactionSubmit,
    trackWalletModalOpen,
    trackWalletModalClose,
  };
}
