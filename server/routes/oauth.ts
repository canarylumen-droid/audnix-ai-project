import { Request, Response, Router } from 'express';
import { InstagramOAuth } from '../lib/oauth/instagram';
import { supabaseAdmin } from '../lib/supabase-admin';

const router = Router();
const instagramOAuth = new InstagramOAuth();

/**
 * Initialize OAuth flow for Instagram
 */
router.get('/connect/instagram', async (req: Request, res: Response) => {
  try {
    // Get user ID from session or query params
    const userId = (req as any).session?.userId || req.query.user_id as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Generate OAuth URL
    const authUrl = instagramOAuth.getAuthorizationUrl(userId);
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Instagram OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

/**
 * Handle OAuth callback from Instagram
 */
router.get('/oauth/instagram/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error_reason } = req.query;

    // Handle user denial
    if (error_reason === 'user_denied') {
      return res.redirect('/dashboard/integrations?error=denied');
    }

    if (!code || !state) {
      return res.redirect('/dashboard/integrations?error=invalid_request');
    }

    // Verify state parameter
    const stateData = instagramOAuth.verifyState(state as string);
    if (!stateData) {
      return res.redirect('/dashboard/integrations?error=invalid_state');
    }

    // Exchange code for token
    const tokenData = await instagramOAuth.exchangeCodeForToken(code as string);
    
    // Exchange for long-lived token
    const longLivedToken = await instagramOAuth.exchangeForLongLivedToken(tokenData.access_token);
    
    // Get user profile
    const profile = await instagramOAuth.getUserProfile(longLivedToken.access_token);
    
    // Save token and update user
    await instagramOAuth.saveToken(stateData.userId, {
      access_token: longLivedToken.access_token,
      user_id: profile.id,
      permissions: ['instagram_basic', 'instagram_manage_messages']
    }, longLivedToken.expires_in);

    // Update user with Instagram profile info
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('users')
        .update({
          instagram_username: profile.username
        })
        .eq('id', stateData.userId);

      // Create integration record
      await supabaseAdmin
        .from('integrations')
        .upsert({
        user_id: stateData.userId,
        provider: 'instagram',
        account_type: profile.username,
        credentials: { username: profile.username },
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });

    res.redirect('/dashboard/integrations?success=instagram_connected');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/dashboard/integrations?error=oauth_failed');
  }
});

/**
 * Disconnect Instagram
 */
router.post('/oauth/instagram/disconnect', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.body.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await instagramOAuth.revokeToken(userId);
    
    // Update integration status
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('integrations')
        .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'instagram');

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Instagram:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * Check token status
 */
router.get('/oauth/instagram/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const token = await instagramOAuth.getValidToken(userId);
    
    if (token) {
      // Try to get profile to verify token is working
      try {
        const profile = await instagramOAuth.getUserProfile(token);
        res.json({ 
          connected: true, 
          username: profile.username,
          userId: profile.id 
        });
      } catch (error) {
        res.json({ connected: false, error: 'Token expired or invalid' });
      }
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Error checking Instagram status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;