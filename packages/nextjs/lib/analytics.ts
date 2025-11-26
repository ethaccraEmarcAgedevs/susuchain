/**
 * Analytics Helper Library
 *
 * Tracks Susu-specific events for monitoring and product insights.
 * Currently logs events locally; can be extended to send to external services.
 */

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: number;
  userId?: string;
}

const ANALYTICS_STORAGE_KEY = "susuchain.analytics.events";
const MAX_STORED_EVENTS = 100;

/**
 * Track a custom analytics event
 */
export function trackEvent(event: Omit<AnalyticsEvent, "timestamp">): void {
  const fullEvent: AnalyticsEvent = {
    ...event,
    timestamp: Date.now(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", fullEvent.name, fullEvent.properties);
  }

  // Store events locally
  storeEvent(fullEvent);

  // Future: Send to WalletConnect Cloud or other analytics service
  // sendToAnalyticsService(fullEvent);
}

/**
 * Store event in localStorage for local tracking
 */
function storeEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];

    // Add new event
    events.push(event);

    // Keep only the most recent events
    if (events.length > MAX_STORED_EVENTS) {
      events.shift();
    }

    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn("Failed to store analytics event:", error);
  }
}

/**
 * Get all stored analytics events
 */
export function getStoredEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to retrieve analytics events:", error);
    return [];
  }
}

/**
 * Clear all stored analytics events
 */
export function clearStoredEvents(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ANALYTICS_STORAGE_KEY);
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary() {
  const events = getStoredEvents();

  const summary = {
    totalEvents: events.length,
    eventCounts: {} as Record<string, number>,
    recentEvents: events.slice(-10),
  };

  events.forEach(event => {
    summary.eventCounts[event.name] = (summary.eventCounts[event.name] || 0) + 1;
  });

  return summary;
}
