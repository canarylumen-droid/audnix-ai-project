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

router.post('/signup/request-otp', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    const existing = await storage.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'Email already registered. Use login instead.' });
      return;
    }

    if (!twilioEmailOTP.isConfigured()) {
      res.status(503).json({ error: 'Email service not configured' });
      return;
    }

    const result = await twilioEmailOTP.sendEmailOTP(email);

    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to send OTP' });
      return;
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresIn: '10 minutes',
    });
  } catch (error: unknown) {
    console.error('Signup OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

interface SignupVerifyBody {
  email?: string;
  otp?: string;
  password?: string;
  username?: string;
}

router.post('/signup/verify-otp', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, password, username } = req.body as SignupVerifyBody;

    if (!email || !otp || !password || !username) {
      res.status(400).json({ error: 'Email, OTP, password, and username required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }

    const verifyResult = await twilioEmailOTP.verifyEmailOTP(email, otp);
    if (!verifyResult.success) {
      res.status(400).json({ error: verifyResult.error });
      return;
    }

    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      res.status(400).json({ error: 'Username already taken' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await storage.createUser({
      email,
      username,
      password: hashedPassword,
      plan: 'trial',
    });

    req.session.userId = user.id;
    req.session.email = email;
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;

    res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
      },
      sessionExpiresIn: '7 days',
    });

    console.log(`✅ New user signed up: ${email}`);
  } catch (error: unknown) {
    console.error('Signup verification error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

interface LoginBody {
  email?: string;
  password?: string;
}

router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginBody;

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

    req.session.userId = user.id;
    req.session.email = email;
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
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

    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;

    res.json({
      success: true,
      message: 'Session extended',
      sessionExpiresIn: '7 days',
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

router.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err: Error | undefined) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
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

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
