import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { storage } from '../storage.js';
import { encrypt } from '../lib/crypto/encryption.js';
import { pagedEmailImport } from '../lib/imports/paged-email-importer.js';
import { smtpAbuseProtection } from '../lib/email/smtp-abuse-protection.js';
import { bounceHandler } from '../lib/email/bounce-handler.js';

const router = Router();

interface EmailConfig {
  smtp_host?: string;
  smtp_port?: number;
  imap_host?: string;
  imap_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  oauth_token?: string;
  provider?: 'gmail' | 'outlook' | 'smtp' | 'custom';
}

interface ImportedEmailData {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  date?: Date;
}

interface EmailForImport {
  from: string;
  subject: string | undefined;
  text: string;
  date: Date | undefined;
  html: string | undefined;
}

interface ConnectRequestBody {
  smtpHost: string;
  smtpPort: string;
  imapHost: string;
  imapPort: string;
  email: string;
  password: string;
}

/**
 * Connect custom email domain
 */
router.post('/connect', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { smtpHost, smtpPort, imapHost, imapPort, email, password } = req.body as ConnectRequestBody;

    if (!smtpHost || !email || !password) {
      console.warn(`[Email Connect] Missing required fields for user ${userId}`);
      res.status(400).json({ error: 'Missing required fields (SMTP host, email, password)' });
      return;
    }
    
    const effectiveImapHost = imapHost || smtpHost.replace('smtp.', 'imap.');
    console.log(`[Email Connect] Connecting ${email} via SMTP ${smtpHost}:${smtpPort || 587}`);

    const credentials: EmailConfig = {
      smtp_host: smtpHost,
      smtp_port: parseInt(smtpPort) || 587,
      imap_host: effectiveImapHost,
      imap_port: parseInt(imapPort) || 993,
      smtp_user: email,
      smtp_pass: password,
      provider: 'custom'
    };

    let encryptedMeta: string;
    try {
      encryptedMeta = await encrypt(JSON.stringify(credentials));
    } catch (encryptError: unknown) {
      const msg = encryptError instanceof Error ? encryptError.message : 'Encryption failed';
      console.error(`[Email Connect] Encryption error:`, encryptError);
      res.status(500).json({ error: 'Failed to securely store credentials', details: msg });
      return;
    }

    try {
      await storage.createIntegration({
        userId,
        provider: 'custom_email',
        encryptedMeta,
        connected: true,
      });
    } catch (dbError: unknown) {
      const msg = dbError instanceof Error ? dbError.message : 'Database error';
      console.error(`[Email Connect] Storage error:`, dbError);
      res.status(500).json({ error: 'Failed to save email configuration', details: msg });
      return;
    }

    console.log(`[Email Connect] Email account saved for user ${userId}`);

    // Try to import emails, but don't fail the connection if import fails
    let importResults: any = null;
    let importError: string | null = null;
    
    try {
      console.log(`[Email Connect] Attempting to fetch emails from IMAP...`);
      const { importCustomEmails } = await import('../lib/channels/email.js');
      const emails: ImportedEmailData[] = await importCustomEmails(credentials, 100, 10000);

      const emailsForImport: EmailForImport[] = emails.map((emailData: ImportedEmailData) => ({
        from: emailData.from?.split('<')[1]?.split('>')[0] || emailData.from || '',
        subject: emailData.subject,
        text: emailData.text || emailData.html || '',
        date: emailData.date,
        html: emailData.html
      }));

      if (emailsForImport.length > 0) {
        importResults = await pagedEmailImport(userId, emailsForImport, (progress: number) => {
          console.log(`[Email Connect] Import progress: ${progress}%`);
        });
        console.log(`[Email Connect] Imported ${importResults.imported} emails`);
      } else {
        console.log(`[Email Connect] No emails found in INBOX`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      importError = errorMsg;
      console.warn(`[Email Connect] Auto-import failed (non-critical): ${errorMsg}`);
    }

    // Always return success if email was saved, even if import failed
    res.json({
      success: true,
      message: 'Custom email connected successfully',
      leadsImported: importResults?.imported || 0,
      leadsSkipped: importResults?.skipped || 0,
      importError: importError || undefined
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Email Connect] Fatal error:`, error);
    res.status(500).json({ 
      error: 'Failed to connect custom email',
      details: errorMsg 
    });
  }
});

/**
 * Import emails from custom domain (paged + abuse protection)
 */
router.post('/import', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    
    const abuseCheck = await smtpAbuseProtection.canSendEmail(userId);
    if (!abuseCheck.allowed) {
      res.status(429).json({
        error: abuseCheck.reason,
        retryAfter: abuseCheck.delay
      });
      return;
    }

    const integration = await storage.getIntegration(userId, 'custom_email');
    
    if (!integration) {
      res.status(400).json({ error: 'Custom email not connected' });
      return;
    }

    const { decrypt } = await import('../lib/crypto/encryption.js');
    const credentialsStr = await decrypt(integration.encryptedMeta!);
    const credentials: EmailConfig = JSON.parse(credentialsStr);

    const { importCustomEmails } = await import('../lib/channels/email.js');
    const emails: ImportedEmailData[] = await importCustomEmails(credentials, 100);

    const emailsForImport: EmailForImport[] = emails.map((emailData: ImportedEmailData) => ({
      from: emailData.from?.split('<')[1]?.split('>')[0] || emailData.from || '',
      subject: emailData.subject,
      text: emailData.text || emailData.html || '',
      date: emailData.date,
      html: emailData.html
    }));

    const importResults = await pagedEmailImport(userId, emailsForImport, (progress: number) => {
      console.log(`📧 Email import progress: ${progress}%`);
    });

    for (let i = 0; i < importResults.imported; i++) {
      smtpAbuseProtection.recordSend(userId);
    }

    const bounceStats = await bounceHandler.getBounceStats(userId);

    res.json({
      success: true,
      leadsImported: importResults.imported,
      leadsSkipped: importResults.skipped,
      errors: importResults.errors,
      bounceRate: bounceStats.bounceRate,
      message: `Import completed: ${importResults.imported} leads imported, ${importResults.skipped} skipped`
    });
  } catch (error: unknown) {
    console.error('Error importing custom emails:', error);
    res.status(500).json({ error: 'Failed to import emails' });
  }
});

/**
 * Disconnect custom email
 */
router.post('/disconnect', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    
    await storage.deleteIntegration(userId, 'custom_email');

    res.json({
      success: true,
      message: 'Custom email disconnected'
    });
  } catch (error: unknown) {
    console.error('Error disconnecting custom email:', error);
    res.status(500).json({ error: 'Failed to disconnect custom email' });
  }
});

/**
 * Get custom email status
 */
router.get('/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const integration = await storage.getIntegration(userId, 'custom_email');

    res.json({
      success: true,
      connected: !!integration?.connected,
      email: integration?.accountType || null,
      provider: 'custom_smtp'
    });
  } catch (error: unknown) {
    console.error('Error getting email status:', error);
    res.status(500).json({ error: 'Failed to get email status' });
  }
});

export default router;
