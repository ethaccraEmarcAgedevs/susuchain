/**
 * Push notification service for contribution reminders and group updates
 */

export type NotificationType = 'contribution_due' | 'payout_ready' | 'group_invitation' | 'round_complete';

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
  groupAddress?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Push notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      return subscription;
    }

    // Public VAPID key (replace with your actual key in production)
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

    if (!vapidPublicKey) {
      console.error('VAPID public key not configured');
      return null;
    }

    // Subscribe to push notifications
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Send subscription to server
    await sendSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscriptionFromServer(subscription);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * Send local notification (doesn't require permission for service worker)
 */
export async function sendLocalNotification(data: NotificationData): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    // Fallback to browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.body,
        icon: '/favicon.png',
        badge: '/favicon.png',
      });
    }
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        groupAddress: data.groupAddress,
      },
      actions: data.actions || [],
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Send subscription to server
 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
  } catch (error) {
    console.error('Error sending subscription to server:', error);
  }
}

/**
 * Remove subscription from server
 */
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
  } catch (error) {
    console.error('Error removing subscription from server:', error);
  }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Get current push subscription
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
}

/**
 * Schedule contribution reminder notification
 */
export async function scheduleContributionReminder(
  groupName: string,
  groupAddress: string,
  dueDate: Date,
): Promise<void> {
  const now = new Date();
  const timeUntilDue = dueDate.getTime() - now.getTime();
  const oneDayBeforeDue = timeUntilDue - 24 * 60 * 60 * 1000;

  if (oneDayBeforeDue > 0) {
    setTimeout(async () => {
      await sendLocalNotification({
        type: 'contribution_due',
        title: 'Contribution Due Tomorrow',
        body: `Your contribution to "${groupName}" is due tomorrow. Don't miss it!`,
        url: `/group/${groupAddress}`,
        groupAddress,
        actions: [
          {
            action: 'contribute',
            title: 'Contribute Now',
          },
          {
            action: 'view',
            title: 'View Group',
          },
        ],
      });
    }, oneDayBeforeDue);
  }
}

/**
 * Send payout notification
 */
export async function sendPayoutNotification(groupName: string, groupAddress: string, amount: string): Promise<void> {
  await sendLocalNotification({
    type: 'payout_ready',
    title: 'Payout Ready! 🎉',
    body: `You're receiving ${amount} ETH from "${groupName}"`,
    url: `/group/${groupAddress}`,
    groupAddress,
    actions: [
      {
        action: 'view',
        title: 'View Group',
      },
    ],
  });
}

/**
 * Send group invitation notification
 */
export async function sendGroupInvitationNotification(groupName: string, inviterName: string, groupAddress: string): Promise<void> {
  await sendLocalNotification({
    type: 'group_invitation',
    title: 'Group Invitation',
    body: `${inviterName} invited you to join "${groupName}"`,
    url: `/group/${groupAddress}`,
    groupAddress,
    actions: [
      {
        action: 'accept',
        title: 'Join Group',
      },
      {
        action: 'view',
        title: 'View Details',
      },
    ],
  });
}

/**
 * Send round completion notification
 */
export async function sendRoundCompleteNotification(groupName: string, groupAddress: string): Promise<void> {
  await sendLocalNotification({
    type: 'round_complete',
    title: 'Round Completed! ✅',
    body: `"${groupName}" has completed another round successfully`,
    url: `/group/${groupAddress}`,
    groupAddress,
    actions: [
      {
        action: 'view',
        title: 'View Group',
      },
    ],
  });
}
