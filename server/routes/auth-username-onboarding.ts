/* @ts-nocheck */
import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/set-username
 * After OTP verified → User selects username → Saved to DB
 */
router.post('/set-username', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const { username } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!username || username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 characters' });
    }

    // Check if username taken
    const existing = await storage.getUserByUsername(username);
    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Update user
    const user = await storage.updateUser(userId, { username });

    res.json({
      success: true,
      message: 'Username set successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      nextStep: '/onboarding', // Redirect to onboarding
    });
  } catch (error: any) {
    console.error('Error setting username:', error);
    res.status(500).json({ error: 'Failed to set username' });
  }
});

/**
 * POST /api/auth/complete-onboarding
 * After onboarding → User goes to dashboard
 */
router.post('/complete-onboarding', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const { companyName, businessDescription, industry } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Update onboarding data
    const user = await storage.updateUser(userId, {
      businessName: companyName,
      metadata: {
        businessDescription,
        industry,
        onboardedAt: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      message: 'Onboarding complete',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        businessName: user.businessName,
      },
      nextStep: '/dashboard', // Redirect to dashboard
    });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

/**
 * GET /api/auth/me
 * Get current user (for dashboard)
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        businessName: user.businessName,
        plan: user.plan,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
