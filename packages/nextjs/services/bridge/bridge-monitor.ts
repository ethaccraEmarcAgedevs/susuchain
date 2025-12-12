import { BridgeTransaction, getBridgeStatus, updateBridgeTransaction } from "./base-bridge";
import { isCCTPReadyToClaim, autoCompleteCCTPBridge } from "./cctp-bridge";

/**
 * Monitor all pending bridge transactions
 */
export async function monitorBridgeTransactions(
  transactions: BridgeTransaction[],
  publicClient: any,
  walletClient?: any,
): Promise<void> {
  for (const tx of transactions) {
    if (tx.status === "completed" || tx.status === "failed") {
      continue;
    }

    try {
      if (tx.asset === "USDC") {
        await monitorCCTPBridge(tx, walletClient);
      } else {
        await monitorETHBridge(tx, publicClient);
      }
    } catch (error) {
      console.error(`Error monitoring bridge ${tx.id}:`, error);
    }
  }
}

/**
 * Monitor ETH bridge transaction
 */
async function monitorETHBridge(tx: BridgeTransaction, publicClient: any): Promise<void> {
  if (!tx.sourceTxHash) return;

  const status = await getBridgeStatus(tx.sourceTxHash, tx.sourceChain, publicClient);

  if (status !== tx.status) {
    updateBridgeTransaction(tx.id, { status });

    // Send notification if completed
    if (status === "completed") {
      await sendBridgeCompleteNotification(tx);
    }
  }
}

/**
 * Monitor CCTP bridge transaction
 */
async function monitorCCTPBridge(tx: BridgeTransaction, walletClient?: any): Promise<void> {
  if (!tx.sourceTxHash) return;

  // Check if attestation is ready
  const messageHash = (tx as any).messageHash;
  if (!messageHash) return;

  const isReady = await isCCTPReadyToClaim(messageHash);

  if (isReady && tx.status === "pending") {
    updateBridgeTransaction(tx.id, { status: "waiting_claim" });

    // Auto-complete if wallet client available
    if (walletClient) {
      const message = (tx as any).message;
      if (message) {
        const destTxHash = await autoCompleteCCTPBridge(messageHash, message, walletClient);

        if (destTxHash) {
          updateBridgeTransaction(tx.id, {
            status: "completed",
            destinationTxHash: destTxHash,
          });

          await sendBridgeCompleteNotification(tx);
        }
      }
    }
  }
}

/**
 * Send notification when bridge completes
 */
async function sendBridgeCompleteNotification(tx: BridgeTransaction): Promise<void> {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Bridge Complete! 🎉", {
        body: `Your ${tx.amount} ${tx.asset} has arrived on Base`,
        icon: "/favicon.png",
        badge: "/favicon.png",
        data: {
          url: "/bridge",
        },
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
}

/**
 * Get estimated time remaining for bridge
 */
export function getEstimatedTimeRemaining(tx: BridgeTransaction): number {
  const now = Date.now();
  const elapsed = now - tx.createdAt;
  const remaining = tx.estimatedCompletionTime - elapsed;

  return Math.max(0, remaining);
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  return "Less than a minute";
}

/**
 * Calculate bridge progress percentage
 */
export function getBridgeProgress(tx: BridgeTransaction): number {
  const now = Date.now();
  const elapsed = now - tx.createdAt;
  const total = tx.estimatedCompletionTime;

  const progress = (elapsed / total) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Check if bridge transaction is expired (failed)
 */
export function isBridgeExpired(tx: BridgeTransaction): boolean {
  const now = Date.now();
  const elapsed = now - tx.createdAt;

  // Consider expired if 2x estimated time has passed
  return elapsed > tx.estimatedCompletionTime * 2;
}

/**
 * Retry failed bridge transaction
 */
export async function retryBridge(tx: BridgeTransaction): Promise<void> {
  updateBridgeTransaction(tx.id, {
    status: "pending",
    createdAt: Date.now(),
  });
}

/**
 * Start monitoring service (call on app load)
 */
export function startBridgeMonitoring(
  publicClient: any,
  walletClient?: any,
  intervalMs: number = 60000, // 1 minute
): () => void {
  const interval = setInterval(async () => {
    const { getPendingBridgeTransactions } = await import("./base-bridge");
    const pending = getPendingBridgeTransactions();

    if (pending.length > 0) {
      await monitorBridgeTransactions(pending, publicClient, walletClient);
    }
  }, intervalMs);

  return () => clearInterval(interval);
}
