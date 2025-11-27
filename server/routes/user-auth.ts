import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { twilioEmailOTP } from '../lib/auth/twilio-email-otp';
import { storage } from '../storage';
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
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const existing = await storage.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'Email already registered. Use login instead.' });
      return;
    }

    tempPasswords.set(email.toLowerCase(), {
      password: await bcrypt.hash(password, 10),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    if (!twilioEmailOTP.isConfigured()) {
      tempPasswords.delete(email.toLowerCase());
      console.error(`❌ OTP FAILED: SendGrid not configured. Missing env var: TWILIO_SENDGRID_API_KEY`);
      res.status(503).json({ 
        error: 'Email service not configured',
        details: 'Missing required SendGrid API key: TWILIO_SENDGRID_API_KEY (from SendGrid, not Twilio)',
        configured: false 
      });
      return;
    }

    const result = await twilioEmailOTP.sendEmailOTP(email);

    if (!result.success) {
      tempPasswords.delete(email.toLowerCase());
      console.error(`❌ OTP FAILED for ${email}: ${result.error}`);
      res.status(400).json({ 
        error: result.error || 'Failed to send OTP',
        reason: result.error 
      });
      return;
    }

    console.log(`✅ OTP sent to ${email} from auth@audnixai.com`);
    res.json({
      success: true,
      message: 'OTP sent to your email from auth@audnixai.com',
      expiresIn: '10 minutes',
    });

    console.log(`✅ OTP sent to ${email}`);
  } catch (error: unknown) {
    console.error('Signup OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
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
