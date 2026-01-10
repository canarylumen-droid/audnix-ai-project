import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { URL } from 'url';

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

type MessageType = 'leads_updated' | 'messages_updated' | 'deals_updated' | 'settings_updated' | 'ping' | 'pong' | 'PROSPECTING_LOG' | 'PROSPECT_FOUND' | 'PROSPECT_UPDATED';

interface SyncMessage {
  type: MessageType;
  data?: any;
  timestamp: string;
}

class WebSocketSyncServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocketClient>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: http.Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/sync'
    });

    this.wss.on('connection', (ws: WebSocketClient, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId');

      if (!userId) {
        ws.close(4001, 'User ID required');
        return;
      }

      ws.userId = userId;
      ws.isAlive = true;

      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);

      console.log(`WebSocket connected: user ${userId} (${this.clients.get(userId)?.size || 0} connections)`);

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'pong') {
            ws.isAlive = true;
          }
        } catch (e) {
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          const userClients = this.clients.get(ws.userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              this.clients.delete(ws.userId);
            }
          }
          console.log(`WebSocket disconnected: user ${ws.userId}`);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error.message);
      });

      ws.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
      }));
    });

    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws: WebSocketClient) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
    });

    console.log('WebSocket sync server initialized on /ws/sync');
  }

  broadcast(userId: string, message: Omit<SyncMessage, 'timestamp'>) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;

    const fullMessage: SyncMessage = {
      ...message,
      timestamp: new Date().toISOString()
    };

    const messageStr = JSON.stringify(fullMessage);

    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  broadcastToAll(message: Omit<SyncMessage, 'timestamp'>) {
    const fullMessage: SyncMessage = {
      ...message,
      timestamp: new Date().toISOString()
    };

    const messageStr = JSON.stringify(fullMessage);

    this.wss?.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  notifyLeadsUpdated(userId: string, data?: any) {
    this.broadcast(userId, { type: 'leads_updated', data });
  }

  notifyMessagesUpdated(userId: string, data?: any) {
    this.broadcast(userId, { type: 'messages_updated', data });
  }

  notifyDealsUpdated(userId: string, data?: any) {
    this.broadcast(userId, { type: 'deals_updated', data });
  }

  notifySettingsUpdated(userId: string, data?: any) {
    this.broadcast(userId, { type: 'settings_updated', data });
  }

  broadcastToUser(userId: string, message: { type: string, payload: any }) {
    this.broadcast(userId, { type: message.type as MessageType, data: message.payload });
  }

  getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  getConnectionCount(userId: string): number {
    return this.clients.get(userId)?.size || 0;
  }
}

export const wsSync = new WebSocketSyncServer();
