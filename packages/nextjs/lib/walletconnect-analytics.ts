/**
 * WalletConnect Cloud Analytics Integration
 *
 * Sends analytics events to WalletConnect Cloud for comprehensive
 * wallet connection monitoring and insights.
 *
 * Dashboard: https://cloud.reown.com
 */

export interface WalletConnectEvent {
  type: string;
  properties: Record<string, any>;
  timestamp: number;
}

export interface ConnectionMetrics {
  walletType: string;
  connectionTime: number;
  success: boolean;
  retryCount: number;
  errorMessage?: string;
}

export interface ChainSwitchMetrics {
  fromChain: number;
  toChain: number;
  success: boolean;
  userInitiated: boolean;
}

export interface TransactionMetrics {
  type: string;
  status: "pending" | "success" | "failed";
  gasUsed?: string;
  errorReason?: string;
}

/**
 * Send event to WalletConnect Cloud Analytics
 */
export async function sendToWalletConnectCloud(event: WalletConnectEvent): Promise<void> {
  // Only send in production or if explicitly enabled
  const isEnabled =
    process.env.NEXT_PUBLIC_ENABLE_WALLETCONNECT_ANALYTICS === "true" || process.env.NODE_ENV === "production";

  if (!isEnabled) {
    if (process.env.NODE_ENV === "development") {
      console.log("[WalletConnect Analytics - Dev Only]", event.type, event.properties);
    }
    return;
  }

  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

  if (!projectId) {
    console.warn("[WalletConnect Analytics] Project ID not configured");
    return;
  }

  try {
    // WalletConnect Cloud Analytics endpoint
    const response = await fetch("https://pulse.walletconnect.com/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Project-Id": projectId,
      },
      body: JSON.stringify({
        events: [
          {
            eventId: `${event.type}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            bundleId: "com.susuchain.app",
            timestamp: event.timestamp,
            props: {
              event: event.type,
              ...event.properties,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn("[WalletConnect Analytics] Failed to send event:", response.statusText);
    }
  } catch (error) {
    console.warn("[WalletConnect Analytics] Error sending event:", error);
  }
}

/**
 * Track wallet connection attempt
 */
export function trackConnectionAttempt(metrics: ConnectionMetrics): void {
  sendToWalletConnectCloud({
    type: "wallet_connection_attempt",
    properties: {
      wallet_type: metrics.walletType,
      connection_time_ms: metrics.connectionTime,
      success: metrics.success,
      retry_count: metrics.retryCount,
      error_message: metrics.errorMessage,
      platform:
        typeof window !== "undefined"
          ? window.navigator.userAgent.includes("Mobile")
            ? "mobile"
            : "desktop"
          : "unknown",
    },
    timestamp: Date.now(),
  });
}

/**
 * Track successful wallet connection
 */
export function trackConnectionSuccess(walletType: string, connectionTime: number): void {
  trackConnectionAttempt({
    walletType,
    connectionTime,
    success: true,
    retryCount: 0,
  });
}

/**
 * Track failed wallet connection
 */
export function trackConnectionFailure(walletType: string, errorMessage: string, retryCount: number): void {
  trackConnectionAttempt({
    walletType,
    connectionTime: 0,
    success: false,
    retryCount,
    errorMessage,
  });
}

/**
 * Track chain switching
 */
export function trackChainSwitch(metrics: ChainSwitchMetrics): void {
  sendToWalletConnectCloud({
    type: "chain_switch",
    properties: {
      from_chain_id: metrics.fromChain,
      to_chain_id: metrics.toChain,
      success: metrics.success,
      user_initiated: metrics.userInitiated,
    },
    timestamp: Date.now(),
  });
}

/**
 * Track transaction
 */
export function trackTransaction(metrics: TransactionMetrics): void {
  sendToWalletConnectCloud({
    type: "transaction",
    properties: {
      transaction_type: metrics.type,
      status: metrics.status,
      gas_used: metrics.gasUsed,
      error_reason: metrics.errorReason,
    },
    timestamp: Date.now(),
  });
}

/**
 * Track session duration
 */
export function trackSessionDuration(durationMs: number): void {
  sendToWalletConnectCloud({
    type: "session_duration",
    properties: {
      duration_ms: durationMs,
      duration_minutes: Math.floor(durationMs / 60000),
    },
    timestamp: Date.now(),
  });
}

/**
 * Track wrong network warning
 */
export function trackWrongNetworkWarning(currentChain: number, expectedChain: number): void {
  sendToWalletConnectCloud({
    type: "wrong_network_warning",
    properties: {
      current_chain_id: currentChain,
      expected_chain_id: expectedChain,
    },
    timestamp: Date.now(),
  });
}

/**
 * Track wallet modal open
 */
export function trackModalOpen(): void {
  sendToWalletConnectCloud({
    type: "wallet_modal_open",
    properties: {
      page: typeof window !== "undefined" ? window.location.pathname : "unknown",
    },
    timestamp: Date.now(),
  });
}

/**
 * Track wallet modal close
 */
export function trackModalClose(connected: boolean): void {
  sendToWalletConnectCloud({
    type: "wallet_modal_close",
    properties: {
      connected,
      page: typeof window !== "undefined" ? window.location.pathname : "unknown",
    },
    timestamp: Date.now(),
  });
}

/**
 * Batch send multiple events (for offline queueing)
 */
export async function sendBatchEvents(events: WalletConnectEvent[]): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

  if (!projectId) {
    console.warn("[WalletConnect Analytics] Project ID not configured");
    return;
  }

  try {
    const formattedEvents = events.map(event => ({
      eventId: `${event.type}_${event.timestamp}_${Math.random().toString(36).substring(7)}`,
      bundleId: "com.susuchain.app",
      timestamp: event.timestamp,
      props: {
        event: event.type,
        ...event.properties,
      },
    }));

    const response = await fetch("https://pulse.walletconnect.com/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Project-Id": projectId,
      },
      body: JSON.stringify({
        events: formattedEvents,
      }),
    });

    if (!response.ok) {
      console.warn("[WalletConnect Analytics] Batch send failed:", response.statusText);
    }
  } catch (error) {
    console.warn("[WalletConnect Analytics] Error sending batch:", error);
  }
}
