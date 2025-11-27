import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import Twilio from 'twilio';
import { rateLimit } from 'express-rate-limit';

const router = Router();

interface WhatsAppOTPSession {
  phoneNumber: string;
  otp: string;
  expiresAt: Date;
}

interface RequestOTPBody {
  phoneNumber: string;
}

interface VerifyOTPBody {
  phoneNumber: string;
  otp: string;
}

const whatsappLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many WhatsApp OTP requests',
});

const hasTwilioCredentials = process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') && process.env.TWILIO_AUTH_TOKEN;
const twilioClient = hasTwilioCredentials ? Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
) : null;

const whatsappOTPSessions = new Map<string, WhatsAppOTPSession>();

router.post('/request-otp', requireAuth, whatsappLimiter, async (req: Request<object, object, RequestOTPBody>, res: Response): Promise<void> => {
  try {
    if (!twilioClient) {
      res.status(503).json({ error: 'WhatsApp service not configured' });
      return;
    }

    const userId = req.session?.userId;
    const { phoneNumber } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!phoneNumber || !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
      res.status(400).json({ error: 'Valid phone number required (e.g., +234801234567)' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const sessionKey = phoneNumber.replace(/\D/g, '');
    whatsappOTPSessions.set(sessionKey, {
      phoneNumber,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

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
  } catch (error) {
    console.error('WhatsApp OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', requireAuth, whatsappLimiter, async (req: Request<object, object, VerifyOTPBody>, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    const { phoneNumber, otp } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!phoneNumber || !otp) {
      res.status(400).json({ error: 'Phone number and OTP required' });
      return;
    }

    const sessionKey = phoneNumber.replace(/\D/g, '');
    const session = whatsappOTPSessions.get(sessionKey);

    if (!session) {
      res.status(400).json({ error: 'OTP request not found. Request a new code.' });
      return;
    }

    if (new Date() > session.expiresAt) {
      whatsappOTPSessions.delete(sessionKey);
      res.status(400).json({ error: 'OTP expired. Request a new code.' });
      return;
    }

    if (session.otp !== otp) {
      res.status(400).json({ error: 'Invalid OTP. Please try again.' });
      return;
    }

    await storage.updateUser(userId, {
      whatsappConnected: true,
      metadata: {
        whatsappPhoneNumber: session.phoneNumber,
        whatsappConnectedAt: new Date().toISOString(),
      },
    });

    whatsappOTPSessions.delete(sessionKey);

    res.json({
      success: true,
      message: 'WhatsApp verified successfully',
      message2: 'You can now import leads from WhatsApp',
      phoneNumber: session.phoneNumber,
    });

    console.log(`✅ WhatsApp verified for user ${userId}`);
  } catch (error) {
    console.error('WhatsApp verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.get('/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await storage.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const metadata = (user.metadata || {}) as Record<string, unknown>;

    res.json({
      success: true,
      connected: user.whatsappConnected || false,
      phoneNumber: (metadata.whatsappPhoneNumber as string) || null,
      connectedAt: (metadata.whatsappConnectedAt as string) || null,
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

router.post('/disconnect', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await storage.updateUser(userId, {
      whatsappConnected: false,
      metadata: {
        whatsappPhoneNumber: null,
        whatsappConnectedAt: null,
      },
    });

    res.json({
      success: true,
      message: 'WhatsApp disconnected',
    });
  } catch (error) {
    console.error('WhatsApp disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
