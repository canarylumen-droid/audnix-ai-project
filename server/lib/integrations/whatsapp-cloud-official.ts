
import { Whatsapp } from 'whatsapp-cloud-api';
import { storage } from '../../storage';
import { encrypt, decrypt } from '../crypto/encryption';

interface WhatsAppCloudConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken?: string;
}

interface WhatsAppCloudSession {
  userId: string;
  client: Whatsapp;
  config: WhatsAppCloudConfig;
  isAuthenticated: boolean;
}

/**
 * Official WhatsApp Cloud API Integration
 * Uses Meta's official API - ZERO ban risk
 * No phone scanning required
 */
class WhatsAppCloudService {
  private sessions: Map<string, WhatsAppCloudSession> = new Map();

  /**
   * Initialize WhatsApp Cloud API client
   * Get credentials from Meta Business Suite:
   * 1. Go to https://business.facebook.com/settings/whatsapp-business-accounts
   * 2. Create WhatsApp Business Account
   * 3. Get Phone Number ID and Access Token
   */
  async initializeClient(
    userId: string,
    phoneNumberId: string,
    accessToken: string
  ): Promise<void> {
    try {
      // Validate credentials format
      if (!phoneNumberId.match(/^\d+$/)) {
        throw new Error('Invalid Phone Number ID format');
      }

      // Initialize official WhatsApp client
      const client = new Whatsapp({
        token: accessToken,
        appSecret: process.env.WHATSAPP_APP_SECRET, // Optional webhook verification
      });

      // Test connection
      await this.validateConnection(phoneNumberId, accessToken);

      const session: WhatsAppCloudSession = {
        userId,
        client,
        config: {
          phoneNumberId,
          accessToken,
        },
        isAuthenticated: true,
      };

      this.sessions.set(userId, session);

      // Save encrypted credentials
      const encryptedConfig = encrypt(JSON.stringify({
        phoneNumberId,
        accessToken,
      }));

      await storage.updateUser(userId, {
        metadata: {
          whatsapp_connected: true,
          whatsapp_provider: 'cloud_api',
          whatsapp_phone_id: phoneNumberId,
          whatsapp_credentials: encryptedConfig,
          connected_at: new Date().toISOString(),
        },
      });

      console.log(`✅ WhatsApp Cloud API connected for user ${userId}`);
    } catch (error) {
      console.error('WhatsApp Cloud API initialization error:', error);
      throw new Error('Failed to connect WhatsApp Cloud API');
    }
  }

  /**
   * Restore session from saved credentials
   */
  async restoreSession(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user?.metadata?.whatsapp_credentials) {
      throw new Error('No saved WhatsApp credentials found');
    }

    const config = JSON.parse(decrypt(user.metadata.whatsapp_credentials)) as WhatsAppCloudConfig;
    
    const client = new Whatsapp({
      token: config.accessToken,
      appSecret: process.env.WHATSAPP_APP_SECRET,
    });

    const session: WhatsAppCloudSession = {
      userId,
      client,
      config,
      isAuthenticated: true,
    };

    this.sessions.set(userId, session);
    console.log(`✅ WhatsApp Cloud session restored for user ${userId}`);
  }

  /**
   * Send text message
   */
  async sendMessage(
    userId: string,
    recipientPhone: string,
    message: string
  ): Promise<{ messageId: string }> {
    const session = this.sessions.get(userId);
    if (!session?.isAuthenticated) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const result = await session.client.sendText(
        session.config.phoneNumberId,
        recipientPhone.replace(/\D/g, ''), // Remove non-digits
        message
      );

      console.log(`✅ WhatsApp message sent to ${recipientPhone}`);
      return { messageId: result.messages[0].id };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  /**
   * Send audio/voice message
   */
  async sendAudio(
    userId: string,
    recipientPhone: string,
    audioUrl: string
  ): Promise<{ messageId: string }> {
    const session = this.sessions.get(userId);
    if (!session?.isAuthenticated) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const result = await session.client.sendAudio(
        session.config.phoneNumberId,
        recipientPhone.replace(/\D/g, ''),
        audioUrl
      );

      console.log(`✅ WhatsApp audio sent to ${recipientPhone}`);
      return { messageId: result.messages[0].id };
    } catch (error) {
      console.error('Error sending WhatsApp audio:', error);
      throw new Error('Failed to send WhatsApp audio');
    }
  }

  /**
   * Disconnect WhatsApp
   */
  async disconnect(userId: string): Promise<void> {
    this.sessions.delete(userId);

    await storage.updateUser(userId, {
      metadata: {
        whatsapp_connected: false,
        whatsapp_credentials: null,
        disconnected_at: new Date().toISOString(),
      },
    });
  }

  /**
   * Get connection status
   */
  getStatus(userId: string): {
    connected: boolean;
    provider: string;
  } {
    const session = this.sessions.get(userId);
    return {
      connected: session?.isAuthenticated || false,
      provider: 'whatsapp_cloud_api',
    };
  }

  /**
   * Validate connection to WhatsApp Cloud API
   */
  private async validateConnection(phoneNumberId: string, accessToken: string): Promise<void> {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Invalid WhatsApp credentials');
    }
  }
}

export const whatsAppCloudService = new WhatsAppCloudService();
