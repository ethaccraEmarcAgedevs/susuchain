"use client";

import { useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { trackEvent } from "~~/lib/analytics";

/**
 * Hook for tracking Susu-specific analytics events
 *
 * Tracks key user actions:
 * - Group creation
 * - Contributions
 * - Payouts
 * - ENS/EFP linking
 *
 * Events are logged locally and can be extended to send to
 * WalletConnect Cloud or other analytics services.
 */
export function useAppKitAnalytics() {
  const { address } = useAccount();
  const chainId = useChainId();

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
    (walletType: string) => {
      trackEvent({
        name: "wallet_connected",
        properties: {
          walletType,
          chainId,
          address,
        },
        userId: address,
      });
    },
    [address, chainId],
  );

  return {
    trackGroupCreation,
    trackContribution,
    trackPayout,
    trackENSLinked,
    trackGroupJoin,
    trackWalletConnection,
  };
}
