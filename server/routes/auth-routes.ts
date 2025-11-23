import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';
import { getCurrentUserId, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * Sign up - Create new user with email and password
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const newUser = await db.insert(users).values({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      username: email.split('@')[0],
      plan: 'trial',
      trialExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    }).returning();

    if (!newUser || newUser.length === 0) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    const user = newUser[0];

    // Set session
    (req as any).session.userId = user.id;
    (req as any).session.email = user.email;

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
      message: 'Signed up successfully',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * Sign in - Authenticate with email and password
 */
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const foundUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!foundUsers || foundUsers.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = foundUsers[0];

    // Verify password
    if (!user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcryptjs.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

    // Set session
    (req as any).session.userId = user.id;
    (req as any).session.email = user.email;

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
      message: 'Signed in successfully',
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Signin failed' });
  }
});

/**
 * Get current user profile
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const foundUsers = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!foundUsers || foundUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = foundUsers[0];
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        plan: user.plan,
        trialExpiresAt: user.trialExpiresAt,
      },
    });
  } catch (error: any) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Logout - Destroy session
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

export default router;
