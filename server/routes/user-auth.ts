/* @ts-nocheck */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { twilioEmailOTP } from '../lib/auth/twilio-email-otp';
import { storage } from '../storage';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many auth attempts',
});

// Temporary password storage (in-memory) - for email/password flow
const tempPasswords = new Map<string, { password: string; expiresAt: Date }>();

/**
 * GET /api/user/auth/otp-configured
 * Check if OTP is configured
 */
router.get('/otp-configured', async (req: Request, res: Response) => {
  res.json({
    configured: twilioEmailOTP.isConfigured(),
  });
});

/**
 * POST /api/user/auth/signup/request-otp
 * Step 1: User submits email + password, we send OTP
 */
router.post('/signup/request-otp', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Use login instead.' });
    }

    // Store password temporarily (15 min expiry)
    tempPasswords.set(email.toLowerCase(), {
      password: await bcrypt.hash(password, 10),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Check if OTP is configured - REQUIRED (no fallback)
    if (!twilioEmailOTP.isConfigured()) {
      tempPasswords.delete(email.toLowerCase());
      console.error(`❌ OTP FAILED: SendGrid not configured. Missing env var: TWILIO_SENDGRID_API_KEY`);
      return res.status(503).json({ 
        error: 'Email service not configured',
        details: 'Missing required SendGrid API key: TWILIO_SENDGRID_API_KEY (from SendGrid, not Twilio)',
        configured: false 
      });
    }

    // Send OTP via Twilio SendGrid (auth@audnixai.com)
    const result = await twilioEmailOTP.sendEmailOTP(email);

    if (!result.success) {
      tempPasswords.delete(email.toLowerCase());
      console.error(`❌ OTP FAILED for ${email}: ${result.error}`);
      return res.status(400).json({ 
        error: result.error || 'Failed to send OTP',
        reason: result.error 
      });
    }

    console.log(`✅ OTP sent to ${email} from auth@audnixai.com`);
    res.json({
      success: true,
      message: 'OTP sent to your email from auth@audnixai.com',
      expiresIn: '10 minutes',
    });

    console.log(`✅ OTP sent to ${email}`);
  } catch (error: any) {
    console.error('Signup OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * NOTE: skipOTP endpoint removed - OTP is MANDATORY via Twilio SendGrid
 * All signups must verify email via OTP
 */

/**
 * POST /api/user/auth/signup/verify-otp
 * Step 2: User verifies OTP, account created
 */
router.post('/signup/verify-otp', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const normalizedEmail = email.toLowerCase();

    // Get stored password
    const tempData = tempPasswords.get(normalizedEmail);
    if (!tempData) {
      return res.status(400).json({ error: 'Password not found. Please sign up again.' });
    }

    // Check if password expired
    if (new Date() > tempData.expiresAt) {
      tempPasswords.delete(normalizedEmail);
      return res.status(400).json({ error: 'Session expired. Please sign up again.' });
    }

    // Verify OTP
    const verifyResult = await twilioEmailOTP.verifyEmailOTP(email, otp);
    if (!verifyResult.success) {
      return res.status(400).json({ error: verifyResult.error });
    }

    // Generate username from email
    const username = normalizedEmail.split('@')[0] + Date.now();

    // Create user
    const user = await storage.createUser({
      email: normalizedEmail,
      username,
      password: tempData.password, // Use stored hashed password
      plan: 'trial',
      role: 'user',
    });

    // Clean up
    tempPasswords.delete(normalizedEmail);

    // Set session (7-day expiry)
    (req as any).session.userId = user.id;
    (req as any).session.email = normalizedEmail;
    (req as any).session.isAdmin = false;
    (req as any).session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
        role: 'user',
      },
      sessionExpiresIn: '7 days',
    });

    console.log(`✅ New user signed up: ${normalizedEmail}`);
  } catch (error: any) {
    console.error('Signup verification error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * POST /api/user/auth/login
 * User logs in with email + password
 */
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user
    const user = await storage.getUserByEmail(email);

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Prevent user from logging into admin account
    if (user.role === 'admin') {
      return res.status(403).json({ 
        error: 'Admin accounts use separate login',
        adminOnly: true 
      });
    }

    // Set session (7-day expiry)
    (req as any).session.userId = user.id;
    (req as any).session.email = email;
    (req as any).session.isAdmin = false;
    (req as any).session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
        role: 'user',
      },
      sessionExpiresIn: '7 days',
    });

    console.log(`✅ User logged in: ${email}`);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/user/auth/refresh-session
 * Extend session by 7 more days
 */
router.post('/refresh-session', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Extend session
    (req as any).session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    res.json({
      success: true,
      message: 'Session extended',
      sessionExpiresIn: '7 days',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

export default router;
