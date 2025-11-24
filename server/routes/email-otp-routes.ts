/* @ts-nocheck */
import { Router, Request, Response } from 'express';
import { twilioEmailOTP } from '../lib/auth/twilio-email-otp';
import { storage } from '../storage';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many OTP requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/email-otp/request
 * Request OTP for email
 */
router.post('/email-otp/request', otpLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Debug: Log env vars loaded
    const hasAccountSid = !!process.env.TWILIO_ACCOUNT_SID;
    const hasAuthToken = !!process.env.TWILIO_AUTH_TOKEN;
    const hasSendgridKey = !!process.env.TWILIO_SENDGRID_API_KEY;
    const emailFrom = process.env.TWILIO_EMAIL_FROM || 'auth@audnixai.com';
    
    console.log(`📧 OTP Request for: ${email}`);
    console.log(`🔐 Twilio Config - AccountSID: ${hasAccountSid}, AuthToken: ${hasAuthToken}, SendGrid: ${hasSendgridKey}`);
    console.log(`📬 Email From: ${emailFrom}`);

    if (!twilioEmailOTP.isConfigured()) {
      console.error('❌ OTP Service Not Configured');
      return res.status(503).json({ error: 'Email OTP service not configured' });
    }

    const result = await twilioEmailOTP.sendEmailOTP(email);

    if (!result.success) {
      console.error(`❌ OTP Send Failed: ${result.error}`);
      return res.status(400).json({ error: result.error || 'Failed to send OTP' });
    }

    console.log(`✅ OTP Sent Successfully to ${email}`);
    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresIn: '10 minutes',
    });
  } catch (error: any) {
    console.error('Error requesting email OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * POST /api/auth/email-otp/verify
 * Verify OTP and login
 */
router.post('/email-otp/verify', otpLimiter, async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const verifyResult = await twilioEmailOTP.verifyEmailOTP(email, otp);

    if (!verifyResult.success) {
      return res.status(400).json({ error: verifyResult.error });
    }

    // Check if user exists
    let user = await storage.getUserByEmail(email);

    // Create user if doesn't exist (signup)
    if (!user) {
      user = await storage.createUser({
        email,
        username: email.split('@')[0],
        plan: 'trial',
      });
    }

    // Set session
    (req as any).session.userId = user.id;
    (req as any).session.email = email;

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
      },
    });
  } catch (error: any) {
    console.error('Error verifying email OTP:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/auth/email-otp/resend
 * Resend OTP
 */
router.post('/email-otp/resend', otpLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const result = await twilioEmailOTP.resendEmailOTP(email);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'New OTP sent to your email',
    });
  } catch (error: any) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

export default router;
