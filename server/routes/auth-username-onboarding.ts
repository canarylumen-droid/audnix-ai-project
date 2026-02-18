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
router.post('/set-username', async (req: Request<object, object, SetUsernameBody>, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    const { username } = req.body;

    console.log('📝 [set-username] Request received');
    console.log('📝 [set-username] Session data:', JSON.stringify(req.session));
    console.log('📝 [set-username] User ID from session:', userId);
    console.log('📝 [set-username] Username requested:', username);

    if (!userId) {
      console.error('❌ [set-username] Session data:', JSON.stringify(req.session));
      res.status(401).json({ 
        error: 'Not authenticated',
        hint: 'Session may have expired. Please login again.',
        debug: {
          hasSession: !!req.session,
          hasCookie: !!req.session?.cookie,
        }
      });
      return;
    }

    if (!username || username.length < 3 || username.length > 30) {
      res.status(400).json({ error: 'Username must be 3-30 characters' });
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      res.status(400).json({ error: 'Only letters, numbers, hyphens and underscores allowed' });
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

    console.log(`✅ Username updated successfully for user ${userId}: ${username}`);

    res.json({
      success: true,
      message: 'Username set successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      nextStep: '/dashboard',
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
    const { userRole, source, useCase, businessSize, tags, companyName } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Update onboarding data
    const user = await storage.updateUser(userId, {
      businessName: companyName,
      metadata: {
        userRole,
        source,
        useCase,
        businessSize,
        tags,
        onboardingCompleted: true,
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
