import { Router, Request, Response } from 'express';
import { gmailOAuth } from '../lib/oauth/gmail.js';
import { googleCalendarOAuth } from '../lib/oauth/google-calendar.js';
import { storage } from '../storage.js';
import { encrypt, decryptState } from '../lib/crypto/encryption.js';
import { wsSync } from '../lib/websocket-sync.js';

const router = Router();

/**
 * GET /api/oauth/google-redirect/gmail/callback
 * This is the main Google OAuth redirect handler (the "Redirect File").
 * It performs the background work and redirects back to the app.
 */
router.get('/gmail/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    console.log(`[Google Redirect] Callback received. State: ${state}`);

    if (error) {
      console.error(`[Google Redirect] OAuth error: ${error}`);
      res.redirect('/dashboard/integrations?error=gmail_denied');
      return;
    }

    if (!code || !state) {
      res.redirect('/dashboard/integrations?error=invalid_request');
      return;
    }

    // 1. Verify state and retrieve user context (Production-grade AES-256-GCM)
    const stateData = decryptState(state as string);
    if (!stateData) {
      console.error('[Google Redirect] Invalid or expired state signature');
      res.redirect('/dashboard/integrations?error=invalid_state');
      return;
    }

    // 2. Perform "Background Work" - Exchange code for tokens
    console.log(`[Google Redirect] Exchanging code for tokens for user: ${stateData.userId}`);
    const tokens = await gmailOAuth.exchangeCodeForToken(code as string);
    const userProfile = await gmailOAuth.getUserProfile(tokens.access_token);
    const gmailProfile = await gmailOAuth.getGmailProfile(tokens.access_token);

    // 3. Check subscription limits
    const limitCheck = await storage.checkMailboxLimit(stateData.userId);
    if (!limitCheck.allowed) {
      console.warn(`[Google Redirect] Limit reached: ${limitCheck.current}/${limitCheck.limit}`);
      res.redirect(`/dashboard/integrations?error=limit_reached&limit=${limitCheck.limit}&plan=${encodeURIComponent(limitCheck.plan)}`);
      return;
    }

    // 4. Persist the connected account
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

    // 5. Notify the frontend to refresh state
    wsSync.notifySettingsUpdated(stateData.userId);

    // 6. Intelligent Lead Distribution (Async background task)
    const { distributeLeadsFromPool } = await import('../lib/sales-engine/outreach-engine.js');
    
    // Find the integration ID we just created to assign leads
    const integrations = await storage.getIntegrations(stateData.userId);
    const gmailInt = integrations.find(i => i.provider === 'gmail' && i.accountType === gmailProfile.emailAddress);
    
    if (gmailInt) {
      console.log(`[Google Redirect] Launching lead distribution for mailbox: ${gmailInt.id}`);
      distributeLeadsFromPool(stateData.userId, gmailInt.id).catch(err =>
        console.error('[Google Redirect] Lead distribution failed:', err)
      );
    }

    // 7. Final Redirect back to the app's dashboard
    console.log('[Google Redirect] Success. Redirecting back to dashboard.');
    res.redirect('/dashboard/integrations?success=gmail_connected');
    
  } catch (error) {
    console.error('[Google Redirect] Fatal callback error:', error);
    res.redirect('/dashboard/integrations?error=gmail_oauth_failed');
  }
});

/**
 * GET /api/oauth/google-calendar/callback
 * Handles Google Calendar authorization callbacks.
 */
router.get('/google-calendar/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    console.log(`[Google Redirect] Calendar callback received. State: ${state}`);

    if (error === 'access_denied') {
      res.redirect('/dashboard/integrations?error=denied');
      return;
    }

    if (!code || !state) {
      res.redirect('/dashboard/integrations?error=invalid_request');
      return;
    }

    const stateData = decryptState(state as string);
    if (!stateData) {
      console.error('[Google Redirect] Invalid or expired Calendar state signature');
      res.redirect('/dashboard/integrations?error=invalid_state');
      return;
    }

    const userId = stateData.userId;
    const tokenData = await googleCalendarOAuth.exchangeCodeForTokens(code as string);

    const encryptedTokens = encrypt(JSON.stringify({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt.toISOString(),
      email: tokenData.email,
    }));

    try {
      await storage.createIntegration({
        userId,
        provider: 'google_calendar',
        encryptedMeta: encryptedTokens,
        connected: true,
        lastSync: new Date(),
      });

      // Notify frontend
      wsSync.notifySettingsUpdated(userId);

      console.log(`[Google Redirect] Calendar connection successful for user: ${userId}`);
      res.redirect('/dashboard/integrations?success=google_calendar_connected');
    } catch (saveError) {
      console.error('[Google Redirect] Failed to save Google Calendar integration:', saveError);
      res.redirect('/dashboard/integrations?error=save_failed');
    }
  } catch (error) {
    console.error('[Google Redirect] Google Calendar OAuth callback error:', error);
    res.redirect('/dashboard/integrations?error=oauth_failed');
  }
});

export default router;
