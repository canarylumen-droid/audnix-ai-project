
import { Router } from 'express';
import { whatsAppService } from '../lib/integrations/whatsapp-web';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { whatsappLimiter } from '../middleware/rate-limit';
import { storage } from '../storage';

const router = Router();

// New OTP-based authentication flow
router.post('/connect-otp', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Send OTP via WhatsApp (using Twilio or similar)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP temporarily (expires in 5 minutes)
    await storage.updateUser(userId, {
      metadata: {
        whatsapp_otp: otpCode,
        whatsapp_otp_expires: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        whatsapp_phone_pending: phoneNumber,
      },
    });

    // TODO: Send OTP via Twilio WhatsApp
    // For now, return it for testing (remove in production)
    res.json({
      success: true,
      message: 'OTP sent to your WhatsApp',
      // Remove this in production:
      otp: otpCode,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { otp } = req.body;

    const user = await storage.getUser(userId);
    const metadata = user?.metadata as any;

    if (!metadata?.whatsapp_otp || !metadata?.whatsapp_otp_expires) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > new Date(metadata.whatsapp_otp_expires)) {
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    if (otp !== metadata.whatsapp_otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP verified - connect WhatsApp
    await whatsAppService.initializeClient(userId);

    await storage.updateUser(userId, {
      metadata: {
        whatsapp_connected: true,
        whatsapp_phone: metadata.whatsapp_phone_pending,
        whatsapp_otp: null,
        whatsapp_otp_expires: null,
        whatsapp_phone_pending: null,
      },
    });

    res.json({
      success: true,
      message: 'WhatsApp connected successfully',
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Keep existing QR code flow as fallback
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
