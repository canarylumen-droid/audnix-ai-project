/* @ts-nocheck */
import { Request, Response, Router } from 'express';
import { InstagramOAuth } from '../lib/oauth/instagram';
import { WhatsAppOAuth } from '../lib/oauth/whatsapp';
import { GmailOAuth } from '../lib/oauth/gmail';
// import { OutlookOAuth } from '../lib/oauth/outlook'; // Removed - use Gmail + custom SMTP
import { GoogleCalendarOAuth } from '../lib/oauth/google-calendar';
import { CalendlyOAuth, registerCalendlyWebhook } from '../lib/oauth/calendly';
import { supabaseAdmin } from '../lib/supabase-admin';
import { encrypt } from '../lib/crypto/encryption';
// ⚠️ CRITICAL: OTPs are sent via email from configured TWILIO_EMAIL_FROM address (auth@audnixai.com)
// Using Twilio SendGrid for all email delivery - Resend removed

const router = Router();
const instagramOAuth = new InstagramOAuth();
const whatsappOAuth = new WhatsAppOAuth();
const gmailOAuth = new GmailOAuth();
// const outlookOAuth = new OutlookOAuth(); // Removed - use Gmail + custom SMTP
const googleCalendarOAuth = new GoogleCalendarOAuth();
const calendlyOAuth = new CalendlyOAuth();

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
    if (!stateData || !stateData.userId) {
      console.error('Invalid or missing state data:', { state, stateData });
      return res.redirect('/dashboard/integrations?error=invalid_state');
    }

    // Exchange code for token with null safety
    const tokenData = await instagramOAuth.exchangeCodeForToken(code as string);
    if (!tokenData || !tokenData.access_token) {
      console.error('Failed to exchange code for token');
      return res.redirect('/dashboard/integrations?error=token_exchange_failed');
    }

    // Exchange for long-lived token
    const longLivedToken = await instagramOAuth.exchangeForLongLivedToken(tokenData.access_token);
    if (!longLivedToken || !longLivedToken.access_token) {
      console.error('Failed to get long-lived token');
      return res.redirect('/dashboard/integrations?error=token_exchange_failed');
    }

    // Get user profile
    const profile = await instagramOAuth.getUserProfile(longLivedToken.access_token);
    if (!profile || !profile.id) {
      console.error('Failed to get user profile');
      return res.redirect('/dashboard/integrations?error=profile_fetch_failed');
    }

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
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    console.error('OAuth error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      statusCode: error?.statusCode
    });
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

// ==================== WHATSAPP OAUTH (TWILIO) ====================

/**
 * Connect WhatsApp via Twilio
 * Users provide their Twilio credentials directly
 */
router.post('/oauth/whatsapp/connect', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.body.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { accountSid, authToken, fromNumber } = req.body;

    if (!accountSid || !authToken || !fromNumber) {
      return res.status(400).json({ error: 'Missing required Twilio credentials' });
    }

    // Validate credentials first
    const isValid = await whatsappOAuth.validateCredentials({ accountSid, authToken });
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid Twilio credentials' });
    }

    // Save credentials
    await whatsappOAuth.saveCredentials(userId, {
      accountSid,
      authToken,
      fromNumber
    });

    res.json({ 
      success: true,
      message: 'WhatsApp connected successfully via Twilio'
    });
  } catch (error) {
    console.error('Error connecting WhatsApp:', error);
    res.status(500).json({ error: 'Failed to connect WhatsApp' });
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

    await whatsappOAuth.revokeCredentials(userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * Check WhatsApp connection status
 */
router.get('/oauth/whatsapp/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const credentials = await whatsappOAuth.getCredentials(userId);

    if (credentials) {
      res.json({ 
        connected: true,
        fromNumber: credentials.fromNumber
      });
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

// ==================== OUTLOOK OAUTH (REMOVED) ====================
// Outlook integration has been removed in favor of Gmail + custom SMTP
// which provides better coverage with simpler setup.
// Gmail handles most email use cases, and custom SMTP allows users
// to configure any business email provider directly.

// ==================== GOOGLE CALENDAR OAUTH ====================

/**
 * Initialize OAuth flow for Google Calendar
 */
router.get('/connect/google-calendar', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const authUrl = googleCalendarOAuth.getAuthUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Google Calendar OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

/**
 * Handle OAuth callback from Google Calendar
 */
router.get('/oauth/google-calendar/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error === 'access_denied') {
      return res.redirect('/dashboard/integrations?error=denied');
    }

    if (!code || !state) {
      return res.redirect('/dashboard/integrations?error=invalid_request');
    }

    const userId = state as string;

    // Exchange code for tokens
    const tokenData = await googleCalendarOAuth.exchangeCodeForTokens(code as string);

    // Encrypt and store tokens
    const encryptedTokens = encrypt(JSON.stringify({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt.toISOString(),
      email: tokenData.email,
    }));

    // Save to database using storage layer
    try {
      // Import storage at top of file if not already
      const { storage } = await import('../storage');

      await storage.createIntegration({
        userId,
        provider: 'google_calendar',
        encryptedMeta: encryptedTokens,
        connected: true,
        accountType: tokenData.email,
        lastSync: new Date(),
      });

      res.redirect('/dashboard/integrations?success=google_calendar_connected');
    } catch (error) {
      console.error('Failed to save Google Calendar integration:', error);
      res.redirect('/dashboard/integrations?error=save_failed');
    }
  } catch (error) {
    console.error('Google Calendar OAuth callback error:', error);
    res.redirect('/dashboard/integrations?error=oauth_failed');
  }
});

/**
 * Disconnect Google Calendar
 */
router.post('/oauth/google-calendar/disconnect', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.body.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (supabaseAdmin) {
      await supabaseAdmin
        .from('integrations')
        .update({
          connected: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', 'google_calendar');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * Create a calendar event
 */
router.post('/oauth/google-calendar/events', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.body.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { summary, description, startTime, endTime, attendeeEmail, leadId } = req.body;

    if (!summary || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('encrypted_meta')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .eq('connected', true)
      .single();

    if (!integration) {
      return res.status(404).json({ error: 'Google Calendar not connected' });
    }

    const tokens = JSON.parse(integration.encrypted_meta);
    const expiresAt = new Date(tokens.expiresAt);
    let accessToken = tokens.accessToken;

    if (expiresAt < new Date() && tokens.refreshToken) {
      const refreshedTokens = await googleCalendarOAuth.refreshAccessToken(tokens.refreshToken);
      accessToken = refreshedTokens.accessToken;
    }

    const event = await googleCalendarOAuth.createEvent(accessToken, {
      summary,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendeeEmail,
    });

    // If leadId provided, store event association
    if (leadId) {
      const { storage } = await import('../storage');
      await storage.createMessage({
        leadId,
        userId,
        provider: 'system',
        direction: 'outbound',
        body: `Calendar event created: ${summary}`,
        metadata: { 
          eventId: event.id,
          eventLink: event.htmlLink,
          meetingLink: event.hangoutLink
        }
      });
    }

    res.json({ event });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * List upcoming events from Google Calendar
 */
router.get('/oauth/google-calendar/events', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get stored tokens from database
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('encrypted_meta')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .eq('connected', true)
      .single();

    if (!integration) {
      return res.status(404).json({ error: 'Google Calendar not connected' });
    }

    // Decrypt tokens
    const tokens = JSON.parse(integration.encrypted_meta);

    // Check if token needs refresh
    const expiresAt = new Date(tokens.expiresAt);
    let accessToken = tokens.accessToken;

    if (expiresAt < new Date() && tokens.refreshToken) {
      const refreshedTokens = await googleCalendarOAuth.refreshAccessToken(tokens.refreshToken);
      accessToken = refreshedTokens.accessToken;

      // Update stored tokens
      const updatedTokens = {
        ...tokens,
        accessToken: refreshedTokens.accessToken,
        expiresAt: refreshedTokens.expiresAt.toISOString(),
      };

      await supabaseAdmin
        .from('integrations')
        .update({
          encrypted_meta: encrypt(JSON.stringify(updatedTokens)),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider', 'google_calendar');
    }

    // Get upcoming events
    const rawEvents = await googleCalendarOAuth.listUpcomingEvents(accessToken);

    // Transform events to match frontend expectations
    const events = rawEvents.map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      startTime: event.start?.dateTime || event.start?.date,
      endTime: event.end?.dateTime || event.end?.date,
      leadName: event.attendees?.[0]?.displayName || event.attendees?.[0]?.email || null,
      meetingUrl: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null,
      isAiBooked: event.description?.includes('AI Scheduled') || false,
      location: event.location || null,
      description: event.description || null,
    }));

    res.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ==================== CALENDLY OAUTH ====================

/**
 * Initialize Calendly OAuth flow
 */
router.get('/connect/calendly', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.query.user_id as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId, type: 'calendly' })).toString('base64');
    
    const authUrl = calendlyOAuth.getAuthUrl(state);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Calendly OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

/**
 * Handle Calendly OAuth callback
 */
router.get('/oauth/calendly/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect('/dashboard/integrations?error=calendly_denied');
    }

    if (!code || !state) {
      return res.redirect('/dashboard/integrations?error=invalid_request');
    }

    // Verify state
    let stateData: any;
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch (e) {
      return res.redirect('/dashboard/integrations?error=invalid_state');
    }

    const userId = stateData.userId;
    if (!userId) {
      return res.redirect('/dashboard/integrations?error=invalid_state');
    }

    // Exchange code for token
    const tokenData = await calendlyOAuth.exchangeCodeForToken(code as string);

    // Encrypt and save
    const encryptedMeta = await encrypt(JSON.stringify({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt.toISOString()
    }));

    // Save to database
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('integrations')
        .upsert({
          user_id: userId,
          provider: 'calendly',
          account_type: tokenData.user?.email || 'Calendly (OAuth)',
          encrypted_meta: encryptedMeta,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        });
    }

    // Register webhooks for real-time meeting notifications
    try {
      await registerCalendlyWebhook(userId, tokenData.accessToken);
    } catch (err) {
      console.warn('⚠️ Webhook registration failed but OAuth connection successful:', err);
      // Don't fail OAuth if webhook registration fails
    }

    res.redirect('/dashboard/integrations?success=calendly_connected');
  } catch (error: any) {
    console.error('Calendly OAuth callback error:', error);
    res.redirect('/dashboard/integrations?error=oauth_failed');
  }
});

/**
 * Create a calendar event
 */
router.post('/oauth/google-calendar/events', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId || req.body.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { summary, description, startTime, endTime, attendeeEmail, location } = req.body;

    if (!summary || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get stored tokens
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('encrypted_meta')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .eq('connected', true)
      .single();

    if (!integration) {
      return res.status(404).json({ error: 'Google Calendar not connected' });
    }

    const tokens = JSON.parse(integration.encrypted_meta);
    let accessToken = tokens.accessToken;

    // Refresh if expired
    const expiresAt = new Date(tokens.expiresAt);
    if (expiresAt < new Date() && tokens.refreshToken) {
      const refreshedTokens = await googleCalendarOAuth.refreshAccessToken(tokens.refreshToken);
      accessToken = refreshedTokens.accessToken;
    }

    // Create event
    const event = await googleCalendarOAuth.createEvent(accessToken, {
      summary,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendeeEmail,
      location,
    });

    res.json({ event });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

export default router;