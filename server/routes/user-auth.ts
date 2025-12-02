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

router.get('/otp-configured', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    configured: twilioEmailOTP.isConfigured(),
  });
});

router.post('/signup/request-otp', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 [OTP Request] Received request to /api/user/auth/signup/request-otp');
    
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
      // Check if account setup was incomplete
      const isTemporaryUsername = existing.username && /\d{13}$/.test(existing.username);
      const onboardingProfile = await storage.getOnboardingProfile(existing.id);
      const hasCompletedOnboarding = onboardingProfile?.completed || existing.metadata?.onboardingCompleted;

      if (isTemporaryUsername || !hasCompletedOnboarding) {
        // Allow them to continue - they can login with their password to restore state
        console.log(`ℹ️ [OTP] User ${email} has incomplete account - directing to login`);
        res.status(400).json({ 
          error: 'Account exists but setup incomplete. Please login to continue setup.',
          incompleteSetup: true,
          useLogin: true
        });
        return;
      }

      console.error(`❌ [OTP] Email already registered: ${email}`);
      res.status(400).json({ error: 'Email already registered. Use login instead.' });
      return;
    }

    // Hash password and store with OTP in database (serverless-safe)
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!twilioEmailOTP.isConfigured()) {
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
      // Send OTP with password hash stored in database (not session)
      result = await twilioEmailOTP.sendSignupOTP(email, hashedPassword);
    } catch (emailError: any) {
      console.error(`❌ [OTP] Email service error:`, emailError.message);
      res.status(503).json({ 
        error: 'Email service temporarily unavailable',
        details: 'Please try again in a moment'
      });
      return;
    }

    if (!result.success) {
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

    // Verify OTP and get signup data from database (serverless-safe)
    const verifyResult = await twilioEmailOTP.verifySignupOTP(email, otp);
    if (!verifyResult.success) {
      res.status(400).json({ error: verifyResult.error });
      return;
    }

    // Get password hash from OTP record
    const passwordHash = verifyResult.passwordHash;
    if (!passwordHash) {
      console.error(`❌ [OTP Verify] Password hash missing for ${normalizedEmail}`);
      res.status(400).json({ error: 'Please start signup again. Data expired.' });
      return;
    }

    // Create temporary username (will be updated in step 3)
    const tempUsername = normalizedEmail.split('@')[0] + Date.now();

    const user = await storage.createUser({
      email: normalizedEmail,
      username: tempUsername,
      password: passwordHash,
      plan: 'trial',
      role: 'member',
    });

    // Regenerate session for newly authenticated user (prevents session fixation)
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Set session for logged-in user
    req.session.userId = user.id;
    req.session.email = normalizedEmail;
    req.session.isAdmin = false;
    if (req.session.cookie) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    }

    // Save session explicitly for serverless environments
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error after OTP verification:', err);
          reject(err);
        } else {
          console.log('✅ Session saved successfully for user:', user.id);
          resolve();
        }
      });
    });

    // Add small delay to ensure session is fully written
    await new Promise(resolve => setTimeout(resolve, 150));

    res.json({
      success: true,
      message: 'OTP verified - proceed to username',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
        role: 'member',
      },
      needsUsername: true,
      sessionExpiresIn: '7 days',
    });

    console.log(`✅ User created after OTP verification: ${normalizedEmail}`);
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

    // Regenerate session for newly authenticated user (prevents session fixation)
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    req.session.userId = user.id;
    req.session.email = email;
    req.session.isAdmin = false;
    if (req.session.cookie) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    }

    // Save session explicitly and wait for completion
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          reject(err);
        } else {
          console.log('✅ Session saved successfully for user:', user.id);
          resolve();
        }
      });
    });

    // Add small delay to ensure session is written
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if account setup is incomplete
    const isTemporaryUsername = user.username && /\d{13}$/.test(user.username); // Ends with timestamp
    const onboardingProfile = await storage.getOnboardingProfile(user.id);
    const hasCompletedOnboarding = onboardingProfile?.completed || user.metadata?.onboardingCompleted;

    let incompleteSetup = false;
    let nextStep = null;
    let suggestedUsername = null;

    if (isTemporaryUsername) {
      // User verified OTP but never set a proper username
      incompleteSetup = true;
      nextStep = 'username';
      suggestedUsername = user.email.split('@')[0];
      console.log(`🔄 User ${email} has incomplete setup - needs username`);
    } else if (!hasCompletedOnboarding) {
      // User has username but didn't complete onboarding
      incompleteSetup = true;
      nextStep = 'onboarding';
      console.log(`🔄 User ${email} has incomplete setup - needs onboarding`);
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
      incompleteSetup,
      nextStep,
      suggestedUsername,
      sessionExpiresIn: '7 days',
    });

    console.log(`✅ User logged in: ${email}${incompleteSetup ? ` (incomplete setup: ${nextStep})` : ''}`);
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
