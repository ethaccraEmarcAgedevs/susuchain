import { Address } from "viem";

/**
 * Deadline notification service for Susu groups
 * Sends notifications at 24h, 6h, and 1h before deadline
 */

export interface DeadlineNotification {
  groupAddress: Address;
  groupName: string;
  roundNumber: number;
  timeRemaining: number; // in seconds
  type: "24h" | "6h" | "1h" | "overdue";
  message: string;
}

const NOTIFICATION_INTERVALS = {
  "24h": 24 * 60 * 60, // 24 hours
  "6h": 6 * 60 * 60, // 6 hours
  "1h": 60 * 60, // 1 hour
} as const;

/**
 * Check if notification should be sent based on time remaining
 */
export function shouldSendNotification(
  timeRemaining: number,
  lastNotificationTime?: number,
): "24h" | "6h" | "1h" | "overdue" | null {
  // Overdue
  if (timeRemaining <= 0) {
    return "overdue";
  }

  // 1 hour warning
  if (timeRemaining <= NOTIFICATION_INTERVALS["1h"] && timeRemaining > NOTIFICATION_INTERVALS["1h"] - 300) {
    return "1h";
  }

  // 6 hour warning
  if (timeRemaining <= NOTIFICATION_INTERVALS["6h"] && timeRemaining > NOTIFICATION_INTERVALS["6h"] - 300) {
    return "6h";
  }

  // 24 hour warning
  if (timeRemaining <= NOTIFICATION_INTERVALS["24h"] && timeRemaining > NOTIFICATION_INTERVALS["24h"] - 300) {
    return "24h";
  }

  return null;
}

/**
 * Generate notification message
 */
export function generateNotificationMessage(
  groupName: string,
  roundNumber: number,
  type: "24h" | "6h" | "1h" | "overdue",
): string {
  const messages = {
    "24h": `⏰ Reminder: You have 24 hours to contribute to ${groupName} (Round ${roundNumber})`,
    "6h": `⚠️ Urgent: Only 6 hours left to contribute to ${groupName} (Round ${roundNumber})`,
    "1h": `🚨 Last hour! Contribute to ${groupName} (Round ${roundNumber}) before deadline`,
    overdue: `❌ Deadline passed for ${groupName} (Round ${roundNumber}). Late penalty may apply.`,
  };

  return messages[type];
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) {
    return "Overdue";
  }

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Send browser notification
 */
export async function sendBrowserNotification(notification: DeadlineNotification): Promise<void> {
  // Check if notifications are supported
  if (!("Notification" in window)) {
    console.log("Browser notifications not supported");
    return;
  }

  // Request permission if needed
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  // Send notification if permitted
  if (Notification.permission === "granted") {
    new Notification("SusuChain Deadline Alert", {
      body: notification.message,
      icon: "/logo.png",
      badge: "/badge.png",
      tag: `${notification.groupAddress}-${notification.roundNumber}`,
      requireInteraction: notification.type === "1h" || notification.type === "overdue",
    });
  }
}

/**
 * Local storage key for notification tracking
 */
function getNotificationKey(groupAddress: Address, roundNumber: number): string {
  return `susu-notification-${groupAddress}-${roundNumber}`;
}

/**
 * Check if notification was already sent
 */
export function wasNotificationSent(groupAddress: Address, roundNumber: number, type: string): boolean {
  const key = getNotificationKey(groupAddress, roundNumber);
  const stored = localStorage.getItem(key);

  if (!stored) return false;

  const notifications = JSON.parse(stored);
  return notifications[type] === true;
}

/**
 * Mark notification as sent
 */
export function markNotificationSent(groupAddress: Address, roundNumber: number, type: string): void {
  const key = getNotificationKey(groupAddress, roundNumber);
  const stored = localStorage.getItem(key);

  const notifications = stored ? JSON.parse(stored) : {};
  notifications[type] = true;

  localStorage.setItem(key, JSON.stringify(notifications));
}

/**
 * Request notification permission on app load
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "default") {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * Get upcoming deadlines for all user's groups
 */
export interface UpcomingDeadline {
  groupAddress: Address;
  groupName: string;
  roundNumber: number;
  deadline: number;
  timeRemaining: number;
  hasContributed: boolean;
}

/**
 * Sort deadlines by urgency
 */
export function sortDeadlinesByUrgency(deadlines: UpcomingDeadline[]): UpcomingDeadline[] {
  return deadlines
    .filter(d => d.timeRemaining > 0 && !d.hasContributed)
    .sort((a, b) => a.timeRemaining - b.timeRemaining);
}
