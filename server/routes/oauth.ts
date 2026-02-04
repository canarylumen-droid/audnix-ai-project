import { Request, Response, Router } from 'express';
import { InstagramOAuth } from '../lib/oauth/instagram.js';
import { GmailOAuth } from '../lib/oauth/gmail.js';
import { GoogleCalendarOAuth } from '../lib/oauth/google-calendar.js';
import { CalendlyOAuth, registerCalendlyWebhook } from '../lib/oauth/calendly.js';
import { storage } from '../storage.js';
import { encrypt } from '../lib/crypto/encryption.js';

interface AuthenticatedRequest extends Request {
  session: Request['session'] & {
    userId?: string;
  };
}

interface CalendarEventBody {
  user_id?: string;
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendeeEmail?: string;
  location?: string;
  leadId?: string;
}

interface DisconnectBody {
  user_id?: string;
}

interface CalendarEventData {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ displayName?: string; email?: string }>;
  hangoutLink?: string;
  conferenceData?: { entryPoints?: Array<{ uri?: string }> };
  description?: string;
  location?: string;
  htmlLink?: string;
}

interface CalendlyStateData {
  userId: string;
  type: string;
}

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  email?: string;
}

function getUserId(req: AuthenticatedRequest, fromBody = false): string | undefined {
  if (fromBody) {
    const body = req.body as DisconnectBody;
    return req.session?.userId || body.user_id;
  }
  return req.session?.userId || (req.query.user_id as string | undefined);
}

const router = Router();
const instagramOAuth = new InstagramOAuth();
const gmailOAuth = new GmailOAuth();
const googleCalendarOAuth = new GoogleCalendarOAuth();
const calendlyOAuth = new CalendlyOAuth();

// ==================== INSTAGRAM OAUTH ====================



// GET /auth/instagram - Redirect to Instagram OAuth authorization page
// This route is mounted at /api/oauth/instagram, but might be aliased
import { authLimiter } from '../middleware/rate-limit.js';

router.get('/connect/instagram', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authUrl = instagramOAuth.getAuthorizationUrl(userId);
    console.log('[Instagram Connect] Generated JSON URL for user:', userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Instagram OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

router.get('/instagram', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);
    const callbackUrl = process.env.META_CALLBACK_URL || "NOT SET IN ENV";

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[Instagram OAuth] /api/oauth/instagram called");
    console.log("[Instagram OAuth] META_CALLBACK_URL: %s", callbackUrl);
    console.log("[Instagram OAuth] User ID from session: %s", userId || "NOT AUTHENTICATED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!userId) {
      // Redirect to login page if not authenticated
      res.redirect('/auth?error=not_authenticated&redirect=/dashboard/integrations');
      return;
    }

    const authUrl = instagramOAuth.getAuthorizationUrl(userId);
    console.log("[Instagram OAuth] Redirecting to:", authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Instagram OAuth:', error);
    res.redirect('/dashboard/integrations?error=oauth_init_failed');
  }
});

// GET /api/oauth/instagram/callback - Handle Instagram OAuth callback (matches Meta's registered URL)
router.get('/instagram/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error_reason, error, error_description } = req.query;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Instagram OAuth Callback] Received:', {
      hasCode: !!code,
      hasState: !!state,
      error_reason,
      error,
      error_description,
      url: req.originalUrl
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (error_reason === 'user_denied' || error === 'access_denied') {
      res.redirect('/dashboard/integrations?error=denied');
      return;
    }

    if (error) {
      console.error('[Instagram OAuth] Error from Meta:', { error, error_description });
      res.redirect(`/dashboard/integrations?error=${encodeURIComponent(String(error))}`);
      return;
    }

    if (!code || !state) {
      console.error('[Instagram OAuth] Missing code or state');
      res.redirect('/dashboard/integrations?error=invalid_request');
      return;
    }

    const stateData = instagramOAuth.verifyState(state as string);
    if (!stateData || !stateData.userId) {
      console.error('[Instagram OAuth] Invalid state:', { state, stateData });
      res.redirect('/dashboard/integrations?error=invalid_state');
      return;
    }

    console.log('[Instagram OAuth] Exchanging code for token...');
    const tokenData = await instagramOAuth.exchangeCodeForToken(code as string);
    if (!tokenData || !tokenData.access_token) {
      console.error('[Instagram OAuth] Token exchange failed:', tokenData);
      res.redirect('/dashboard/integrations?error=token_exchange_failed');
      return;
    }

    console.log('[Instagram OAuth] Getting long-lived token...');
    const longLivedToken = await instagramOAuth.exchangeForLongLivedToken(tokenData.access_token);
    if (!longLivedToken || !longLivedToken.access_token) {
      console.error('[Instagram OAuth] Long-lived token failed');
      res.redirect('/dashboard/integrations?error=token_exchange_failed');
      return;
    }

    console.log('[Instagram OAuth] Fetching user profile...');
    const profile = await instagramOAuth.getUserProfile(longLivedToken.access_token);
    if (!profile || !profile.id) {
      console.error('[Instagram OAuth] Profile fetch failed');
      res.redirect('/dashboard/integrations?error=profile_fetch_failed');
      return;
    }

    console.log('[Instagram OAuth] Saving token for user:', stateData.userId);

    // Save to Neon database using storage
    const { storage } = await import('../storage.js');
    const { encrypt } = await import('../lib/crypto/encryption.js');

    const encryptedMeta = encrypt(JSON.stringify({
      accessToken: longLivedToken.access_token,
      userId: profile.id,
      username: profile.username,
      expiresAt: new Date(Date.now() + (longLivedToken.expires_in * 1000)).toISOString()
    }));

    await storage.createIntegration({
      userId: stateData.userId,
      provider: 'instagram',
      encryptedMeta,
      connected: true,
      accountType: 'business',
      lastSync: new Date()
    });

    console.log('[Instagram OAuth] Success! Redirecting...');
    res.redirect('/dashboard/integrations?success=instagram_connected');
  } catch (error: unknown) {
    const err = error as Error & { code?: string; statusCode?: number };
    console.error('[Instagram OAuth] Callback error:', {
      message: err?.message,
      stack: err?.stack,
      code: err?.code
    });
    res.redirect('/dashboard/integrations?error=oauth_failed');
  }
});


router.post('/instagram/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest, true);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await instagramOAuth.revokeToken(userId);
    // Using Neon database for integration storage - no Supabase needed
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Instagram:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

router.get('/instagram/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const token = await instagramOAuth.getValidToken(userId);

    if (token) {
      try {
        const profile = await instagramOAuth.getUserProfile(token);
        res.json({
          connected: true,
          username: profile.username,
          userId: profile.id
        });
      } catch {
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

// ==================== GMAIL OAUTH ====================

router.get('/connect/gmail', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authUrl = gmailOAuth.getAuthorizationUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Gmail OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

router.get('/gmail/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      res.redirect('/dashboard/integrations?error=gmail_denied');
      return;
    }

    if (!code || !state) {
      res.redirect('/dashboard/integrations?error=invalid_request');
      return;
    }

    const stateData = gmailOAuth.verifyState(state as string);
    if (!stateData) {
      res.redirect('/dashboard/integrations?error=invalid_state');
      return;
    }

    const tokens = await gmailOAuth.exchangeCodeForToken(code as string);
    const userProfile = await gmailOAuth.getUserProfile(tokens.access_token);
    const gmailProfile = await gmailOAuth.getGmailProfile(tokens.access_token);

    await gmailOAuth.saveToken(stateData.userId, tokens, {
      ...userProfile,
      ...gmailProfile
    });

    await storage.createIntegration({
      userId: stateData.userId,
      provider: 'gmail',
      accountType: gmailProfile.emailAddress,
      encryptedMeta: encrypt(JSON.stringify({
        email: gmailProfile.emailAddress,
        name: userProfile.name,
        tokens
      })),
      connected: true,
      lastSync: new Date()
    });

    res.redirect('/dashboard/integrations?success=gmail_connected');
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    res.redirect('/dashboard/integrations?error=gmail_oauth_failed');
  }
});

router.post('/gmail/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest, true);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await gmailOAuth.revokeToken(userId);
    await storage.disconnectIntegration(userId, 'gmail');

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

router.get('/gmail/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const token = await gmailOAuth.getValidToken(userId);

    if (token) {
      try {
        const profile = await gmailOAuth.getGmailProfile(token);
        res.json({
          connected: true,
          email: profile.emailAddress
        });
      } catch {
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

// ==================== GOOGLE CALENDAR OAUTH ====================

router.get('/connect/google-calendar', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authUrl = googleCalendarOAuth.getAuthUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Google Calendar OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

router.get('/google-calendar/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    if (error === 'access_denied') {
      res.redirect('/dashboard/integrations?error=denied');
      return;
    }

    if (!code || !state) {
      res.redirect('/dashboard/integrations?error=invalid_request');
      return;
    }

    const userId = state as string;
    const tokenData = await googleCalendarOAuth.exchangeCodeForTokens(code as string);

    const encryptedTokens = encrypt(JSON.stringify({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt.toISOString(),
      email: tokenData.email,
    }));

    try {
      const { storage } = await import('../storage.js');

      await storage.createIntegration({
        userId,
        provider: 'google_calendar',
        encryptedMeta: encryptedTokens,
        connected: true,
        lastSync: new Date(),
      });

      res.redirect('/dashboard/integrations?success=google_calendar_connected');
    } catch (saveError) {
      console.error('Failed to save Google Calendar integration:', saveError);
      res.redirect('/dashboard/integrations?error=save_failed');
    }
  } catch (error) {
    console.error('Google Calendar OAuth callback error:', error);
    res.redirect('/dashboard/integrations?error=oauth_failed');
  }
});

router.post('/google-calendar/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest, true);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await storage.disconnectIntegration(userId, 'google_calendar');

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

router.post('/google-calendar/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as CalendarEventBody;
    const userId = authReq.session?.userId || body.user_id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { summary, description, startTime, endTime, attendeeEmail, leadId, location } = body;

    if (!summary || !startTime || !endTime) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const integration = await storage.getIntegration(userId, 'google_calendar');

    if (!integration) {
      res.status(404).json({ error: 'Google Calendar not connected' });
      return;
    }

    const tokens: StoredTokens = JSON.parse(integration.encryptedMeta);
    const expiresAt = new Date(tokens.expiresAt);
    let accessToken = tokens.accessToken;

    if (expiresAt < new Date() && tokens.refreshToken) {
      const refreshedTokens = await googleCalendarOAuth.refreshAccessToken(tokens.refreshToken);
      accessToken = refreshedTokens.accessToken;
    }

    const event: CalendarEventData = await googleCalendarOAuth.createEvent(accessToken, {
      summary,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendeeEmail,
      location,
    });

    if (leadId) {
      const { storage } = await import('../storage.js');
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

router.get('/google-calendar/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const integration = await storage.getIntegration(userId, 'google_calendar');

    if (!integration || !integration.connected) {
      res.status(404).json({ error: 'Google Calendar not connected' });
      return;
    }

    const tokens: StoredTokens = JSON.parse(integration.encryptedMeta);
    const expiresAt = new Date(tokens.expiresAt);
    let accessToken = tokens.accessToken;

    if (expiresAt < new Date() && tokens.refreshToken) {
      const refreshedTokens = await googleCalendarOAuth.refreshAccessToken(tokens.refreshToken);
      accessToken = refreshedTokens.accessToken;

      const updatedTokens = {
        ...tokens,
        accessToken: refreshedTokens.accessToken,
        expiresAt: refreshedTokens.expiresAt.toISOString(),
      };

      await storage.updateIntegration(userId, 'google_calendar', {
        encryptedMeta: encrypt(JSON.stringify(updatedTokens)),
      });
    }

    const rawEvents: CalendarEventData[] = await googleCalendarOAuth.listUpcomingEvents(accessToken);

    const events = rawEvents.map((event: CalendarEventData) => ({
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

router.get('/connect/calendly', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const state = Buffer.from(JSON.stringify({ userId, type: 'calendly' })).toString('base64');
    const authUrl = calendlyOAuth.getAuthUrl(state);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Calendly OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

router.get('/calendly/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      res.redirect('/dashboard/integrations?error=calendly_denied');
      return;
    }

    if (!code || !state) {
      res.redirect('/dashboard/integrations?error=invalid_request');
      return;
    }

    let stateData: CalendlyStateData;
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch {
      res.redirect('/dashboard/integrations?error=invalid_state');
      return;
    }

    const userId = stateData.userId;
    if (!userId) {
      res.redirect('/dashboard/integrations?error=invalid_state');
      return;
    }

    const tokenData = await calendlyOAuth.exchangeCodeForToken(code as string);

    const encryptedMeta = await encrypt(JSON.stringify({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt.toISOString()
    }));

    await storage.createIntegration({
      userId: userId,
      provider: 'calendly',
      accountType: (tokenData.user?.email || 'Calendly (OAuth)'),
      encryptedMeta: encryptedMeta,
      connected: true,
      lastSync: new Date()
    });

    try {
      await registerCalendlyWebhook(userId, tokenData.accessToken);
    } catch (err) {
      console.warn('⚠️ Webhook registration failed but OAuth connection successful:', err);
    }

    res.redirect('/dashboard/integrations?success=calendly_connected');
  } catch (error) {
    console.error('Calendly OAuth callback error:', error);
    res.redirect('/dashboard/integrations?error=oauth_failed');
  }
});

export default router;
