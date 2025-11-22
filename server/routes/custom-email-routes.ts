
import { Router } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { storage } from '../storage';
import { encrypt } from '../lib/crypto/encryption';
import { pagedEmailImport } from '../lib/imports/paged-email-importer';
import { smtpAbuseProtection } from '../lib/email/smtp-abuse-protection';
import { bounceHandler } from '../lib/email/bounce-handler';

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

    // Auto-import emails after connection using paged importer with abuse protection
    try {
      const { importCustomEmails } = await import('../lib/channels/email');
      const emails = await importCustomEmails(credentials, 100); // Fetch 100 at a time

      // Use paged importer to process in batches
      const importResults = await pagedEmailImport(userId, emails.map((emailData: any) => ({
        from: emailData.from?.split('<')[1]?.split('>')[0] || emailData.from,
        subject: emailData.subject,
        text: emailData.text || emailData.html || '',
        date: emailData.date,
        html: emailData.html
      })), (progress) => {
        console.log(`📧 Email import progress: ${progress}%`);
      });

      res.json({
        success: true,
        message: 'Custom email connected successfully',
        leadsImported: importResults.imported,
        leadsSkipped: importResults.skipped,
        errors: importResults.errors
      });
    } catch (importError: any) {
      console.error('Auto-import failed:', importError);
      // Still return success for connection, but note import failed
      res.json({
        success: true,
        message: 'Custom email connected, but initial import failed. You can manually import later.',
        importError: importError.message
      });
    }
  } catch (error: any) {
    console.error('Error connecting custom email:', error);
    res.status(500).json({ error: 'Failed to connect custom email' });
  }
});

/**
 * Import emails from custom domain (paged + abuse protection)
 */
router.post('/import', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    
    // Check SMTP abuse protection first
    const abuseCheck = await smtpAbuseProtection.canSendEmail(userId);
    if (!abuseCheck.allowed) {
      return res.status(429).json({
        error: abuseCheck.reason,
        retryAfter: abuseCheck.delay
      });
    }

    // Get custom email integration
    const integration = await storage.getIntegration(userId, 'custom_email');
    
    if (!integration) {
      return res.status(400).json({ error: 'Custom email not connected' });
    }

    // Decrypt credentials
    const { decrypt } = await import('../lib/crypto/encryption');
    const credentialsStr = await decrypt(integration.encryptedMeta!);
    const credentials = JSON.parse(credentialsStr);

    // Import emails
    const { importCustomEmails } = await import('../lib/channels/email');
    const emails = await importCustomEmails(credentials, 100); // Fetch in batches of 100

    // Use paged importer for smart processing
    const importResults = await pagedEmailImport(userId, emails.map((emailData: any) => ({
      from: emailData.from?.split('<')[1]?.split('>')[0] || emailData.from,
      subject: emailData.subject,
      text: emailData.text || emailData.html || '',
      date: emailData.date,
      html: emailData.html
    })), (progress) => {
      console.log(`📧 Email import progress: ${progress}%`);
    });

    // Record sends in abuse protection
    for (let i = 0; i < importResults.imported; i++) {
      smtpAbuseProtection.recordSend(userId);
    }

    // Get bounce stats
    const bounceStats = await bounceHandler.getBounceStats(userId);

    res.json({
      success: true,
      leadsImported: importResults.imported,
      leadsSkipped: importResults.skipped,
      errors: importResults.errors,
      bounceRate: bounceStats.bounceRate,
      message: `Import completed: ${importResults.imported} leads imported, ${importResults.skipped} skipped`
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
