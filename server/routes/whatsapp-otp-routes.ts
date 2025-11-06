
import { Router } from 'express';
import { whatsAppTwilioOTP } from '../lib/integrations/whatsapp-twilio-otp';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { whatsappLimiter } from '../middleware/rate-limit';

const router = Router();

/**
 * Request OTP for WhatsApp verification
 * Twilio sends the OTP via WhatsApp (branded as "Twilio")
 */
router.post('/otp/request', requireAuth, whatsappLimiter, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Phone number is required (include country code, e.g., +2348012345678)',
      });
    }

    if (!whatsAppTwilioOTP.isConfigured()) {
      return res.status(503).json({
        error: 'WhatsApp OTP is not configured. Please contact support.',
      });
    }

    const result = await whatsAppTwilioOTP.sendOTP(userId, phoneNumber);

    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to send OTP',
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your WhatsApp. Check your messages.',
      expiresIn: '10 minutes',
    });
  } catch (error: any) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({
      error: 'Failed to send OTP',
    });
  }
});

/**
 * Verify OTP and connect WhatsApp
 */
router.post('/otp/verify', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        error: 'Phone number and OTP are required',
      });
    }

    const result = await whatsAppTwilioOTP.verifyOTP(userId, phoneNumber, otp);

    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Invalid OTP',
      });
    }

    res.json({
      success: true,
      message: 'WhatsApp connected successfully! 🎉',
      connected: true,
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      error: 'Failed to verify OTP',
    });
  }
});

/**
 * Send WhatsApp message via Twilio
 */
router.post('/send', requireAuth, whatsappLimiter, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        error: 'Phone number and message are required',
      });
    }

    const result = await whatsAppTwilioOTP.sendMessage(userId, phoneNumber, message);

    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to send message',
      });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Message sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
    });
  }
});

export default router;
