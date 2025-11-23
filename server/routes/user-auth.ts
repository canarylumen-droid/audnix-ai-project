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

/**
 * POST /api/user/auth/signup/request-otp
 * Step 1: User requests OTP for signup (ANYONE can signup)
 */
router.post('/signup/request-otp', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Check if user already exists
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Use login instead.' });
    }

    if (!twilioEmailOTP.isConfigured()) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const result = await twilioEmailOTP.sendEmailOTP(email);

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to send OTP' });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresIn: '10 minutes',
    });
  } catch (error: any) {
    console.error('Signup OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * POST /api/user/auth/signup/verify-otp
 * Step 2: User verifies OTP and sets password
 */
router.post('/signup/verify-otp', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, otp, password, username } = req.body;

    if (!email || !otp || !password || !username) {
      return res.status(400).json({ error: 'Email, OTP, password, and username required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    // Verify OTP
    const verifyResult = await twilioEmailOTP.verifyEmailOTP(email, otp);
    if (!verifyResult.success) {
      return res.status(400).json({ error: verifyResult.error });
    }

    // Check username availability
    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await storage.createUser({
      email,
      username,
      password: hashedPassword,
      plan: 'trial',
      role: 'user',
    });

    // Set session (7-day expiry)
    (req as any).session.userId = user.id;
    (req as any).session.email = email;
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

    console.log(`✅ New user signed up: ${email}`);
  } catch (error: any) {
    console.error('Signup verification error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * POST /api/user/auth/login
 * User logs in with email + password
 * Session lasts 7 days
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
