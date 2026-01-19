import { Server, Socket } from 'socket.io';
import http from 'http';

type MessageType = 'leads_updated' | 'messages_updated' | 'deals_updated' | 'settings_updated' | 'ping' | 'pong' | 'PROSPECTING_LOG' | 'PROSPECT_FOUND' | 'PROSPECT_UPDATED' | 'notification' | 'calendar_updated' | 'TERMINATE_SESSION' | 'insights_updated';

interface SyncMessage {
  type: MessageType;
  data?: any;
  timestamp: string;
}

class WebSocketSyncServer {
  private io: Server | null = null;

  initialize(server: http.Server) {
    if (this.io) {
      console.log('socket.io already initialized');
      return;
    }
    this.io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://localhost:5000',
          process.env.NEXT_PUBLIC_APP_URL || '',
          'https://audnixai.com',
          'https://www.audnixai.com'
        ].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io' // Standard path
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.handshake.query.userId as string;

      if (!userId) {
        console.log('Socket connection rejected: No userId');
        socket.disconnect();
        return;
      }

      // Join a room specific to this user
      socket.join(`user:${userId}`);
      console.log(`Socket connected: User ${userId} (${socket.id})`);

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: User ${userId} (${socket.id})`);
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });

    console.log('✅ Socket.IO server initialized');
  }

  private emitToUser(userId: string, event: MessageType, data: any) {
    if (!this.io) return;
    const message: SyncMessage = {
      type: event,
      data,
      timestamp: new Date().toISOString()
    };

    // Emit 'message' event for generic listeners (legacy support)
    this.io.to(`user:${userId}`).emit('message', message);

    // Emit specific event for precise listeners
    this.io.to(`user:${userId}`).emit(event, data);
  }

  notifyLeadsUpdated(userId: string, data?: any) {
    this.emitToUser(userId, 'leads_updated', data);
  }

  notifyMessagesUpdated(userId: string, data?: any) {
    this.emitToUser(userId, 'messages_updated', data);
  }

  notifyDealsUpdated(userId: string, data?: any) {
    this.emitToUser(userId, 'deals_updated', data);
  }

  notifySettingsUpdated(userId: string, data?: any) {
    this.emitToUser(userId, 'settings_updated', data);
  }

  notifyCalendarUpdated(userId: string, data?: any) {
    this.emitToUser(userId, 'calendar_updated', data);
  }

  // Generic broadcast
  broadcastToUser(userId: string, message: { type: string, payload: any }) {
    this.emitToUser(userId, message.type as MessageType, message.payload);
  }

  // Admin/System wrappers
  getConnectedUsers(): string[] {
    // This is expensive in Socket.IO v4+, usually need fetchSockets()
    // For now, return empty or implement tracking if needed.
    return [];
  }
}

export const wsSync = new WebSocketSyncServer();
