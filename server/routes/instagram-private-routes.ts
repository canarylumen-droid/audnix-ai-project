import { Router } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { storage } from '../storage';

const router = Router();

// OAuth flow - redirects to Instagram for permissions
router.get('/oauth/authorize', requireAuth, async (req, res) => {
  const userId = getCurrentUserId(req)!;

  const redirectUri = `${process.env.APP_URL}/api/instagram-private/oauth/callback`;
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

  const authUrl = `https://api.instagram.com/oauth/authorize?` +
    `client_id=${process.env.INSTAGRAM_APP_ID}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=user_profile,user_media&` +
    `response_type=code&` +
    `state=${state}`;

  res.json({ authUrl });
});

// OAuth callback - Instagram redirects here after user accepts
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send('Authorization denied');
    }

    const { userId } = JSON.parse(Buffer.from(state as string, 'base64').toString());

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID!,
        client_secret: process.env.INSTAGRAM_APP_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.APP_URL}/api/instagram-private/oauth/callback`,
        code: code as string,
      }),
    });

    const tokenData = await tokenResponse.json();

    await storage.updateUser(userId, {
      metadata: {
        instagram_connected: true,
        instagram_access_token: tokenData.access_token,
        instagram_user_id: tokenData.user_id,
      },
    });

    res.redirect('/dashboard/integrations?instagram=success');
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const user = await storage.getUser(userId);
    const metadata = user?.metadata as any;

    res.json({
      connected: !!metadata?.instagram_connected,
      username: metadata?.instagram_username,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;

    await storage.updateUser(userId, {
      metadata: {
        instagram_connected: false,
        instagram_access_token: null,
        instagram_user_id: null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;