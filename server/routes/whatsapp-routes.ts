import { Router, Request, Response } from 'express';
import { whatsAppService } from '../lib/integrations/whatsapp-web.js';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { whatsappLimiter } from '../middleware/rate-limit.js';
import { storage } from '../storage.js';

const router = Router();

router.post('/connect', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    
    // Check if WhatsApp Web.js is available
    if (!whatsAppService.isAvailable()) {
      res.status(503).json({
        error: 'QR code connection is not available in production. Please use the WhatsApp OTP method instead.',
        suggestion: 'Go to Settings > Integrations and use "Connect via Phone Number" option',
        useOTP: true,
      });
      return;
    }
    
    await whatsAppService.initializeClient(userId);

    res.json({
      success: true,
      message: 'WhatsApp connection initiated. Please scan the QR code.',
      status: whatsAppService.getStatus(userId),
    });
  } catch (error: any) {
    console.error('Error initializing WhatsApp:', error);
    res.status(500).json({
      error: error.message || 'Failed to initialize WhatsApp connection',
      useOTP: true,
    });
  }
});

router.get('/qr', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    
    // Check if WhatsApp Web.js is available
    if (!whatsAppService.isAvailable()) {
      res.status(503).json({
        error: 'QR code connection is not available in production.',
        suggestion: 'Please use the WhatsApp OTP method to connect your phone number.',
        useOTP: true,
      });
      return;
    }
    
    const qrCode = whatsAppService.getQRCode(userId);
    const status = whatsAppService.getStatus(userId);

    if (!qrCode && status !== 'ready' && status !== 'authenticated') {
      res.status(404).json({
        error: 'No QR code available. Please initiate connection first.',
        status,
      });
      return;
    }

    res.json({
      qrCode,
      status,
      ready: status === 'ready',
    });
  } catch (error) {
    console.error('Error getting QR code:', error);
    res.status(500).json({
      error: 'Failed to get QR code',
    });
  }
});

router.get('/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    
    // Ensure service is initialized for this user
    const status = whatsAppService.getStatus(userId);
    const isReady = whatsAppService.isReady(userId);
    const userRecord = await storage.getUserById(userId);
    
    // Check user's metadata for WhatsApp connection status
    const metadata = (userRecord?.metadata as Record<string, unknown>) || {};
    const whatsappConnected = metadata.whatsapp_connected === true;
    const actualStatus = whatsappConnected ? 'ready' : status;

    res.json({
      status: actualStatus,
      ready: whatsappConnected || isReady,
      connected: whatsappConnected || status === 'ready',
    });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({
      error: 'Failed to get WhatsApp status',
    });
  }
});

router.post('/disconnect', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;

    await whatsAppService.destroySession(userId);

    const user = await storage.getUserById(userId);
    if (user) {
      await storage.updateUser(userId, {
        metadata: {
          ...(user.metadata ?? {}),
          whatsapp_connected: false,
          whatsapp_disconnected_at: new Date().toISOString(),
        } as Record<string, unknown>,
      });
    }

    res.json({
      success: true,
      message: 'WhatsApp disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({
      error: 'Failed to disconnect WhatsApp',
    });
  }
});

interface SendMessageBody {
  phoneNumber: string;
  message: string;
  leadId?: string;
}

router.post('/send', requireAuth, whatsappLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { phoneNumber, message, leadId } = req.body as SendMessageBody;

    if (!phoneNumber || !message) {
      res.status(400).json({
        error: 'Phone number and message are required',
      });
      return;
    }

    if (!whatsAppService.isReady(userId)) {
      res.status(400).json({
        error: 'WhatsApp not connected. Please connect first.',
      });
      return;
    }

    const result = await whatsAppService.sendMessage(userId, phoneNumber, message);

    if (leadId) {
      await storage.createMessage({
        leadId,
        userId,
        provider: 'whatsapp',
        direction: 'outbound',
        body: message,
        metadata: {
          sent_at: new Date().toISOString(),
          message_id: result.messageId,
        },
      });
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      messageId: result.messageId,
    });
  } catch (error: unknown) {
    console.error('Error sending WhatsApp message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    res.status(500).json({
      error: errorMessage,
    });
  }
});

export default router;
