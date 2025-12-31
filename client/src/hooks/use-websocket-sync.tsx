import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketMessage {
  type: 'leads_updated' | 'messages_updated' | 'deals_updated' | 'settings_updated' | 'ping';
  data?: any;
  timestamp?: string;
}

interface UseWebSocketSyncOptions {
  userId?: string;
  enabled?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocketSync({ userId, enabled = true, onMessage }: UseWebSocketSyncOptions = {}) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !userId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/sync?userId=${userId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected for real-time sync');
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastUpdate(new Date());

          switch (message.type) {
            case 'leads_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
              break;
            case 'messages_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
              queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
              break;
            case 'deals_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
              break;
            case 'settings_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
              queryClient.invalidateQueries({ queryKey: ['/api/settings/smtp'] });
              queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
              break;
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
          }

          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, attempting reconnect...');
        setIsConnected(false);
        wsRef.current = null;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, [enabled, userId, queryClient, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    lastUpdate,
    send,
  };
}

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const updateStatus = useCallback((connected: boolean) => {
    setSyncStatus(connected ? 'connected' : 'disconnected');
    if (connected) {
      setLastSyncTime(new Date());
    }
  }, []);

  return {
    syncStatus,
    lastSyncTime,
    updateStatus,
    isRealtime: syncStatus === 'connected',
  };
}
