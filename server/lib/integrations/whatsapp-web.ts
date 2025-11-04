import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import { storage } from '../../storage';

import type { Message } from 'whatsapp-web.js';

interface WhatsAppSession {
  userId: string;
  client: Client;
  status: 'disconnected' | 'qr_ready' | 'authenticated' | 'ready';
  qrCode: string | null;
  lastActivity: Date;
}

class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;

  constructor() {
    this.startSessionCleanup();
  }

  async initializeClient(userId: string): Promise<void> {
    if (this.sessions.has(userId)) {
      const session = this.sessions.get(userId)!;
      if (session.status === 'ready' || session.status === 'authenticated') {
        return;
      }
      await this.destroySession(userId);
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `user_${userId}`,
        dataPath: `.wwebjs_auth/${userId}`,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    const session: WhatsAppSession = {
      userId,
      client,
      status: 'disconnected',
      qrCode: null,
      lastActivity: new Date(),
    };

    client.on('qr', async (qr) => {
      try {
        const qrDataUrl = await qrcode.toDataURL(qr);
        session.qrCode = qrDataUrl;
        session.status = 'qr_ready';
        session.lastActivity = new Date();
        console.log(`✅ QR Code ready for user ${userId}`);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    });

    client.on('authenticated', () => {
      session.status = 'authenticated';
      session.qrCode = null;
      session.lastActivity = new Date();
      console.log(`✅ WhatsApp authenticated for user ${userId}`);
    });

    client.on('ready', async () => {
      session.status = 'ready';
      session.lastActivity = new Date();
      console.log(`✅ WhatsApp ready for user ${userId}`);

      await storage.updateUser(userId, {
        metadata: {
          whatsapp_connected: true,
          whatsapp_connected_at: new Date().toISOString(),
        },
      });
    });

    client.on('disconnected', async (reason) => {
      console.log(`❌ WhatsApp disconnected for user ${userId}:`, reason);
      await this.destroySession(userId);

      await storage.updateUser(userId, {
        metadata: {
          whatsapp_connected: false,
          whatsapp_disconnected_at: new Date().toISOString(),
        },
      });
    });

    client.on('message', async (message: Message) => {
      await this.handleIncomingMessage(userId, message);
    });

    client.on('auth_failure', async (msg) => {
      console.error(`❌ Authentication failed for user ${userId}:`, msg);
      await this.destroySession(userId);
    });

    this.sessions.set(userId, session);

    try {
      await client.initialize();
    } catch (error) {
      console.error(`Failed to initialize WhatsApp client for user ${userId}:`, error);
      this.sessions.delete(userId);
      throw error;
    }
  }

  async destroySession(userId: string): Promise<void> {
    const session = this.sessions.get(userId);
    if (session) {
      try {
        await session.client.destroy();
      } catch (error) {
        console.error('Error destroying client:', error);
      }
      this.sessions.delete(userId);
    }
  }

  getSession(userId: string): WhatsAppSession | undefined {
    return this.sessions.get(userId);
  }

  getQRCode(userId: string): string | null {
    const session = this.sessions.get(userId);
    return session?.qrCode || null;
  }

  getStatus(userId: string): string {
    const session = this.sessions.get(userId);
    return session?.status || 'disconnected';
  }

  isReady(userId: string): boolean {
    const session = this.sessions.get(userId);
    return session?.status === 'ready';
  }

  async sendMessage(userId: string, phoneNumber: string, message: string): Promise<void> {
    const session = this.sessions.get(userId);

    if (!session || session.status !== 'ready') {
      throw new Error('WhatsApp not connected. Please scan QR code first.');
    }

    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    
    try {
      session.lastActivity = new Date();
      await session.client.sendMessage(`${formattedNumber}@c.us`, message);
      console.log(`✅ Message sent to ${formattedNumber} by user ${userId}`);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^0-9]/g, '');
  }

  private async handleIncomingMessage(userId: string, message: Message): Promise<void> {
    try {
      const session = this.sessions.get(userId);
      if (!session) return;

      session.lastActivity = new Date();

      const contact = await message.getContact();
      const chat = await message.getChat();

      const phoneNumber = contact.id.user;
      const messageBody = message.body;
      const isGroup = chat.isGroup;

      if (isGroup) {
        console.log(`📱 Ignoring group message for user ${userId}`);
        return;
      }

      let lead = await storage.getLeadByPhone(userId, phoneNumber);

      if (!lead) {
        lead = await storage.createLead({
          userId,
          name: contact.pushname || contact.name || phoneNumber,
          phone: phoneNumber,
          channel: 'whatsapp',
          status: 'new',
          metadata: {
            whatsapp_contact_id: contact.id._serialized,
          },
        });
      }

      await storage.createMessage({
        leadId: lead.id,
        userId,
        provider: 'whatsapp',
        direction: 'inbound',
        body: messageBody,
        metadata: {
          message_id: message.id._serialized,
          timestamp: message.timestamp,
        },
      });

      console.log(`✅ Stored WhatsApp message from ${phoneNumber} for user ${userId}`);
    } catch (error) {
      console.error('Error handling incoming WhatsApp message:', error);
    }
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [userId, session] of this.sessions.entries()) {
        const timeSinceLastActivity = now - session.lastActivity.getTime();
        
        if (timeSinceLastActivity > this.SESSION_TIMEOUT && session.status !== 'ready') {
          console.log(`🧹 Cleaning up inactive session for user ${userId}`);
          this.destroySession(userId);
        }
      }
    }, 5 * 60 * 1000);
  }
}

export const whatsAppService = new WhatsAppService();
