
import webpush from 'web-push';

// Initialize web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@audnix.ai',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  notification: PushNotification
): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY) {
    console.warn('⚠️  Push notifications disabled (VAPID keys not set)');
    return;
  }

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: notification.icon || '/favicon.png',
    badge: notification.badge || '/favicon.png',
    data: { url: notification.url }
  });

  try {
    await webpush.sendNotification(subscription, payload);
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Subscription expired - remove from database
      console.log('Push subscription expired, should be removed');
    }
    throw error;
  }
}
