import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { storage } from '../storage.js';
import { encrypt } from '../lib/crypto/encryption.js';

const router = Router();

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

router.post('/:provider/connect', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { provider } = req.params;
    const credentials = req.body;

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

router.post('/:provider/disconnect', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { provider } = req.params;
    
    await storage.disconnectIntegration(userId, provider as string);

    res.json({ message: `${provider} disconnected` });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
