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
export function useRequireChain({ requiredChainId, onWrongChain, showAutoPrompt = true }: UseRequireChainOptions) {
  const { caipNetwork, switchNetwork } = useAppKitNetwork();
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  const currentChainId = caipNetwork?.id
    ? typeof caipNetwork.id === "string"
      ? parseInt(caipNetwork.id.split(":")[1])
      : caipNetwork.id
    : null;
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

      toast.error(`Wrong Network: This feature requires ${requiredChainInfo.name} network. Please switch networks.`, {
        duration: 8000,
        position: "top-center",
      });
    }
  }, [currentChainId, isCorrectChain, hasShownPrompt, showAutoPrompt]);

  const handleSwitchChain = async () => {
    if (!switchNetwork) {
      toast.error("Network switching is not available");
      return;
    }

    try {
      // SusuChain operates only on Base Mainnet
      const chains = await import("viem/chains");
      const chainMap: Record<number, any> = {
        8453: chains.base, // Base Mainnet only
      };

      const targetChain = chainMap[requiredChainId];
      if (targetChain) {
        await switchNetwork(targetChain);
        toast.success(`Switched to ${requiredChainInfo.name}`);
      } else {
        toast.error("SusuChain only supports Base Mainnet");
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
