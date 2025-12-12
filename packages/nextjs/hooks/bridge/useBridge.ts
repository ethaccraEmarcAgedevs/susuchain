import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { BridgeTransaction, getPendingBridgeTransactions, getBridgeTransactions } from "~~/services/bridge/base-bridge";
import { startBridgeMonitoring } from "~~/services/bridge/bridge-monitor";

export const useBridge = () => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [pendingBridges, setPendingBridges] = useState<BridgeTransaction[]>([]);
  const [allBridges, setAllBridges] = useState<BridgeTransaction[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Load bridge transactions
  useEffect(() => {
    const loadBridges = () => {
      const pending = getPendingBridgeTransactions();
      const all = getBridgeTransactions();

      setPendingBridges(pending);
      setAllBridges(all);
    };

    loadBridges();

    // Refresh every 10 seconds
    const interval = setInterval(loadBridges, 10000);

    return () => clearInterval(interval);
  }, []);

  // Start monitoring service
  useEffect(() => {
    if (!publicClient || isMonitoring) return;

    const stopMonitoring = startBridgeMonitoring(publicClient, walletClient);
    setIsMonitoring(true);

    return () => {
      stopMonitoring();
      setIsMonitoring(false);
    };
  }, [publicClient, walletClient, isMonitoring]);

  const hasPendingBridges = pendingBridges.length > 0;

  return {
    pendingBridges,
    allBridges,
    hasPendingBridges,
    isMonitoring,
  };
};
