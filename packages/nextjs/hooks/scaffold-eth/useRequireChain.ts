"use client";

import { useEffect, useState } from "react";
import { useAppKitNetwork } from "@reown/appkit/react";
import toast from "react-hot-toast";
import { getChainInfo } from "~~/components/WalletConnect/ChainBadge";

interface UseRequireChainOptions {
  requiredChainId: number;
  onWrongChain?: () => void;
  showAutoPrompt?: boolean;
}

/**
 * Hook to ensure user is on the required chain
 * Displays warnings and provides chain switching functionality
 */
export function useRequireChain({
  requiredChainId,
  onWrongChain,
  showAutoPrompt = true,
}: UseRequireChainOptions) {
  const { caipNetwork, switchNetwork } = useAppKitNetwork();
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  const currentChainId = caipNetwork?.id ? parseInt(caipNetwork.id.split(":")[1]) : null;
  const isCorrectChain = currentChainId === requiredChainId;
  const requiredChainInfo = getChainInfo(requiredChainId);

  useEffect(() => {
    if (!currentChainId || isCorrectChain) {
      setHasShownPrompt(false);
      return;
    }

    if (!isCorrectChain && onWrongChain) {
      onWrongChain();
    }

    if (showAutoPrompt && !hasShownPrompt && !isCorrectChain) {
      setHasShownPrompt(true);

      toast.error(
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-sm">Wrong Network</p>
          <p className="text-xs">
            This feature requires {requiredChainInfo.name} network.
          </p>
          <button
            onClick={() => handleSwitchChain()}
            className="mt-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Switch to {requiredChainInfo.name}
          </button>
        </div>,
        {
          duration: 8000,
          position: "top-center",
        },
      );
    }
  }, [currentChainId, isCorrectChain, hasShownPrompt, showAutoPrompt]);

  const handleSwitchChain = async () => {
    if (!switchNetwork) {
      toast.error("Network switching is not available");
      return;
    }

    try {
      // We need to construct the chain object
      const chains = await import("viem/chains");
      const chainMap: Record<number, any> = {
        8453: chains.base,
        84532: chains.baseSepolia,
        10: chains.optimism,
        11155420: chains.optimismSepolia,
        1: chains.mainnet,
      };

      const targetChain = chainMap[requiredChainId];
      if (targetChain) {
        await switchNetwork(targetChain);
        toast.success(`Switched to ${requiredChainInfo.name}`);
      }
    } catch (error: any) {
      console.error("Failed to switch network:", error);
      toast.error(error.message || "Failed to switch network");
    }
  };

  return {
    isCorrectChain,
    currentChainId,
    requiredChainId,
    requiredChainInfo,
    switchToRequiredChain: handleSwitchChain,
  };
}
