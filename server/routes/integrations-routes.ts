import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { storage } from '../storage.js';
import { encrypt } from '../lib/crypto/encryption.js';

const router = Router();

/**
 * GET /api/integrations
 * Returns all integrations for the current user (safe, no secrets).
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const integrations = await storage.getIntegrations(userId);

    const safeIntegrations = integrations.map(integration => ({
      id: integration.id,
      provider: integration.provider,
      connected: integration.connected,
      accountType: integration.accountType,
      lastSync: integration.lastSync,
      createdAt: integration.createdAt,
    }));

    res.json(safeIntegrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

/**
 * POST /api/integrations/:provider/connect
 * Generic integration connect (for non-OAuth providers).
 */
router.post('/:provider/connect', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { provider } = req.params;
    const credentials = req.body;

    // Enforce mailbox limits for outreach providers
    if (['custom_email', 'gmail', 'outlook', 'instagram'].includes(provider)) {
      const limitCheck = await storage.checkMailboxLimit(userId);
      if (!limitCheck.allowed) {
        res.status(403).json({
          error: 'Limit reached',
          message: `Your current plan (${limitCheck.plan}) allows up to ${limitCheck.limit} mailboxes.`,
          count: limitCheck.current,
          limit: limitCheck.limit,
          plan: limitCheck.plan
        });
        return;
      }
    }

    const encryptedMeta = encrypt(JSON.stringify(credentials));

    const integration = await storage.createIntegration({
      userId,
      provider: provider as any,
      encryptedMeta,
      connected: true,
    });

    res.json({
      id: integration.id,
      provider: integration.provider,
      connected: integration.connected,
      message: `${provider} connected successfully`
    });
  } catch (error) {
    console.error('Error connecting integration:', error);
    res.status(500).json({ error: 'Failed to connect integration' });
  }
});

/**
 * POST /api/integrations/:provider/disconnect
 * Disconnect and revoke an integration. Handles both OAuth (Gmail/Outlook)
 * and custom email providers. Accepts `integrationId` as a query param
 * to target a specific mailbox when the user has multiple.
 *
 * Cleanup order:
 * 1. Revoke the OAuth token with the provider (best-effort)
 * 2. Delete from oauth_accounts table (for Gmail/Outlook)
 * 3. Delete from integrations table
 */
router.post('/:provider/disconnect', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { provider } = req.params;
    // Support integrationId from both query string and request body for flexibility
    const integrationId = (req.query.integrationId || req.body?.integrationId) as string | undefined;

    console.log(`[Integrations] Disconnect request: provider=${provider}, integrationId=${integrationId || 'none'}, userId=${userId}`);

    // --- Step 1: Find the integration record ---
    let integration = null;
    if (integrationId) {
      integration = await storage.getIntegrationById(integrationId);
    } else {
      // Fallback: find the first connected integration for this provider
      const allInts = await storage.getIntegrations(userId);
      integration = allInts.find(i => i.provider === provider && i.connected) || null;
    }

    // --- Step 2: Provider-specific OAuth token revocation ---
    if (provider === 'gmail' && integration) {
      try {
        const { gmailOAuth } = await import('../lib/oauth/gmail.js');
        const emailAddress = integration.accountType || undefined;
        console.log(`[Integrations] Revoking Gmail OAuth token for: ${emailAddress || 'unknown'}`);
        // revokeToken handles both the Google API call AND deleting from oauth_accounts
        await gmailOAuth.revokeToken(userId, emailAddress);
      } catch (e: any) {
        // Non-fatal: token may have already expired or been revoked on Google's side
        console.warn(`[Integrations] Gmail token revocation failed (non-fatal): ${e.message}`);
      }
    } else if (provider === 'outlook' && integration) {
      try {
        const { OutlookOAuth } = await import('../lib/oauth/outlook.js');
        const outlookOAuth = new OutlookOAuth();
        console.log(`[Integrations] Revoking Outlook OAuth token for integration: ${integration.id}`);
        await outlookOAuth.revokeToken(userId);
      } catch (e: any) {
        console.warn(`[Integrations] Outlook token revocation failed (non-fatal): ${e.message}`);
      }
    } else if (provider === 'instagram' && integration) {
      try {
        const { InstagramOAuth } = await import('../lib/oauth/instagram.js');
        const instagramOAuth = new InstagramOAuth();
        console.log(`[Integrations] Revoking Instagram OAuth token`);
        await instagramOAuth.revokeToken(userId);
      } catch (e: any) {
        console.warn(`[Integrations] Instagram token revocation failed (non-fatal): ${e.message}`);
      }
    }

    // --- Step 3: Delete the integration record from the database ---
    if (integrationId) {
      console.log(`[Integrations] Deleting integration by ID: ${integrationId}`);
      await storage.deleteIntegrationById(integrationId);
    } else {
      console.log(`[Integrations] Disconnecting all ${provider} integrations for user: ${userId}`);
      await storage.disconnectIntegration(userId, provider);
    }

    // --- Step 4: Notify frontend to refresh ---
    const { wsSync } = await import('../lib/websocket-sync.js');
    wsSync.notifySettingsUpdated(userId);

    console.log(`[Integrations] ✅ ${provider} disconnected successfully`);
    res.json({ success: true, message: `${provider} disconnected` });
  } catch (error: any) {
    console.error('Error disconnecting integration:', error);
    res.status(500).json({ error: 'Failed to disconnect', details: error.message });
  }
});

export default router;
