import { useState, useEffect } from "react";
import { Address } from "viem";
import { useWalletClient } from "wagmi";
import { createPayoutTask, cancelPayoutTask, getGroupTasks, GelatoTask } from "~~/services/gelato/task-manager";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Hook for managing Gelato automation for a Susu group
 */
export function useGelatoAutomation(groupAddress?: Address, groupName?: string) {
  const [tasks, setTasks] = useState<GelatoTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();

  // Load tasks for group
  useEffect(() => {
    if (groupAddress && walletClient) {
      loadTasks();
    }
  }, [groupAddress, walletClient]);

  const loadTasks = async () => {
    if (!groupAddress || !walletClient) return;

    try {
      setLoading(true);
      const groupTasks = await getGroupTasks(groupAddress, targetNetwork.id, walletClient);
      setTasks(groupTasks);
      setError(null);
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!groupAddress || !groupName || !walletClient) {
      setError("Missing required parameters");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const taskId = await createPayoutTask(groupAddress, groupName, targetNetwork.id, walletClient);

      // Reload tasks
      await loadTasks();

      return taskId;
    } catch (err: any) {
      console.error("Error creating task:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelTask = async (taskId: string) => {
    if (!walletClient) {
      setError("Wallet not connected");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await cancelPayoutTask(taskId, targetNetwork.id, walletClient);

      // Reload tasks
      await loadTasks();
    } catch (err: any) {
      console.error("Error cancelling task:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const hasActiveTask = tasks.length > 0 && tasks.some(t => t.active);

  return {
    tasks,
    loading,
    error,
    createTask,
    cancelTask,
    refreshTasks: loadTasks,
    hasActiveTask,
  };
}
