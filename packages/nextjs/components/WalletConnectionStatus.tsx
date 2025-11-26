"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

/**
 * WalletConnectionStatus Component
 *
 * Headless component that monitors wallet connection state and provides
 * user feedback for reconnection attempts and connection changes.
 */
export const WalletConnectionStatus = () => {
  const { isConnected, isReconnecting, connector } = useAccount();
  const [wasConnected, setWasConnected] = useState(false);
  const [reconnectToastId, setReconnectToastId] = useState<string | undefined>();

  // Handle reconnection state
  useEffect(() => {
    if (isReconnecting) {
      const toastId = toast.loading(
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Reconnecting to your wallet...</span>
        </div>,
        {
          duration: Infinity,
          position: "top-center",
        },
      );
      setReconnectToastId(toastId);
    } else {
      if (reconnectToastId) {
        toast.dismiss(reconnectToastId);
        setReconnectToastId(undefined);

        if (isConnected) {
          toast.success("Wallet reconnected successfully!", {
            position: "top-center",
            duration: 3000,
          });
        }
      }
    }
  }, [isReconnecting, isConnected, reconnectToastId]);

  // Handle initial connection success
  useEffect(() => {
    if (isConnected && !wasConnected && connector) {
      toast.success(
        <div>
          <p className="font-semibold">Wallet Connected!</p>
          <p className="text-xs mt-1">Connected with {connector.name}</p>
        </div>,
        {
          position: "top-center",
          duration: 3000,
        },
      );
      setWasConnected(true);
    } else if (!isConnected && wasConnected) {
      toast(
        <div>
          <p className="font-semibold">Wallet Disconnected</p>
          <p className="text-xs mt-1">Your wallet has been disconnected</p>
        </div>,
        {
          icon: "ℹ️",
          position: "top-center",
          duration: 3000,
        },
      );
      setWasConnected(false);
    }
  }, [isConnected, wasConnected, connector]);

  // This is a headless component - no visual rendering
  return null;
};
