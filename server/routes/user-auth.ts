import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { twilioEmailOTP } from '../lib/auth/twilio-email-otp.js';
import { storage } from '../storage.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many auth attempts',
});

const tempPasswords = new Map<string, { password: string; expiresAt: Date }>();

router.get('/otp-configured', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    configured: twilioEmailOTP.isConfigured(),
  });
});

router.post('/signup/request-otp', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 [OTP Request] Received request to /api/user/auth/signup/request-otp');
    console.log('🔍 [OTP Request] Origin:', req.get('origin'));
    console.log('🔍 [OTP Request] Headers:', {
      'content-type': req.get('content-type'),
      'user-agent': req.get('user-agent'),
      'referer': req.get('referer')
    });
    
    const { email, password } = req.body as { email?: string; password?: string };
    console.log('🔍 [OTP Request] Body - Email:', email ? '✓' : '✗', 'Password:', password ? '✓' : '✗');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('❌ [OTP] Invalid email format');
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    if (!password || password.length < 8) {
      console.error('❌ [OTP] Weak password');
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check for existing user with better error handling
    let existing;
    try {
      existing = await storage.getUserByEmail(email);
    } catch (dbError: any) {
      console.error('❌ [OTP] Database error checking existing user:', dbError.message);
      res.status(503).json({ 
        error: 'Database temporarily unavailable',
        details: 'Please try again in a moment'
      });
      return;
    }
    
    if (existing) {
      console.error(`❌ [OTP] Email already registered: ${email}`);
      res.status(400).json({ error: 'Email already registered. Use login instead.' });
      return;
    }

    tempPasswords.set(email.toLowerCase(), {
      password: await bcrypt.hash(password, 10),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    if (!twilioEmailOTP.isConfigured()) {
      tempPasswords.delete(email.toLowerCase());
      console.error(`❌ [OTP] SendGrid NOT configured. Missing: TWILIO_SENDGRID_API_KEY`);
      res.status(503).json({ 
        error: 'Email service not configured',
        details: 'Missing required SendGrid API key: TWILIO_SENDGRID_API_KEY (from SendGrid, not Twilio)',
        configured: false 
      });
      return;
    }

    console.log(`📧 [OTP] Sending to: ${email}`);
    let result;
    try {
      result = await twilioEmailOTP.sendEmailOTP(email);
    } catch (emailError: any) {
      tempPasswords.delete(email.toLowerCase());
      console.error(`❌ [OTP] Email service error:`, emailError.message);
      res.status(503).json({ 
        error: 'Email service temporarily unavailable',
        details: 'Please try again in a moment'
      });
      return;
    }

    if (!result.success) {
      tempPasswords.delete(email.toLowerCase());
      console.error(`❌ [OTP FAILED] ${email} - Error: ${result.error}`);
      res.status(400).json({ 
        error: result.error || 'Failed to send OTP',
        reason: result.error 
      });
      return;
    }

    console.log(`✅ [OTP SUCCESS] OTP sent to ${email}`);
    res.json({
      success: true,
      message: 'OTP sent to your email from auth@audnixai.com',
      expiresIn: '10 minutes',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('🚨 [OTP CRASH]', errorMessage, error);
    res.status(500).json({ 
      error: 'A server error occurred',
      details: 'Please try again later'
    });
  }
});

router.post('/signup/verify-otp', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body as { email?: string; otp?: string };

    if (!email || !otp) {
      res.status(400).json({ error: 'Email and OTP required' });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    const tempData = tempPasswords.get(normalizedEmail);
    if (!tempData) {
      res.status(400).json({ error: 'Password not found. Please sign up again.' });
      return;
    }

    if (new Date() > tempData.expiresAt) {
      tempPasswords.delete(normalizedEmail);
      res.status(400).json({ error: 'Session expired. Please sign up again.' });
      return;
    }

    const verifyResult = await twilioEmailOTP.verifyEmailOTP(email, otp);
    if (!verifyResult.success) {
      res.status(400).json({ error: verifyResult.error });
      return;
    }

    const username = normalizedEmail.split('@')[0] + Date.now();

    const user = await storage.createUser({
      email: normalizedEmail,
      username,
      password: tempData.password,
      plan: 'trial',
      role: 'member',
    });

    tempPasswords.delete(normalizedEmail);

    req.session.userId = user.id;
    req.session.email = normalizedEmail;
    req.session.isAdmin = false;
    if (req.session.cookie) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    }

    res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
        role: 'member',
      },
      sessionExpiresIn: '7 days',
    });

    console.log(`✅ New user signed up: ${normalizedEmail}`);
  } catch (error: unknown) {
    console.error('Signup verification error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const user = await storage.getUserByEmail(email);

    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.role === 'admin') {
      res.status(403).json({ 
        error: 'Admin accounts use separate login',
        adminOnly: true 
      });
      return;
    }

    req.session.userId = user.id;
    req.session.email = email;
    req.session.isAdmin = false;
    if (req.session.cookie) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    }

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
        role: 'member',
      },
      sessionExpiresIn: '7 days',
    });

    console.log(`✅ User logged in: ${email}`);
  } catch (error: unknown) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh-session', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (req.session.cookie) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    }

    res.json({
      success: true,
      message: 'Session extended',
      sessionExpiresIn: '7 days',
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

export default router;
