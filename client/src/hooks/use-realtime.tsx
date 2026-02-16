import { useEffect, useState, useRef, createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
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
    const audio = new Audio('/sounds/notification.mp3');
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

interface RealtimeContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType>({ socket: null, isConnected: false });

export function useRealtime() {
  return useContext(RealtimeContext);
}

interface RealtimeProviderProps {
  children: ReactNode;
  userId?: string;
}

export function RealtimeProvider({ children, userId }: RealtimeProviderProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lastNotificationTime = useRef<number>(0);
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Connect to Socket.IO server
    // Use relative path for production compatibility or configured URL
    const socketInstance = io(undefined, {
      path: '/socket.io',
      query: { userId },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected');
      setSocket(socketInstance);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
    });

    // LEADS UPDATES
    socketInstance.on('leads_updated', (payload: any) => {
      console.log('Lead update:', payload);
      // Data payload: { event: 'INSERT'|'UPDATE', lead: object }

      // Invalidate leads queries and dashboard stats
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prospecting/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/activity'] });

      // Handle INSERT notifications
      if (payload.event === 'INSERT' && payload.lead) {
        playNotificationSound();
        toast({
          title: '🎯 New Lead Captured',
          description: `${payload.lead.name} from ${payload.lead.channel}`,
        });
        showPushNotification('🎯 New Lead Captured', {
          body: `${payload.lead.name} from ${payload.lead.channel}`,
          tag: 'new-lead',
          data: { url: '/dashboard/inbox' }
        });
      }

      // Handle UPDATE status changes
      if (payload.event === 'UPDATE' && payload.lead?.status === 'converted') {
        playNotificationSound();
        toast({
          title: '🎉 Conversion!',
          description: `${payload.lead.name} converted to customer`,
        });
        showPushNotification('🎉 Conversion!', {
          body: `${payload.lead.name} converted to customer`,
          tag: 'conversion',
          requireInteraction: true,
          data: { url: '/dashboard/deals' }
        });
      }
    });

    // PROSPECTING EVENTS
    socketInstance.on('PROSPECTING_LOG', (payload: any) => {
      console.log('Prospecting log:', payload);
      // Let individual pages handle logs via custom event or status
    });

    socketInstance.on('PROSPECT_FOUND', () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prospecting/leads'] });
    });

    socketInstance.on('PROSPECT_UPDATED', () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prospecting/leads'] });
    });

    // MESSAGES UPDATES
    socketInstance.on('messages_updated', (payload: any) => {
      console.log('Message update:', payload);
      // Payload: { event: 'INSERT', message: object }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      // Invalidate specific lead conversation if needed
      if (payload.message?.leadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", payload.message.leadId] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/activity'] });

      // Notification for inbound messages
      if (payload.message?.direction === 'inbound') {
        playNotificationSound();
        toast({
          title: '💬 New Message',
          description: 'You have a new message from a lead',
        });
        showPushNotification('💬 New Message', {
          body: 'You have a new message from a lead',
          tag: 'new-message',
          data: { url: '/dashboard/conversations' }
        });
      }
    });

    // NOTIFICATIONS UPDATES
    // Assuming backend emits 'notification' event when creating rows in 'notifications' table
    socketInstance.on('notification', (payload: any) => {
      console.log('New notification:', payload);
      // Invalidate notifications queries
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });

      // Throttle sound
      const now = Date.now();
      if (now - lastNotificationTime.current > 2000) {
        playNotificationSound();
        lastNotificationTime.current = now;
      }

      const relativeTime = getRelativeTime(payload.created_at || new Date());
      toast({
        title: payload.title,
        description: `${payload.message} • ${relativeTime}`,
        variant: payload.type === 'billing_issue' ? 'destructive' : 'default',
      });
    });

    // CALENDAR UPDATES
    socketInstance.on('calendar_updated', (payload: any) => {
      console.log('Calendar update:', payload);
      queryClient.invalidateQueries({ queryKey: ['/api/oauth/google-calendar/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });

      if (payload.event === 'INSERT' && payload.eventData?.is_ai_booked) {
        playNotificationSound();
        toast({
          title: '📅 Meeting Booked',
          description: `AI scheduled: ${payload.eventData.title}`,
        });
        showPushNotification('📅 Meeting Booked', {
          body: `AI scheduled: ${payload.eventData.title}`,
          tag: 'meeting-booked',
          requireInteraction: true,
          data: { url: '/dashboard/calendar' }
        });
      }
    });

    // SETTINGS/USER UPDATES
    socketInstance.on('settings_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    });

    socketInstance.on('insights_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insights'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    });

    socketInstance.on('activity_updated', (payload: any) => {
      console.log('Activity update:', payload);
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    });

    // FORCE DISCONNECT/LOGOUT
    socketInstance.on('TERMINATE_SESSION', () => {
      console.warn('Session terminated by server');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [userId, queryClient, toast]);

  return (
    <RealtimeContext.Provider value={{ socket, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}
