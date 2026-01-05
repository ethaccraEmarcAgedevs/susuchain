/**
 * Base-specific analytics tracking
 */

export interface BaseAnalyticsEvent {
  event: string;
  chainId: number;
  userAddress?: string;
  groupAddress?: string;
  amount?: string;
  asset?: string;
}

/**
 * Track Base ecosystem events
 */
export function trackBaseEvent(eventData: BaseAnalyticsEvent): void {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Base Analytics]", eventData);
  }

  // Send to analytics service (e.g., Mixpanel, Amplitude)
  // This integrates with Base's ecosystem metrics
  if (typeof window !== "undefined" && (window as any).analytics) {
    (window as any).analytics.track(eventData.event, {
      ...eventData,
      platform: "Base",
      network: eventData.chainId === 8453 ? "mainnet" : "testnet",
    });
  }
}

/**
 * Track group creation on Base
 */
export function trackGroupCreation(groupAddress: string, asset: string): void {
  trackBaseEvent({
    event: "group_created",
    chainId: 8453,
    groupAddress,
    asset,
  });
}

/**
 * Track contribution on Base
 */
export function trackContribution(groupAddress: string, amount: string, asset: string): void {
  trackBaseEvent({
    event: "contribution_made",
    chainId: 8453,
    groupAddress,
    amount,
    asset,
  });
}

/**
 * Track bridge to Base
 */
export function trackBridge(amount: string, asset: string): void {
  trackBaseEvent({
    event: "bridge_to_base",
    chainId: 8453,
    amount,
    asset,
  });
}
