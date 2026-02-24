import { useEffect, useCallback } from 'react';
import { useRealtime } from './use-realtime';

/**
 * Hook that listens for email open/click tracking updates
 * Updates UI when emails are opened or links are clicked
 */
export function useEmailTracking() {
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('messages_updated', (payload: any) => {
      if (payload.action === 'UPDATE' && payload.message) {
        const msg = payload.message;
        
        // Track email opens
        if (msg.openedAt && !msg.previousOpenedAt) {
          console.log('[v0] Email opened:', {
            messageId: msg.id,
            openedAt: msg.openedAt,
            leadId: msg.leadId
          });

          // Show notification for opened email
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Email Opened', {
              body: `Your email was opened`,
              tag: `email-open-${msg.id}`,
              icon: '/logo.svg'
            });
          }
        }

        // Track link clicks
        if (msg.clickedAt && !msg.previousClickedAt) {
          console.log('[v0] Email link clicked:', {
            messageId: msg.id,
            clickedAt: msg.clickedAt,
            linkUrl: msg.metadata?.clickedUrl
          });

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Email Link Clicked', {
              body: `Recipient clicked a link in your email`,
              tag: `email-click-${msg.id}`,
              icon: '/logo.svg'
            });
          }
        }
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Request notification permissions if needed
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error('[v0] Notification permission error:', error);
      }
    }
  }, []);

  return {
    requestNotificationPermission
  };
}
