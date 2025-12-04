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

    // Set session for logged-in user FIRST (before regenerate to preserve data)
    const sessionData = {
      userId: user.id,
      email: normalizedEmail,
      isAdmin: false,
    };
    
    console.log(`📝 [OTP Verify] Setting session data:`, JSON.stringify(sessionData));

    // Regenerate session ID for security (prevents session fixation)
    await new Promise<void>((resolve, reject) => {
      const oldSessionId = req.sessionID;
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regenerate error:', err);
          reject(err);
        } else {
          console.log(`✅ Session regenerated: ${oldSessionId.slice(0,8)}... -> ${req.sessionID.slice(0,8)}...`);
          resolve();
        }
      });
    });

    // Re-apply session data after regeneration
    req.session.userId = user.id;
    req.session.email = normalizedEmail;
    req.session.isAdmin = false;
    if (req.session.cookie) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    // Save session explicitly for serverless environments
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error after OTP verification:', err);
          reject(err);
        } else {
          console.log('✅ Session saved successfully for user:', user.id);
          console.log('📝 [OTP Verify] Session after save:', JSON.stringify({
            userId: req.session.userId,
            email: req.session.email,
            sessionID: req.sessionID.slice(0, 8) + '...',
          }));
          resolve();
        }
      });
    });

    // Add small delay to ensure session is fully written to PostgreSQL
    await new Promise(resolve => setTimeout(resolve, 200));

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
      sessionExpiresIn: '30 days',
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

    // Regenerate session ID for security (prevents session fixation)
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regenerate error:', err);
          reject(err);
        } else {
          console.log('✅ Session regenerated for login');
          resolve();
        }
      });
    });

    // Set session data after regeneration
    req.session.userId = user.id;
    req.session.email = email;
    req.session.isAdmin = false;
    if (req.session.cookie) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    // Save session explicitly and wait for completion
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          reject(err);
        } else {
          console.log('✅ Session saved successfully for user:', user.id);
          console.log('📝 [Login] Session data:', JSON.stringify({
            userId: req.session.userId,
            email: req.session.email,
            sessionID: req.sessionID.slice(0, 8) + '...',
          }));
          resolve();
        }
      });
    });

    // Add small delay to ensure session is written to PostgreSQL
    await new Promise(resolve => setTimeout(resolve, 150));

    // Check if account setup is incomplete and restore state
    const isTemporaryUsername = user.username && /\d{13}$/.test(user.username); // Ends with timestamp
    const onboardingProfile = await storage.getOnboardingProfile(user.id);
    const hasCompletedOnboarding = onboardingProfile?.completed || user.metadata?.onboardingCompleted;

    let incompleteSetup = false;
    let nextStep = null;
    let suggestedUsername = null;
    let restoreState = null;

    if (isTemporaryUsername) {
      // User verified OTP but never set a proper username
      incompleteSetup = true;
      nextStep = 'username';
      suggestedUsername = user.email.split('@')[0];
      restoreState = {
        step: 3,
        email: user.email,
        message: 'Continue your signup by choosing a username'
      };
      console.log(`🔄 User ${email} has incomplete setup - restoring to username step`);
    } else if (!hasCompletedOnboarding) {
      // User has username but didn't complete onboarding
      incompleteSetup = true;
      nextStep = 'onboarding';
      restoreState = {
        step: 'onboarding',
        username: user.username,
        email: user.email,
        message: 'Complete your profile setup to get started'
      };
      console.log(`🔄 User ${email} has incomplete setup - restoring to onboarding step`);
    }

    res.json({
      success: true,
      message: incompleteSetup ? 'Account found - continue setup' : 'Logged in successfully',
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
      restoreState,
      sessionExpiresIn: '30 days',
    });

    console.log(`✅ User logged in: ${email}${incompleteSetup ? ` (restoring to: ${nextStep})` : ''}`);
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

router.get('/check-state', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      res.json({ authenticated: false });
      return;
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      res.json({ authenticated: false });
      return;
    }

    // Check account completion state
    const isTemporaryUsername = user.username && /\d{13}$/.test(user.username);
    const onboardingProfile = await storage.getOnboardingProfile(user.id);
    const hasCompletedOnboarding = onboardingProfile?.completed || user.metadata?.onboardingCompleted;

    let incompleteSetup = false;
    let nextStep = null;
    let suggestedUsername = null;
    let restoreState = null;

    if (isTemporaryUsername) {
      incompleteSetup = true;
      nextStep = 'username';
      suggestedUsername = user.email.split('@')[0];
      restoreState = {
        step: 3,
        email: user.email,
        message: 'Continue your signup by choosing a username'
      };
    } else if (!hasCompletedOnboarding) {
      incompleteSetup = true;
      nextStep = 'onboarding';
      restoreState = {
        step: 'onboarding',
        username: user.username,
        email: user.email,
        message: 'Complete your profile setup to get started'
      };
    }

    res.json({
      authenticated: true,
      incompleteSetup,
      nextStep,
      suggestedUsername,
      restoreState,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error: unknown) {
    console.error('Check state error:', error);
    res.status(500).json({ error: 'Failed to check state' });
  }
});

/**
 * POST /api/user/auth/reset-account
 * For users stuck in limbo state - allows them to clear their account and start fresh
 * This preserves their email but resets username and onboarding status
 */
router.post('/reset-account', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({ error: 'Email required' });
      return;
    }

    const user = await storage.getUserByEmail(email);

    if (!user) {
      // User doesn't exist - that's fine, they can sign up fresh
      res.json({
        success: true,
        message: 'Account not found - you can sign up fresh',
        action: 'signup',
      });
      return;
    }

    // Reset user to initial state
    const tempUsername = email.split('@')[0] + Date.now();
    
    await storage.updateUser(user.id, {
      username: tempUsername,
      metadata: {
        onboardingCompleted: false,
        resetAt: new Date().toISOString(),
      },
    });

    // Clear any existing onboarding profile
    const onboardingProfile = await storage.getOnboardingProfile(user.id);
    if (onboardingProfile) {
      await storage.updateOnboardingProfile(user.id, {
        ...onboardingProfile,
        completed: false,
      });
    }

    // Destroy any existing sessions for this user
    req.session.destroy(() => {});

    console.log(`🔄 User account reset for: ${email}`);

    res.json({
      success: true,
      message: 'Account reset. Please login with your email and password to continue.',
      action: 'login',
    });
  } catch (error: unknown) {
    console.error('Reset account error:', error);
    res.status(500).json({ error: 'Failed to reset account' });
  }
});

/**
 * POST /api/user/auth/logout
 * Logout user and destroy session
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });

    res.clearCookie('audnix.sid', {
      domain: process.env.NODE_ENV === 'production' ? '.audnixai.com' : undefined,
      path: '/',
    });

    console.log(`👋 User logged out: ${userId || 'unknown'}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: unknown) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
