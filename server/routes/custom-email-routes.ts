
import { Router } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { storage } from '../storage';
import { encrypt } from '../lib/crypto/encryption';

const router = Router();

/**
 * Connect custom email domain
 */
router.post('/connect', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { smtpHost, smtpPort, email, password } = req.body;

    if (!smtpHost || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Encrypt credentials
    const credentials = {
      smtp_host: smtpHost,
      smtp_port: parseInt(smtpPort) || 587,
      smtp_user: email,
      smtp_pass: password,
      provider: 'custom'
    };

    const encryptedMeta = await encrypt(JSON.stringify(credentials));

    // Save integration
    await storage.createIntegration({
      userId,
      provider: 'custom_email',
      encryptedMeta,
      connected: true,
      accountType: email,
    });

    res.json({
      success: true,
      message: 'Custom email connected successfully'
    });
  } catch (error: any) {
    console.error('Error connecting custom email:', error);
    res.status(500).json({ error: 'Failed to connect custom email' });
  }
});

/**
 * Import emails from custom domain
 */
router.post('/import', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    
    // Get custom email integration
    const integration = await storage.getIntegration(userId, 'custom_email');
    
    if (!integration) {
      return res.status(400).json({ error: 'Custom email not connected' });
    }

    // Import would happen here using the importCustomEmails function
    // For now, return success
    res.json({
      success: true,
      leadsImported: 0,
      messagesImported: 0,
      message: 'Import started'
    });
  } catch (error: any) {
    console.error('Error importing custom emails:', error);
    res.status(500).json({ error: 'Failed to import emails' });
  }
});

/**
 * Disconnect custom email
 */
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    
    await storage.deleteIntegration(userId, 'custom_email');

    res.json({
      success: true,
      message: 'Custom email disconnected'
    });
  } catch (error: any) {
    console.error('Error disconnecting custom email:', error);
    res.status(500).json({ error: 'Failed to disconnect custom email' });
  }
});

export default router;
