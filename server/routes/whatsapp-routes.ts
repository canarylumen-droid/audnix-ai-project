
import { Router } from 'express';
import { whatsAppService } from '../lib/integrations/whatsapp-web';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { whatsappLimiter } from '../middleware/rate-limit';
import { storage } from '../storage';

const router = Router();

// WhatsApp Web.js uses QR code only - no OTP/Twilio needed
// Keep existing QR code flow as primary method
router.post('/connect', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    await whatsAppService.initializeClient(userId);

    res.json({
      success: true,
      message: 'WhatsApp connection initiated. Please scan the QR code.',
      status: whatsAppService.getStatus(userId),
    });
  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    res.status(500).json({
      error: 'Failed to initialize WhatsApp connection',
    });
  }
});

router.get('/qr', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const qrCode = whatsAppService.getQRCode(userId);
    const status = whatsAppService.getStatus(userId);

    if (!qrCode && status !== 'ready' && status !== 'authenticated') {
      return res.status(404).json({
        error: 'No QR code available. Please initiate connection first.',
        status,
      });
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

router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const status = whatsAppService.getStatus(userId);
    const isReady = whatsAppService.isReady(userId);

    res.json({
      status,
      ready: isReady,
      connected: status === 'ready',
    });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({
      error: 'Failed to get WhatsApp status',
    });
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;

    await whatsAppService.destroySession(userId);

    await storage.updateUser(userId, {
      metadata: {
        whatsapp_connected: false,
        whatsapp_disconnected_at: new Date().toISOString(),
      },
    });

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

router.post('/send', requireAuth, whatsappLimiter, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { phoneNumber, message, leadId } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        error: 'Phone number and message are required',
      });
    }

    if (!whatsAppService.isReady(userId)) {
      return res.status(400).json({
        error: 'WhatsApp not connected. Please connect first.',
      });
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
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({
      error: error.message || 'Failed to send message',
    });
  }
});

export default router;
