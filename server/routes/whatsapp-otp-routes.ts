import { Router, Request, Response } from 'express';
import { whatsAppTwilioOTP } from '../lib/integrations/whatsapp-twilio-otp.js';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { whatsappLimiter } from '../middleware/rate-limit.js';

const router = Router();

/**
 * Request OTP for WhatsApp verification
 * Twilio sends the OTP via WhatsApp (branded as "Twilio")
 */
router.post('/otp/request', requireAuth, whatsappLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { phoneNumber } = req.body as { phoneNumber?: string };

    if (!phoneNumber) {
      res.status(400).json({
        error: 'Phone number is required (include country code, e.g., +2348012345678)',
      });
      return;
    }

    if (!whatsAppTwilioOTP.isConfigured()) {
      res.status(503).json({
        error: 'WhatsApp OTP is not configured. Please contact support.',
      });
      return;
    }

    const result = await whatsAppTwilioOTP.sendOTP(userId, phoneNumber);

    if (!result.success) {
      res.status(400).json({
        error: result.error || 'Failed to send OTP',
      });
      return;
    }

    res.json({
      success: true,
      message: 'OTP sent to your WhatsApp. Check your messages.',
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({
      error: 'Failed to send OTP',
    });
  }
});

/**
 * Verify OTP and connect WhatsApp
 */
router.post('/otp/verify', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { phoneNumber, otp } = req.body as { phoneNumber?: string; otp?: string };

    if (!phoneNumber || !otp) {
      res.status(400).json({
        error: 'Phone number and OTP are required',
      });
      return;
    }

    const result = await whatsAppTwilioOTP.verifyOTP(userId, phoneNumber, otp);

    if (!result.success) {
      res.status(400).json({
        error: result.error || 'Invalid OTP',
      });
      return;
    }

    res.json({
      success: true,
      message: 'WhatsApp connected successfully! 🎉',
      connected: true,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      error: 'Failed to verify OTP',
    });
  }
});

/**
 * Send WhatsApp message via Twilio
 */
router.post('/send', requireAuth, whatsappLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { phoneNumber, message } = req.body as { phoneNumber?: string; message?: string };

    if (!phoneNumber || !message) {
      res.status(400).json({
        error: 'Phone number and message are required',
      });
      return;
    }

    const result = await whatsAppTwilioOTP.sendMessage(userId, phoneNumber, message);

    if (!result.success) {
      res.status(400).json({
        error: result.error || 'Failed to send message',
      });
      return;
    }

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
    });
  }
});

export default router;
