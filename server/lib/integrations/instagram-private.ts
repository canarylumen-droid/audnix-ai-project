
import { IgApiClient } from 'instagram-private-api';
import { storage } from '../../storage';

interface InstagramSession {
  userId: string;
  client: IgApiClient;
  username: string;
  isAuthenticated: boolean;
  lastActivity: Date;
  messagesThisHour: number;
  hourResetTime: Date;
}

class InstagramPrivateService {
  private sessions: Map<string, InstagramSession> = new Map();
  private readonly MAX_DMS_PER_HOUR = 20; // Conservative limit
  private readonly MIN_DELAY_MS = 2000; // 2 seconds between actions
  private readonly MAX_DELAY_MS = 5000; // 5 seconds between actions

  async initializeClient(userId: string, username: string, password: string): Promise<void> {
    const ig = new IgApiClient();
    ig.state.generateDevice(username);

    try {
      await ig.account.login(username, password);

      const session: InstagramSession = {
        userId,
        client: ig,
        username,
        isAuthenticated: true,
        lastActivity: new Date(),
        messagesThisHour: 0,
        hourResetTime: new Date(Date.now() + 60 * 60 * 1000),
      };

      this.sessions.set(userId, session);

      await storage.updateUser(userId, {
        metadata: {
          instagram_private_connected: true,
          instagram_username: username,
          connected_at: new Date().toISOString(),
        },
      });

      console.log(`✅ Instagram Private API authenticated for ${username}`);
    } catch (error) {
      console.error('Instagram authentication error:', error);
      throw new Error('Failed to authenticate with Instagram');
    }
  }

  async sendMessage(userId: string, recipientUsername: string, message: string): Promise<void> {
    const session = this.sessions.get(userId);

    if (!session || !session.isAuthenticated) {
      throw new Error('Instagram not connected. Please authenticate first.');
    }

    // Reset hourly counter if needed
    if (new Date() > session.hourResetTime) {
      session.messagesThisHour = 0;
      session.hourResetTime = new Date(Date.now() + 60 * 60 * 1000);
    }

    // Check rate limit
    if (session.messagesThisHour >= this.MAX_DMS_PER_HOUR) {
      throw new Error('Hourly DM limit reached (20/hour). Please wait before sending more messages.');
    }

    // Human-like delay
    await this.randomDelay();

    try {
      const userId = await session.client.user.getIdByUsername(recipientUsername);
      const thread = session.client.entity.directThread([userId.toString()]);
      await thread.broadcastText(message);

      session.messagesThisHour++;
      session.lastActivity = new Date();

      console.log(`✅ Instagram DM sent to ${recipientUsername} (${session.messagesThisHour}/20 this hour)`);
    } catch (error) {
      console.error('Error sending Instagram DM:', error);
      throw new Error('Failed to send Instagram message');
    }
  }

  async getInbox(userId: string, limit: number = 20): Promise<any[]> {
    const session = this.sessions.get(userId);

    if (!session || !session.isAuthenticated) {
      throw new Error('Instagram not connected');
    }

    await this.randomDelay();

    try {
      const inbox = await session.client.feed.directInbox().items();
      return inbox.slice(0, limit);
    } catch (error) {
      console.error('Error fetching Instagram inbox:', error);
      return [];
    }
  }

  async disconnect(userId: string): Promise<void> {
    const session = this.sessions.get(userId);
    if (session) {
      try {
        await session.client.account.logout();
      } catch (error) {
        console.error('Error logging out:', error);
      }
      this.sessions.delete(userId);

      await storage.updateUser(userId, {
        metadata: {
          instagram_private_connected: false,
          disconnected_at: new Date().toISOString(),
        },
      });
    }
  }

  getStatus(userId: string): {
    connected: boolean;
    messagesThisHour: number;
    remainingThisHour: number;
    resetTime: Date | null;
  } {
    const session = this.sessions.get(userId);
    
    if (!session) {
      return {
        connected: false,
        messagesThisHour: 0,
        remainingThisHour: 0,
        resetTime: null,
      };
    }

    return {
      connected: session.isAuthenticated,
      messagesThisHour: session.messagesThisHour,
      remainingThisHour: this.MAX_DMS_PER_HOUR - session.messagesThisHour,
      resetTime: session.hourResetTime,
    };
  }

  private async randomDelay(): Promise<void> {
    const delay = Math.random() * (this.MAX_DELAY_MS - this.MIN_DELAY_MS) + this.MIN_DELAY_MS;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export const instagramPrivateService = new InstagramPrivateService();
