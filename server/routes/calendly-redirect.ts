import { Router, Request, Response } from 'express';
import { calendlyOAuth, registerCalendlyWebhook } from '../lib/oauth/calendly.js';
import { storage } from '../storage.js';
import { encrypt, decryptState } from '../lib/crypto/encryption.js';
import { wsSync } from '../lib/websocket-sync.js';

const router = Router();

interface CalendlyStateData {
  userId: string;
  type: string;
}

/**
 * GET /api/oauth/calendly/callback
 * Handles Calendly OAuth synchronization in the background.
 */
router.get('/calendly/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    console.log(`[Calendly Redirect] Callback received. State: ${state}`);

    if (error) {
      console.error(`[Calendly Redirect] OAuth error: ${error}`);
      res.redirect('/dashboard/integrations?error=calendly_denied');
      return;
    }

    if (!code || !state) {
      res.redirect('/dashboard/integrations?error=invalid_request');
      return;
    }

    // 1. Verify state and retrieve user context (Production-grade AES-256-GCM)
    const stateData = decryptState(state as string);
    if (!stateData) {
      console.error('[Calendly Redirect] Invalid or expired state signature');
      res.redirect('/dashboard/integrations?error=invalid_state');
      return;
    }

    const userId = stateData.userId;

    // Re-attach userId to session conditionally to prevent crashes if session is undefined
    if ((req as any).session) {
      (req as any).session.userId = userId;
    }

    // Exchange code for tokens
    console.log(`[Calendly Redirect] Exchanging code for tokens for user: ${userId}`);
    const tokenData = await calendlyOAuth.exchangeCodeForToken(code as string);

    // 2. Encrypt and persist
    const encryptedMeta = encrypt(JSON.stringify({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt.toISOString()
    }));

    await storage.createIntegration({
      userId: userId,
      provider: 'calendly',
      accountType: 'calendly',
      encryptedMeta: encryptedMeta,
      connected: true,
      lastSync: new Date(),
    });

    // 3. Register Webhook for real-time meetings (Async background task)
    registerCalendlyWebhook(userId, tokenData.accessToken).catch(err => 
      console.error('[Calendly Redirect] Failed to register webhook:', err)
    );

    // 4. Notify frontend
    wsSync.notifySettingsUpdated(userId);

    console.log('[Calendly Redirect] Success. Saving session and redirecting back to dashboard.');
    req.session.save(() => {
      res.redirect('/dashboard/integrations?success=calendly_connected');
    });
  } catch (error) {
    console.error('[Calendly Redirect] Fatal callback error:', error);
    res.redirect('/dashboard/integrations?error=calendly_oauth_failed');
  }
});

export default router;
