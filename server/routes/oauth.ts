import { Request, Response, Router } from 'express';
import { InstagramOAuth } from '../lib/oauth/instagram.js';
import { WhatsAppOAuth } from '../lib/oauth/whatsapp.js';
import { GmailOAuth } from '../lib/oauth/gmail.js';
import { GoogleCalendarOAuth } from '../lib/oauth/google-calendar.js';
import { CalendlyOAuth, registerCalendlyWebhook } from '../lib/oauth/calendly.js';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { encrypt } from '../lib/crypto/encryption.js';

interface AuthenticatedRequest extends Request {
  session: Request['session'] & {
    userId?: string;
  };
}

interface WhatsAppConnectBody {
  user_id?: string;
  accountSid: string;
  authToken: string;
  fromNumber: string;
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
const whatsappOAuth = new WhatsAppOAuth();
const gmailOAuth = new GmailOAuth();
const googleCalendarOAuth = new GoogleCalendarOAuth();
const calendlyOAuth = new CalendlyOAuth();

// ==================== INSTAGRAM OAUTH ====================

router.get('/connect/instagram', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authUrl = instagramOAuth.getAuthorizationUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Instagram OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

router.get('/oauth/instagram/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error_reason } = req.query;

    if (error_reason === 'user_denied') {
      res.redirect('/dashboard/integrations?error=denied');
      return;
    }

    if (!code || !state) {
      res.redirect('/dashboard/integrations?error=invalid_request');
      return;
    }

    const stateData = instagramOAuth.verifyState(state as string);
    if (!stateData || !stateData.userId) {
      console.error('Invalid or missing state data:', { state, stateData });
      res.redirect('/dashboard/integrations?error=invalid_state');
      return;
    }

    const tokenData = await instagramOAuth.exchangeCodeForToken(code as string);
    if (!tokenData || !tokenData.access_token) {
      console.error('Failed to exchange code for token');
      res.redirect('/dashboard/integrations?error=token_exchange_failed');
      return;
    }

    const longLivedToken = await instagramOAuth.exchangeForLongLivedToken(tokenData.access_token);
    if (!longLivedToken || !longLivedToken.access_token) {
      console.error('Failed to get long-lived token');
      res.redirect('/dashboard/integrations?error=token_exchange_failed');
      return;
    }

    const profile = await instagramOAuth.getUserProfile(longLivedToken.access_token);
    if (!profile || !profile.id) {
      console.error('Failed to get user profile');
      res.redirect('/dashboard/integrations?error=profile_fetch_failed');
      return;
    }

    await instagramOAuth.saveToken(stateData.userId, {
      access_token: longLivedToken.access_token,
      user_id: profile.id,
      permissions: ['instagram_basic', 'instagram_manage_messages']
    }, longLivedToken.expires_in);

    // Using Neon database for integration storage - no Supabase needed
    res.redirect('/dashboard/integrations?success=instagram_connected');
  } catch (error: unknown) {
    const err = error as Error & { code?: string; statusCode?: number };
    console.error('OAuth callback error:', error);
    console.error('OAuth error details:', {
      message: err?.message,
      stack: err?.stack,
      code: err?.code,
      statusCode: err?.statusCode
    });
    res.redirect('/dashboard/integrations?error=oauth_failed');
  }
});

router.post('/oauth/instagram/disconnect', async (req: Request, res: Response): Promise<void> => {
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

router.get('/oauth/instagram/status', async (req: Request, res: Response): Promise<void> => {
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

// ==================== WHATSAPP OAUTH (TWILIO) ====================

router.post('/oauth/whatsapp/connect', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as WhatsAppConnectBody;
    const userId = authReq.session?.userId || body.user_id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { accountSid, authToken, fromNumber } = body;

    if (!accountSid || !authToken || !fromNumber) {
      res.status(400).json({ error: 'Missing required Twilio credentials' });
      return;
    }

    const isValid = await whatsappOAuth.validateCredentials({ accountSid, authToken });
    if (!isValid) {
      res.status(400).json({ error: 'Invalid Twilio credentials' });
      return;
    }

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

router.post('/oauth/whatsapp/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest, true);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await whatsappOAuth.revokeCredentials(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

router.get('/oauth/whatsapp/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
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

router.get('/oauth/gmail/callback', async (req: Request, res: Response): Promise<void> => {
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

router.post('/oauth/gmail/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest, true);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
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

router.get('/oauth/gmail/status', async (req: Request, res: Response): Promise<void> => {
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

router.get('/oauth/google-calendar/callback', async (req: Request, res: Response): Promise<void> => {
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
      const { storage } = await import('../storage');

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

router.post('/oauth/google-calendar/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest, true);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
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

router.post('/oauth/google-calendar/events', async (req: Request, res: Response): Promise<void> => {
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

    if (!supabaseAdmin) {
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('encrypted_meta')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .eq('connected', true)
      .single();

    if (!integration) {
      res.status(404).json({ error: 'Google Calendar not connected' });
      return;
    }

    const tokens: StoredTokens = JSON.parse(integration.encrypted_meta);
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

router.get('/oauth/google-calendar/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req as AuthenticatedRequest);

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!supabaseAdmin) {
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('encrypted_meta')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .eq('connected', true)
      .single();

    if (!integration) {
      res.status(404).json({ error: 'Google Calendar not connected' });
      return;
    }

    const tokens: StoredTokens = JSON.parse(integration.encrypted_meta);
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

      await supabaseAdmin
        .from('integrations')
        .update({
          encrypted_meta: encrypt(JSON.stringify(updatedTokens)),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider', 'google_calendar');
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

router.get('/oauth/calendly/callback', async (req: Request, res: Response): Promise<void> => {
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
