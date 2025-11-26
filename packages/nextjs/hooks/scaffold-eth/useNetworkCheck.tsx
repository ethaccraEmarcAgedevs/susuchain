"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import toast from "react-hot-toast";
import scaffoldConfig from "~~/scaffold.config";

const targetChainId = scaffoldConfig.targetNetworks[0].id;
const targetChainName = scaffoldConfig.targetNetworks[0].name;

/**
 * Hook to monitor and validate network connection
 *
 * Checks if the user is on the correct network and provides
 * an option to switch networks if they're on the wrong one.
 */
export function useNetworkCheck() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const [hasShownWarning, setHasShownWarning] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setHasShownWarning(false);
      return;
    }

    const isCorrectNetwork = chainId === targetChainId;

    if (!isCorrectNetwork && !hasShownWarning) {
      const toastId = toast.error(
        <div className="text-sm">
          <p className="font-semibold mb-2">Wrong Network!</p>
          <p className="text-xs mb-3">
            Please switch to <span className="font-mono font-semibold">{targetChainName}</span> to use this app.
          </p>
          <button
            onClick={() => {
              toast.dismiss(toastId);
              handleSwitchNetwork();
            }}
            className="w-full px-3 py-1.5 bg-white text-red-600 rounded font-medium text-xs hover:bg-gray-100 transition-colors"
          >
            Switch to {targetChainName}
          </button>
        </div>,
        {
          duration: Infinity,
          position: "top-center",
        },
      );

      setHasShownWarning(true);

      return () => {
        toast.dismiss(toastId);
      };
    } else if (isCorrectNetwork && hasShownWarning) {
      toast.dismiss();
      toast.success(`Connected to ${targetChainName}`, {
        position: "top-center",
        duration: 2000,
      });
      setHasShownWarning(false);
    }
  }, [chainId, isConnected, hasShownWarning]);

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: targetChainId });
      toast.success(`Switched to ${targetChainName}!`, {
        position: "top-center",
        duration: 2000,
      });
      setHasShownWarning(false);
    } catch (error: any) {
      console.error("Network switch error:", error);

      // User rejected the switch
      if (error.code === 4001) {
        toast.error("Network switch cancelled", {
          position: "top-center",
          duration: 3000,
        });
      } else {
        toast.error(
          <div className="text-sm">
            <p className="font-semibold">Failed to switch network</p>
            <p className="text-xs mt-1">Please switch manually in your wallet settings</p>
          </div>,
          {
            position: "top-center",
            duration: 5000,
          },
        );
      }
    }
  };

  return {
    isCorrectNetwork: chainId === targetChainId,
    targetChainId,
    targetChainName,
    switchToTargetNetwork: handleSwitchNetwork,
  };
}
