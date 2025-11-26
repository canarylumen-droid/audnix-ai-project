
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Register service worker for PWA
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✓ Service Worker registered:', registration);
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Show push notification (works even when tab is closed)
const showPushNotification = async (title: string, options: any) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      ...options
    });
  }
};

// Notification sound
const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Could not play notification sound:', err));
  } catch (err) {
    console.log('Notification sound not available');
  }
};

// Format relative time
const getRelativeTime = (timestamp: string | Date): string => {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);
  
  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 120) return '1 min ago';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} mins ago`;
  if (diffSeconds < 7200) return '1 hour ago';
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
  if (diffSeconds < 172800) return '1 day ago';
  return `${Math.floor(diffSeconds / 86400)} days ago`;
};

export function useRealtime(userId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lastNotificationTime = useRef<number>(0);

  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!supabase || !userId) return;

    // Subscribe to leads table changes
    const leadsChannel = supabase
      .channel(`leads-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Lead change:', payload);
          
          // Invalidate leads queries
          queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
          queryClient.invalidateQueries({ queryKey: ['/api/leads/stats'] });
          
          // Show notification for new leads
          if (payload.eventType === 'INSERT') {
            playNotificationSound();
            toast({
              title: '🎯 New Lead Captured',
              description: `${payload.new.name} from ${payload.new.channel}`,
            });
            
            // Push notification
            showPushNotification('🎯 New Lead Captured', {
              body: `${payload.new.name} from ${payload.new.channel}`,
              tag: 'new-lead',
              data: { url: '/dashboard/inbox' }
            });
          }
          
          // Show notification for status changes
          if (payload.eventType === 'UPDATE' && payload.old.status !== payload.new.status) {
            if (payload.new.status === 'converted') {
              playNotificationSound();
              toast({
                title: '🎉 Conversion!',
                description: `${payload.new.name} converted to customer`,
              });
              
              // Push notification
              showPushNotification('🎉 Conversion!', {
                body: `${payload.new.name} converted to customer`,
                tag: 'conversion',
                requireInteraction: true,
                data: { url: '/dashboard/deals' }
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to messages table changes
    const messagesChannel = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New message:', payload);
          
          // Invalidate conversation queries
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          queryClient.invalidateQueries({ queryKey: [`/api/conversations/${payload.new.lead_id}`] });
          
          // Show notification for inbound messages with sound
          if (payload.new.direction === 'inbound') {
            playNotificationSound();
            toast({
              title: '💬 New Message',
              description: 'You have a new message from a lead',
            });
            
            // Push notification
            showPushNotification('💬 New Message', {
              body: 'You have a new message from a lead',
              tag: 'new-message',
              data: { url: '/dashboard/conversations' }
            });
          }
        }
      )
      .subscribe();

    // Subscribe to notifications table with enhanced handling
    const notificationsChannel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification:', payload);
          
          // Invalidate notifications queries
          queryClient.invalidateQueries({ queryKey: ['/api/user/notifications'] });
          
          // Throttle notification sounds (max 1 per 2 seconds)
          const now = Date.now();
          if (now - lastNotificationTime.current > 2000) {
            playNotificationSound();
            lastNotificationTime.current = now;
          }
          
          // Show the notification with relative time
          const relativeTime = getRelativeTime(payload.new.created_at);
          toast({
            title: payload.new.title,
            description: `${payload.new.message} • ${relativeTime}`,
            variant: payload.new.type === 'billing_issue' ? 'destructive' : 'default',
          });
        }
      )
      .subscribe();

    // Subscribe to calendar events
    const calendarChannel = supabase
      .channel(`calendar-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New calendar event:', payload);
          
          queryClient.invalidateQueries({ queryKey: ['/api/oauth/google-calendar/events'] });
          
          if (payload.new.is_ai_booked) {
            playNotificationSound();
            toast({
              title: '📅 Meeting Booked',
              description: `AI scheduled: ${payload.new.title}`,
            });
            
            // Push notification
            showPushNotification('📅 Meeting Booked', {
              body: `AI scheduled: ${payload.new.title}`,
              tag: 'meeting-booked',
              requireInteraction: true,
              data: { url: '/dashboard/calendar' }
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(calendarChannel);
    };
  }, [userId, queryClient, toast]);
}

// Hook to use in dashboard layout
export function useDashboardRealtime() {
  // Get current user ID from your auth context or storage
  const userId = localStorage.getItem('userId') || undefined;
  
  useRealtime(userId);
}
