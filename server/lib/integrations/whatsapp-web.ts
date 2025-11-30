
import qrcode from 'qrcode';
import { storage } from '../../storage.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Check if running in serverless environment (Vercel, etc.)
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Only load whatsapp-web.js if not in serverless (it requires puppeteer which doesn't work there)
let Client: any;
let LocalAuth: any;

if (!isServerless) {
  try {
    const wwebjs = require('whatsapp-web.js');
    Client = wwebjs.Client;
    LocalAuth = wwebjs.LocalAuth;
  } catch (error) {
    console.warn('⚠️ WhatsApp Web.js not available - QR code connection disabled');
  }
}

interface WhatsAppMessage {
  id: { _serialized: string };
  body: string;
  timestamp: number;
  getContact: () => Promise<any>;
  getChat: () => Promise<any>;
}

interface WhatsAppSession {
  userId: string;
  client: any; // WhatsApp Client instance
  status: 'disconnected' | 'qr_ready' | 'authenticated' | 'ready' | 'auth_failure';
  qrCode: string | null;
  lastActivity: Date;
}

class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private readonly SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour for QR code timeout
  private readonly ACTIVE_SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours for active sessions

  constructor() {
    this.startSessionCleanup();
  }

  isAvailable(): boolean {
    return !isServerless && Client !== undefined;
  }

  async initializeClient(userId: string): Promise<void> {
    // Check if WhatsApp Web.js is available (not available in serverless environments)
    if (!this.isAvailable()) {
      throw new Error('WhatsApp QR connection is not available in this environment. Please use the WhatsApp OTP method via Twilio instead.');
    }

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

    client.on('qr', async (qr: string) => {
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
    });

    client.on('disconnected', async (reason: string) => {
      console.log(`❌ WhatsApp disconnected for user ${userId}:`, reason);
      await this.destroySession(userId);
    });

    client.on('message', async (message: WhatsAppMessage) => {
      await this.handleIncomingMessage(userId, message);
    });

    client.on('auth_failure', async (msg: string) => {
      console.error(`❌ Authentication failed for user ${userId}:`, msg);
      session.status = 'auth_failure';
      session.lastActivity = new Date();
      // Don't destroy immediately - let cleanup handle it
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

  async sendMessage(userId: string, phoneNumber: string, message: string): Promise<{ messageId: string }> {
    const session = this.sessions.get(userId);

    if (!session || session.status !== 'ready') {
      throw new Error('WhatsApp not connected. Please scan QR code first.');
    }

    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    
    try {
      session.lastActivity = new Date();
      const sentMessage = await session.client.sendMessage(`${formattedNumber}@c.us`, message);
      console.log(`✅ WhatsApp message sent to ${formattedNumber} by user ${userId}`);
      
      return { messageId: sentMessage.id._serialized };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^0-9]/g, '');
  }

  private async handleIncomingMessage(userId: string, message: WhatsAppMessage): Promise<void> {
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
        
        // Only clean up QR sessions that are stale (never authenticated)
        if (session.status === 'qr_ready' && timeSinceLastActivity > this.SESSION_TIMEOUT) {
          console.log(`🧹 Cleaning up stale QR session for user ${userId}`);
          this.destroySession(userId);
        }
        
        // Keep 'ready' sessions alive indefinitely (persistent)
        // Only destroy if explicitly disconnected or failed
        if (session.status === 'disconnected' || session.status === 'auth_failure') {
          console.log(`🧹 Removing failed session for user ${userId}`);
          this.sessions.delete(userId);
        }
      }
    }, 10 * 60 * 1000); // Check every 10 minutes
  }
}

export const whatsAppService = new WhatsAppService();
