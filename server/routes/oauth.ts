import { Request, Response, Router } from 'express';
import { InstagramOAuth } from '../lib/oauth/instagram';
import { WhatsAppOAuth } from '../lib/oauth/whatsapp';
import { GmailOAuth } from '../lib/oauth/gmail';
import { OutlookOAuth } from '../lib/oauth/outlook';
import { supabaseAdmin } from '../lib/supabase-admin';

const router = Router();
const instagramOAuth = new InstagramOAuth();
const whatsappOAuth = new WhatsAppOAuth();
const gmailOAuth = new GmailOAuth();
const outlookOAuth = new OutlookOAuth();

// ==================== INSTAGRAM OAUTH ====================

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
    }

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
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Instagram:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * Check Instagram token status
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

// ==================== WHATSAPP OAUTH ====================

/**
 * Initialize OAuth flow for WhatsApp
 */
router.get('/connect/whatsapp', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const authUrl = whatsappOAuth.getAuthorizationUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating WhatsApp OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

/**
 * Handle OAuth callback from WhatsApp
 */
router.get('/oauth/whatsapp/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect('/dashboard/integrations?error=whatsapp_denied');
    }

    if (!code || !state) {
      return res.redirect('/dashboard/integrations?error=invalid_request');
    }

    // Verify state
    const stateData = whatsappOAuth.verifyState(state as string);
    if (!stateData) {
      return res.redirect('/dashboard/integrations?error=invalid_state');
    }

    // Exchange code for token
    const tokenData = await whatsappOAuth.exchangeCodeForToken(code as string);
    
    // Get long-lived token
    const longLivedToken = await whatsappOAuth.exchangeForLongLivedToken(tokenData.access_token);
    
    // Get business account ID and profile
    const businessAccountId = await whatsappOAuth.getBusinessAccountId(longLivedToken.access_token);
    const profile = await whatsappOAuth.getBusinessProfile(longLivedToken.access_token, businessAccountId);
    const phoneNumbers = await whatsappOAuth.getPhoneNumbers(longLivedToken.access_token, businessAccountId);
    
    // Save token and business data
    await whatsappOAuth.saveToken(stateData.userId, longLivedToken, {
      businessAccountId,
      phoneNumbers
    });

    // Create integration record
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('integrations')
        .upsert({
          user_id: stateData.userId,
          provider: 'whatsapp',
          account_type: profile.name || 'WhatsApp Business',
          credentials: { 
            business_name: profile.name,
            phone_numbers: phoneNumbers.map((p: any) => p.display_phone_number)
          },
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        });
    }

    res.redirect('/dashboard/integrations?success=whatsapp_connected');
  } catch (error) {
    console.error('WhatsApp OAuth callback error:', error);
    res.redirect('/dashboard/integrations?error=whatsapp_oauth_failed');
  }
});

/**
 * Disconnect WhatsApp
 */
router.post('/oauth/whatsapp/disconnect', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.body.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await whatsappOAuth.revokeToken(userId);
    
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('integrations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', 'whatsapp');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * Check WhatsApp token status
 */
router.get('/oauth/whatsapp/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const token = await whatsappOAuth.getValidToken(userId);
    
    if (token) {
      res.json({ connected: true });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Error checking WhatsApp status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// ==================== GMAIL OAUTH ====================

/**
 * Initialize OAuth flow for Gmail
 */
router.get('/connect/gmail', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const authUrl = gmailOAuth.getAuthorizationUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Gmail OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

/**
 * Handle OAuth callback from Gmail
 */
router.get('/oauth/gmail/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect('/dashboard/integrations?error=gmail_denied');
    }

    if (!code || !state) {
      return res.redirect('/dashboard/integrations?error=invalid_request');
    }

    // Verify state
    const stateData = gmailOAuth.verifyState(state as string);
    if (!stateData) {
      return res.redirect('/dashboard/integrations?error=invalid_state');
    }

    // Exchange code for tokens
    const tokens = await gmailOAuth.exchangeCodeForToken(code as string);
    
    // Get user profile
    const userProfile = await gmailOAuth.getUserProfile(tokens.access_token);
    const gmailProfile = await gmailOAuth.getGmailProfile(tokens.access_token);
    
    // Save tokens
    await gmailOAuth.saveToken(stateData.userId, tokens, {
      ...userProfile,
      ...gmailProfile
    });

    // Create integration record
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('integrations')
        .upsert({
          user_id: stateData.userId,
          provider: 'gmail',
          account_type: gmailProfile.emailAddress,
          credentials: { 
            email: gmailProfile.emailAddress,
            name: userProfile.name
          },
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        });
    }

    res.redirect('/dashboard/integrations?success=gmail_connected');
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    res.redirect('/dashboard/integrations?error=gmail_oauth_failed');
  }
});

/**
 * Disconnect Gmail
 */
router.post('/oauth/gmail/disconnect', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.body.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await gmailOAuth.revokeToken(userId);
    
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('integrations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', 'gmail');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * Check Gmail token status
 */
router.get('/oauth/gmail/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const token = await gmailOAuth.getValidToken(userId);
    
    if (token) {
      try {
        const profile = await gmailOAuth.getGmailProfile(token);
        res.json({ 
          connected: true,
          email: profile.emailAddress
        });
      } catch (error) {
        res.json({ connected: false, error: 'Token expired or invalid' });
      }
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Error checking Gmail status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// ==================== OUTLOOK OAUTH ====================

/**
 * Initialize OAuth flow for Outlook
 */
router.get('/connect/outlook', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const authUrl = outlookOAuth.getAuthorizationUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Outlook OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

/**
 * Handle OAuth callback from Outlook
 */
router.get('/oauth/outlook/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('Outlook OAuth error:', error, error_description);
      return res.redirect('/dashboard/integrations?error=outlook_denied');
    }

    if (!code || !state) {
      return res.redirect('/dashboard/integrations?error=invalid_request');
    }

    // Verify state
    const stateData = outlookOAuth.verifyState(state as string);
    if (!stateData) {
      return res.redirect('/dashboard/integrations?error=invalid_state');
    }

    // Exchange code for tokens
    const tokens = await outlookOAuth.exchangeCodeForToken(code as string);
    
    // Get user profile
    const profile = await outlookOAuth.getUserProfile(tokens.access_token);
    
    // Save tokens
    await outlookOAuth.saveToken(stateData.userId, tokens, profile);

    // Create integration record
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('integrations')
        .upsert({
          user_id: stateData.userId,
          provider: 'outlook',
          account_type: profile.mail || profile.userPrincipalName,
          credentials: { 
            email: profile.mail || profile.userPrincipalName,
            name: profile.displayName
          },
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        });
    }

    res.redirect('/dashboard/integrations?success=outlook_connected');
  } catch (error) {
    console.error('Outlook OAuth callback error:', error);
    res.redirect('/dashboard/integrations?error=outlook_oauth_failed');
  }
});

/**
 * Disconnect Outlook
 */
router.post('/oauth/outlook/disconnect', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.body.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await outlookOAuth.revokeToken(userId);
    
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('integrations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', 'outlook');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Outlook:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * Check Outlook token status
 */
router.get('/oauth/outlook/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const token = await outlookOAuth.getValidToken(userId);
    
    if (token) {
      try {
        const profile = await outlookOAuth.getUserProfile(token);
        res.json({ 
          connected: true,
          email: profile.mail || profile.userPrincipalName,
          name: profile.displayName
        });
      } catch (error) {
        res.json({ connected: false, error: 'Token expired or invalid' });
      }
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Error checking Outlook status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;