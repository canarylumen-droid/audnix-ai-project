/* @ts-nocheck */
import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import Twilio from 'twilio';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting
const whatsappLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many WhatsApp OTP requests',
});

// Only initialize Twilio if credentials are valid
const hasTwilioCredentials = process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') && process.env.TWILIO_AUTH_TOKEN;
const twilioClient = hasTwilioCredentials ? Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
) : null;

// Store WhatsApp OTP sessions
const whatsappOTPSessions = new Map<string, { phoneNumber: string; otp: string; expiresAt: Date }>();

/**
 * POST /api/whatsapp-connect/request-otp
 * User enters phone number to connect WhatsApp
 * Twilio sends OTP via WhatsApp
 */
router.post('/request-otp', requireAuth, whatsappLimiter, async (req: Request, res: Response) => {
  try {
    if (!twilioClient) {
      return res.status(503).json({ error: 'WhatsApp service not configured' });
    }

    const userId = (req as any).session?.userId;
    const { phoneNumber } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!phoneNumber || !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Valid phone number required (e.g., +234801234567)' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP session
    const sessionKey = phoneNumber.replace(/\D/g, '');
    whatsappOTPSessions.set(sessionKey, {
      phoneNumber,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Format for WhatsApp
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Send via Twilio WhatsApp
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`,
      body: `🔐 *Audnix AI - WhatsApp Connection*\n\nYour verification code is: *${otp}*\n\nThis code expires in 10 minutes.\n\nNever share this code with anyone.`,
    });

    res.json({
      success: true,
      message: 'OTP sent via WhatsApp',
      expiresIn: '10 minutes',
    });

    console.log(`✅ WhatsApp OTP sent to ${formattedNumber}`);
  } catch (error: any) {
    console.error('WhatsApp OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * POST /api/whatsapp-connect/verify-otp
 * User enters OTP to verify WhatsApp connection
 * After verification, they can import WhatsApp leads
 */
router.post('/verify-otp', requireAuth, whatsappLimiter, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const { phoneNumber, otp } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP required' });
    }

    const sessionKey = phoneNumber.replace(/\D/g, '');
    const session = whatsappOTPSessions.get(sessionKey);

    if (!session) {
      return res.status(400).json({ error: 'OTP request not found. Request a new code.' });
    }

    if (new Date() > session.expiresAt) {
      whatsappOTPSessions.delete(sessionKey);
      return res.status(400).json({ error: 'OTP expired. Request a new code.' });
    }

    if (session.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // OTP verified - save WhatsApp connection for user
    await storage.updateUser(userId, {
      whatsappPhoneNumber: session.phoneNumber,
      whatsappConnected: true,
      whatsappConnectedAt: new Date().toISOString(),
    });

    whatsappOTPSessions.delete(sessionKey);

    res.json({
      success: true,
      message: 'WhatsApp verified successfully',
      message2: 'You can now import leads from WhatsApp',
      phoneNumber: session.phoneNumber,
    });

    console.log(`✅ WhatsApp verified for user ${userId}`);
  } catch (error: any) {
    console.error('WhatsApp verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * GET /api/whatsapp-connect/status
 * Check if WhatsApp is connected
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUserById(userId);

    res.json({
      success: true,
      connected: user.whatsappConnected || false,
      phoneNumber: user.whatsappPhoneNumber || null,
      connectedAt: user.whatsappConnectedAt || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

/**
 * POST /api/whatsapp-connect/disconnect
 * Disconnect WhatsApp
 */
router.post('/disconnect', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await storage.updateUser(userId, {
      whatsappConnected: false,
      whatsappPhoneNumber: null,
    });

    res.json({
      success: true,
      message: 'WhatsApp disconnected',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
