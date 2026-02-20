import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { storage } from '../storage.js';
import { encrypt } from '../lib/crypto/encryption.js';
import { pagedEmailImport } from '../lib/imports/paged-email-importer.js';
import { smtpAbuseProtection } from '../lib/email/smtp-abuse-protection.js';
import { bounceHandler } from '../lib/email/bounce-handler.js';

const router = Router();

// Common SMTP hostname typos and their corrections
const HOSTNAME_TYPO_MAP: Record<string, string> = {
  'hostlinger.com': 'hostinger.com',
  'hostlinger.io': 'hostinger.com',
  'hostimer.com': 'hostinger.com',
  'goggle.com': 'google.com',
  'gogle.com': 'google.com',
  'outllook.com': 'outlook.com',
  'outook.com': 'outlook.com',
};

function getSmtpErrorDetails(error: any, host: string): { error: string; details: string; tip: string } {
  const code = error?.code || '';
  const hostDomain = host.replace(/^(smtp|imap|mail)\./, '');
  const suggestedDomain = HOSTNAME_TYPO_MAP[hostDomain];
  const typoHint = suggestedDomain
    ? ` It looks like "${host}" may be a typo — did you mean "${host.replace(hostDomain, suggestedDomain)}"?`
    : '';

  if (code === 'ETIMEDOUT' || code === 'ESOCKET') {
    return {
      error: `Connection timed out to ${host}.${typoHint}`,
      details: `The server at ${host} did not respond on the specified port. This usually means the hostname is wrong, the port is blocked, or the server is down.`,
      tip: typoHint
        ? `Check for typos in the hostname.${typoHint}`
        : 'Double-check the SMTP hostname and port. Common ports: 465 (SSL), 587 (STARTTLS), 25 (unencrypted). If you have 2FA enabled, use an App Password.'
    };
  }

  if (code === 'ENOTFOUND') {
    return {
      error: `Hostname "${host}" not found.${typoHint}`,
      details: `DNS lookup failed for ${host}. The hostname does not exist or is misspelled.`,
      tip: typoHint
        ? `Check for typos.${typoHint}`
        : 'Verify the SMTP hostname with your email provider.'
    };
  }

  if (code === 'EHOSTUNREACH') {
    return {
      error: `Cannot reach ${host}.${typoHint}`,
      details: `The server at ${host} is unreachable. It may be down or the hostname may be incorrect.`,
      tip: typoHint
        ? `Check for typos.${typoHint}`
        : 'Verify the SMTP hostname is correct and the server is online.'
    };
  }

  if (code === 'EAUTH' || error?.responseCode === 535) {
    return {
      error: 'Authentication failed. Please check your password.',
      details: error.message,
      tip: 'If you have 2FA enabled, you MUST use an App Password instead of your regular password.'
    };
  }

  // Generic fallback
  return {
    error: 'Connection failed. Please verify your settings.',
    details: error.message || String(error),
    tip: 'Check your SMTP host, port, email, and password. If you have 2FA enabled, use an App Password.'
  };
}

interface EmailConfig {
  smtp_host?: string;
  smtp_port?: number;
  imap_host?: string;
  imap_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  from_name?: string;
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
  fromName?: string;
}

/**
 * Connect custom email domain
 */
router.post('/connect', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { smtpHost, smtpPort, imapHost, imapPort, email, password, fromName } = req.body as ConnectRequestBody;

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
      from_name: fromName || '',
      provider: 'custom'
    };

    // --- VERIFY CREDENTIALS BEFORE SAVING ---
    console.log(`[Email Connect] Verifying credentials for ${email}...`);
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: credentials.smtp_host,
        port: credentials.smtp_port,
        secure: credentials.smtp_port === 465,
        auth: {
          user: credentials.smtp_user,
          pass: credentials.smtp_pass,
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certs for broad compatibility
        },
        connectionTimeout: 15000, // 15s — enough for slow providers
        greetingTimeout: 10000,   // 10s for SMTP greeting
        socketTimeout: 15000      // 15s socket idle timeout
      });

      await transporter.verify();
      console.log(`[Email Connect] SMTP Verification Successful`);
    } catch (verifyError: any) {
      console.error(`[Email Connect] Verification Failed:`, verifyError);
      const errorInfo = getSmtpErrorDetails(verifyError, credentials.smtp_host!);
      res.status(400).json(errorInfo);
      return;
    }
    // ----------------------------------------

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
        accountType: email,
      });
    } catch (dbError: unknown) {
      const msg = dbError instanceof Error ? dbError.message : 'Database error';
      console.error(`[Email Connect] Storage error:`, dbError);
      res.status(500).json({ error: 'Failed to save email configuration', details: msg });
      return;
    }

    console.log(`[Email Connect] Email account saved for user ${userId}`);

    // Trigger background sync — the emailSyncWorker and imapIdleManager
    // will handle the full IMAP import asynchronously. We do NOT do it
    // inline because it can take 60-120s and would timeout the serverless function.
    try {
      const { imapIdleManager } = await import('../lib/email/imap-idle-manager.js');
      // Fire-and-forget: triggers background IMAP connection + email import
      imapIdleManager.syncConnections();
      console.log(`[Email Connect] Background sync triggered for user ${userId}`);
    } catch (idleErr) {
      console.warn('[Email Connect] Could not trigger background sync:', idleErr);
    }

    res.json({
      success: true,
      message: 'Custom email connected successfully. Emails will be imported in the background.',
      leadsImported: 0,
      leadsSkipped: 0,
      backgroundImport: true
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
    const emails: ImportedEmailData[] = await importCustomEmails(credentials, 100, 120000);

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

    // Create notification for custom email import
    if (importResults.imported > 0) {
      try {
        await storage.createNotification({
          userId,
          type: 'lead_import',
          title: '\ud83d\udce5 Leads Imported',
          message: `${importResults.imported} leads imported from custom email`,
          metadata: { source: 'custom_email', count: importResults.imported }
        });
      } catch (notifErr) {
        console.warn('[Custom Email Import] Failed to create notification:', notifErr);
      }
    }
  } catch (error: unknown) {
    console.error('Error importing custom emails:', error);
    res.status(500).json({ error: 'Failed to import emails' });
  }
});

/**
 * Test SMTP connection without saving
 */
router.post('/test', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { smtpHost, smtpPort, email, password } = req.body;

    if (!smtpHost || !email || !password) {
      res.status(400).json({ error: 'Missing required fields (SMTP host, email, password)' });
      return;
    }

    console.log(`[Email Test] Testing SMTP connection to ${smtpHost}:${smtpPort || 587}`);

    // Import nodemailer to test connection
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort) || 587,
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: email,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    // Verify connection
    await transporter.verify();

    console.log(`[Email Test] SMTP connection successful for ${email}`);

    res.json({
      success: true,
      message: 'SMTP connection verified successfully'
    });
  } catch (error: any) {
    console.error(`[Email Test] Connection failed:`, error?.message || error);
    const errorInfo = getSmtpErrorDetails(error, req.body.smtpHost);
    res.status(400).json(errorInfo);
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

/**
 * Send a test email through connected SMTP
 */
router.post('/send-test', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { recipientEmail, subject, content } = req.body;

    if (!recipientEmail) {
      res.status(400).json({ error: 'Recipient email is required' });
      return;
    }

    const integration = await storage.getIntegration(userId, 'custom_email');

    if (!integration?.connected) {
      res.status(400).json({ error: 'Email not connected. Please connect your email first.' });
      return;
    }

    const { sendEmail } = await import('../lib/channels/email.js');

    await sendEmail(
      userId,
      recipientEmail,
      content || 'This is a test email from Audnix AI to verify your email connection.',
      subject || 'Audnix AI - Test Email',
      { isHtml: false }
    );

    res.json({
      success: true,
      message: `Test email sent to ${recipientEmail}`
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Send failed';
    console.error('[Email Send Test] Failed:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      details: errorMsg
    });
  }
});

/**
 * Get SMTP settings for the current user
 */
router.get('/settings', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const settings = await storage.getSmtpSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error('[Email Settings] Error:', error);
    res.status(500).json({ error: 'Failed to fetch SMTP settings' });
  }
});

/**
 * Get discovered folders for the connected account
 */
router.get('/folders', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { imapIdleManager } = await import('../lib/email/imap-idle-manager.js');
    const folders = imapIdleManager.getDiscoveredFolders(userId);

    if (!folders) {
      res.json({
        success: true,
        inbox: ['INBOX'],
        sent: ['Sent'],
        isDiscovering: true
      });
      return;
    }

    res.json({
      success: true,
      inbox: folders.inbox,
      sent: folders.sent,
      isDiscovering: false
    });
  } catch (error) {
    console.error('[Email Folders] Error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

/**
 * Trigger an immediate sync for both Inbox and Sent folders
 */
router.post('/sync-now', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { imapIdleManager } = await import('../lib/email/imap-idle-manager.js');

    // Trigger sync in background
    // @ts-ignore
    imapIdleManager.syncConnections();

    res.json({
      success: true,
      message: 'Sync triggered successfully'
    });
  } catch (error) {
    console.error('[Email Sync] Error:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});

/**
 * Trigger historical sync (e.g. last 30 days)
 */
router.post('/sync-history', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { days } = req.body;
    const daysToSync = parseInt(days) || 30;

    const { imapIdleManager } = await import('../lib/email/imap-idle-manager.js');
    
    // Run in background to avoid timeout
    imapIdleManager.syncHistoricalEmails(userId, daysToSync)
      .then((result) => {
        console.log(`[Historical Sync] Background job finished for ${userId}:`, result);
      })
      .catch((err) => {
        console.error(`[Historical Sync] Background job failed for ${userId}:`, err);
      });

    res.json({
      success: true,
      message: `Historical sync started for last ${daysToSync} days. Check back in a few minutes.`
    });
  } catch (error) {
    console.error('[Historical Sync] Error:', error);
    res.status(500).json({ error: 'Failed to trigger historical sync' });
  }
});

export default router;
