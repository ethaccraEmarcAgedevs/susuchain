"use client";

// @refresh reset
import { useState } from "react";
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { RevealBurnerPKModal } from "./RevealBurnerPKModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { useAppKit, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import toast from "react-hot-toast";
import { Address } from "viem";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useAppKitAnalytics } from "~~/hooks/scaffold-eth/useAppKitAnalytics";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getRetryMessage, useWalletErrors } from "~~/hooks/scaffold-eth/useWalletErrors";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 * Now using Reown AppKit instead of RainbowKit
 */
const MAX_RETRY_ATTEMPTS = 3;

export const RainbowKitCustomConnectButton = () => {
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { caipNetworkId } = useAppKitNetwork();
  const { handleWalletError } = useWalletErrors();
  const { trackWalletModalOpen, trackWalletModalClose, trackWalletConnectionError } = useAppKitAnalytics();
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const blockExplorerAddressLink = address ? getBlockExplorerAddressLink(targetNetwork, address) : undefined;

  // Extract chain ID from CAIP network ID (format: "eip155:chainId")
  const chainId = caipNetworkId ? parseInt(caipNetworkId.split(":")[1]) : undefined;
  const isWrongNetwork = chainId && chainId !== targetNetwork.id;

  const handleConnect = async () => {
    if (isConnecting) return;

    setIsConnecting(true);

    // Track modal open
    trackWalletModalOpen();

    try {
      await open();
      setConnectionAttempts(0);

      // Track modal close (will be connected)
      trackWalletModalClose(true);
    } catch (error: any) {
      console.error("Connection error:", error);
      handleWalletError(error);

      const newAttempts = connectionAttempts + 1;
      setConnectionAttempts(newAttempts);

      // Track connection error
      trackWalletConnectionError("unknown", error.message || "Connection failed", newAttempts);

      // Track modal close (not connected)
      trackWalletModalClose(false);

      if (newAttempts < MAX_RETRY_ATTEMPTS) {
        toast(getRetryMessage(newAttempts, MAX_RETRY_ATTEMPTS), {
          icon: "⚠️",
          duration: 4000,
          position: "top-center",
        });
      } else {
        setConnectionAttempts(0);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isConnected || !address) {
    return (
      <button className="btn btn-primary btn-sm" onClick={handleConnect} disabled={isConnecting} type="button">
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <span className="loading loading-spinner loading-xs"></span>
            Connecting...
          </span>
        ) : (
          "Connect Wallet"
        )}
      </button>
    );
  }

  if (isWrongNetwork) {
    return <WrongNetworkDropdown />;
  }

  return (
    <>
      <div className="flex flex-col items-center mr-1">
        <Balance address={address as Address} className="min-h-0 h-auto" />
        <span className="text-xs" style={{ color: networkColor }}>
          {targetNetwork.name}
        </span>
      </div>
      <AddressInfoDropdown
        address={address as Address}
        displayName={address}
        ensAvatar={undefined}
        blockExplorerAddressLink={blockExplorerAddressLink}
      />
      <AddressQRCodeModal address={address as Address} modalId="qrcode-modal" />
      <RevealBurnerPKModal />
    </>
  );
};
