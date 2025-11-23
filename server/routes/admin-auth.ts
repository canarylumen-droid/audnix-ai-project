/* @ts-nocheck */
import { Router, Request, Response } from 'express';
import { twilioEmailOTP } from '../lib/auth/twilio-email-otp';
import { storage } from '../storage';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Get whitelist from env
const ADMIN_WHITELIST = (process.env.ADMIN_WHITELIST_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

console.log(`✅ Admin whitelist loaded: ${ADMIN_WHITELIST.length} emails`);

// Track failed login attempts in memory (per IP + email)
const failedAttempts = new Map<string, { count: number; blocked: boolean; blockedUntil: number }>();

const getAttemptsKey = (email: string, ip: string) => `${email}:${ip}`;

function checkBlocked(email: string, ip: string): { blocked: boolean; reason?: string } {
  const key = getAttemptsKey(email, ip);
  const record = failedAttempts.get(key);

  if (!record) return { blocked: false };

  // Permanent block for non-whitelisted emails (device ban)
  if (record.blocked) {
    return { 
      blocked: true, 
      reason: `Access permanently blocked. Device banned after 2 failed attempts. Contact support.` 
    };
  }

  return { blocked: false };
}

function recordFailedAttempt(email: string, ip: string) {
  const key = getAttemptsKey(email, ip);
  const record = failedAttempts.get(key) || { count: 0, blocked: false, blockedUntil: 0 };

  record.count += 1;
  console.warn(`[SECURITY] Admin login attempt ${record.count} for ${email} from ${ip}`);

  if (record.count >= 2) {
    record.blocked = true;
    record.blockedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000; // 1 WEEK permanent block
    console.warn(`[SECURITY] Admin login PERMANENTLY BLOCKED (device ban) for ${email} from ${ip} for 1 week`);
  }

  failedAttempts.set(key, record);
}

/**
 * POST /api/admin/auth/check-email
 * Check if email is whitelisted for admin access
 */
router.post('/auth/check-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if device/IP is permanently blocked
    const blocked = checkBlocked(normalizedEmail, ip);
    if (blocked.blocked) {
      console.warn(`[SECURITY] Blocked device attempted access: ${normalizedEmail} from ${ip}`);
      return res.status(403).json({ 
        error: 'Access permanently denied',
        reason: blocked.reason,
        blocked: true,
        permanent: true
      });
    }

    // Check if whitelisted
    const isWhitelisted = ADMIN_WHITELIST.includes(normalizedEmail);

    if (!isWhitelisted) {
      recordFailedAttempt(normalizedEmail, ip);
      const record = failedAttempts.get(getAttemptsKey(normalizedEmail, ip));
      return res.status(403).json({ 
        error: 'Not authorized for admin access',
        isWhitelisted: false,
        attempts: record?.count || 0,
        attemptsRemaining: 2 - (record?.count || 0)
      });
    }

    // Whitelisted - proceed with OTP
    res.json({
      success: true,
      isWhitelisted: true,
      message: 'Email whitelisted for admin access'
    });

  } catch (error: any) {
    console.error('Admin email check error:', error);
    res.status(500).json({ error: 'Failed to check email' });
  }
});

/**
 * POST /api/admin/auth/request-otp
 * Send OTP to whitelisted admin email
 */
router.post('/auth/request-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if device/IP is permanently blocked
    const blocked = checkBlocked(normalizedEmail, ip);
    if (blocked.blocked) {
      console.warn(`[SECURITY] Blocked device attempted OTP request: ${normalizedEmail} from ${ip}`);
      return res.status(403).json({ 
        error: 'Access permanently denied',
        reason: blocked.reason,
        blocked: true,
        permanent: true
      });
    }

    // Check whitelist
    if (!ADMIN_WHITELIST.includes(normalizedEmail)) {
      recordFailedAttempt(normalizedEmail, ip);
      const record = failedAttempts.get(getAttemptsKey(normalizedEmail, ip));
      return res.status(403).json({ 
        error: 'Email not authorized for admin access',
        isWhitelisted: false,
        attempts: record?.count || 0,
        attemptsRemaining: 2 - (record?.count || 0)
      });
    }

    if (!twilioEmailOTP.isConfigured()) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const result = await twilioEmailOTP.sendEmailOTP(normalizedEmail);

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to send OTP' });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresIn: '10 minutes',
    });

    console.log(`✅ Admin OTP sent to ${normalizedEmail}`);

  } catch (error: any) {
    console.error('Admin OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * POST /api/admin/auth/verify-otp
 * Verify OTP and create/login admin
 */
router.post('/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if device/IP is permanently blocked
    const blocked = checkBlocked(normalizedEmail, ip);
    if (blocked.blocked) {
      console.warn(`[SECURITY] Blocked device attempted verify: ${normalizedEmail} from ${ip}`);
      return res.status(403).json({ 
        error: 'Access permanently denied',
        reason: blocked.reason,
        blocked: true,
        permanent: true
      });
    }

    // Check whitelist
    if (!ADMIN_WHITELIST.includes(normalizedEmail)) {
      recordFailedAttempt(normalizedEmail, ip);
      const record = failedAttempts.get(getAttemptsKey(normalizedEmail, ip));
      return res.status(403).json({ 
        error: 'Email not authorized for admin access',
        isWhitelisted: false,
        attempts: record?.count || 0,
        attemptsRemaining: 2 - (record?.count || 0)
      });
    }

    // Verify OTP
    const verifyResult = await twilioEmailOTP.verifyEmailOTP(normalizedEmail, otp);
    if (!verifyResult.success) {
      return res.status(400).json({ error: verifyResult.error });
    }

    // Get or create admin user
    let user = await storage.getUserByEmail(normalizedEmail);
    
    if (!user) {
      // Create admin user (no password needed, OTP-only)
      user = await storage.createUser({
        email: normalizedEmail,
        username: normalizedEmail.split('@')[0],
        password: null, // No password for OTP-only admin
        plan: 'admin',
        role: 'admin',
      });
      console.log(`✅ New admin user created: ${normalizedEmail}`);
    } else if (user.role !== 'admin') {
      // Promote existing user to admin
      await storage.updateUser(user.id, { role: 'admin' });
      user.role = 'admin';
      console.log(`✅ User promoted to admin: ${normalizedEmail}`);
    }

    // Set session (no expiry for admin - stays logged in)
    (req as any).session.userId = user.id;
    (req as any).session.email = normalizedEmail;
    (req as any).session.isAdmin = true;
    (req as any).session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Clear failed attempts on successful login
    failedAttempts.delete(getAttemptsKey(normalizedEmail, ip));

    res.json({
      success: true,
      message: 'Admin logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: 'admin',
      },
      sessionExpiresIn: '30 days',
    });

    console.log(`✅ Admin logged in: ${normalizedEmail}`);

  } catch (error: any) {
    console.error('Admin OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

/**
 * GET /api/admin/auth/status
 * Check if current user is admin
 */
router.get('/auth/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const isAdmin = (req as any).session?.isAdmin;

    if (!userId) {
      return res.json({ authenticated: false, isAdmin: false });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.json({ authenticated: false, isAdmin: false });
    }

    res.json({
      authenticated: true,
      isAdmin: user.role === 'admin',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error: any) {
    res.json({ authenticated: false, isAdmin: false });
  }
});

export default router;
