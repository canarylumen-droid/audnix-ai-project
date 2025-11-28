import { Router } from 'express';
import type { Request, Response } from 'express';
import { storage } from '../storage.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

interface SetUsernameBody {
  username: string;
}

interface CompleteOnboardingBody {
  companyName?: string;
  businessDescription?: string;
  industry?: string;
}

/**
 * POST /api/auth/set-username
 * After OTP verified → User selects username → Saved to DB
 */
router.post('/set-username', requireAuth, async (req: Request<object, object, SetUsernameBody>, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    const { username } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!username || username.length < 3 || username.length > 30) {
      res.status(400).json({ error: 'Username must be 3-30 characters' });
      return;
    }

    // Check if username taken
    const existing = await storage.getUserByUsername(username);
    if (existing && existing.id !== userId) {
      res.status(400).json({ error: 'Username already taken' });
      return;
    }

    // Update user
    const user = await storage.updateUser(userId, { username });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Username set successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      nextStep: '/onboarding',
    });
  } catch (error: unknown) {
    console.error('Error setting username:', error);
    res.status(500).json({ error: 'Failed to set username' });
  }
});

/**
 * POST /api/auth/complete-onboarding
 * After onboarding → User goes to dashboard
 */
router.post('/complete-onboarding', requireAuth, async (req: Request<object, object, CompleteOnboardingBody>, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    const { companyName, businessDescription, industry } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
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

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Onboarding complete',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        businessName: user.businessName,
      },
      nextStep: '/dashboard',
    });
  } catch (error: unknown) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

/**
 * GET /api/auth/me
 * Get current user (for dashboard)
 */
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
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
        businessName: user.businessName,
        plan: user.plan,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
