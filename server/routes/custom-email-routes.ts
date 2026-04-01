import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { storage } from '../storage.js';
import { encrypt } from '../lib/crypto/encryption.js';
import { pagedEmailImport } from '../lib/imports/paged-email-importer.js';
import { smtpAbuseProtection } from '../lib/email/smtp-abuse-protection.js';
import { bounceHandler } from '../lib/email/bounce-handler.js';
import { EmailDiscoveryService } from '../lib/email/email-discovery.js';
import Imap from 'imap';

const router = Router();

/**
 * Auto-discover SMTP/IMAP settings
 */
router.post('/discover', requireAuth, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result: any = await EmailDiscoveryService.discoverSettings(email);
    if (!result) return res.json({ provider: 'custom', suggestedName: EmailDiscoveryService.suggestNameFromEmail(email) });
    
    const settings = { ...result };
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      if (domain.includes('gmail.com') || domain.includes('googlemail.com')) {
        settings.appPasswordGuide = {
            provider: 'Google / Gmail',
            instructions: 'Google **strictly requires** an App Password for SMTP/IMAP connections when 2nd-Step Verification is enabled. Your regular login password will NOT work.',
            link: 'https://myaccount.google.com/apppasswords',
            steps: [
              'Log in to your Google Account settings.',
              'Search for "App Passwords" in the search bar.',
              'App name: "Audnix AI" (or similar).',
              'Copy the 16-character code (no spaces) into the Password field below.'
            ]
        };
      } else if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com') || domain.includes('msn.com') || domain.includes('office365.com')) {
        settings.appPasswordGuide = {
            provider: 'Microsoft / Outlook',
            instructions: 'Personal Outlook/Hotmail accounts with 2-Step Verification require an App Password.',
            link: 'https://account.live.com/proofs/AppPassword',
            steps: [
              'Log in to your Microsoft Account.',
              'Security > Advanced security options.',
              'Click "Create a new app password".',
              'Copy the unique code into the Password field below.'
            ]
        };
      } else if (domain.includes('zoho.')) {
        settings.appPasswordGuide = {
          provider: 'Zoho Mail',
          instructions: 'Zoho requires an Application-Specific Password for 2FA-enabled accounts.',
          link: 'https://accounts.zoho.com/home#security/app_password',
          steps: [
            'Log in to Zoho Accounts.',
            'Security > App Passwords.',
            'Generate a new password for "Audnix AI".'
          ]
        };
      }
    }

    res.json(settings);
  } catch (error) {
    console.error('[Email Discovery] Error:', error);
    res.status(500).json({ error: 'Discovery failed' });
  }
});


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

  if (code === 'ETIMEDOUT' || code === 'ESOCKET' || code === 'ECONNREFUSED') {
    const isPort25 = error.port === 25;
    return {
      error: `Connection failed to ${host} on port ${error.port || 'unknown'}.${typoHint}`,
      details: isPort25 
        ? `Port 25 is frequently blocked by hosting providers (like Railway, AWS, DigitalOcean) to prevent spam. Please try using port 587 or 465 instead.`
        : `The server at ${host} did not respond. This usually means the port is blocked by a firewall or the hostname is incorrect.`,
      tip: typoHint
        ? `Check for typos in the hostname.${typoHint}`
        : (isPort25 ? 'Switch to port 587 (STARTTLS) or 465 (SSL/TLS).' : 'Double-check the SMTP host and port. We tried common ports (587, 465) automatically but none responded.')
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
      tip: 'If you have Two-Factor Authentication (2FA) enabled, you MUST use an **App Password**. Regular account passwords will not work. Check your email provider settings to generate one.'
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

    // --- ENFORCE MAILBOX LIMITS ---
    const limitCheck = await storage.checkMailboxLimit(userId);
    if (!limitCheck.allowed) {
      console.warn(`[Email Connect] User ${userId} reached mailbox limit (${limitCheck.current}/${limitCheck.limit}) for plan ${limitCheck.plan}`);
      res.status(403).json({
        error: "Mailbox limit reached",
        details: `Your current plan (${limitCheck.plan}) allows up to ${limitCheck.limit} mailboxes. You already have ${limitCheck.current} connected.`,
        tip: "Upgrade to a higher plan to add more mailboxes."
      });
      return;
    }
    // ----------------------------

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

    // --- PARALLEL SMTP & IMAP VERIFICATION ---
    console.log(`[Email Connect] Verifying both SMTP and IMAP for ${email}...`);

    const trySmtpVerify = async (host: string, port: number): Promise<boolean> => {
      const nodemailer = await import('nodemailer');
      const isSecure = port === 465;
      
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: {
          user: credentials.smtp_user,
          pass: credentials.smtp_pass,
        },
        tls: { rejectUnauthorized: false },
        requireTLS: port === 587 || port === 2525,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000
      });
      await transporter.verify();
      return true;
    };

    const tryImapVerify = async (host: string, port: number): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        const imap = new Imap({
          user: credentials.smtp_user!,
          password: credentials.smtp_pass!,
          host: host,
          port: port,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
          connTimeout: 15000,
          authTimeout: 15000
        });

        imap.once('ready', () => {
          imap.end();
          resolve(true);
        });

        imap.once('error', (err: any) => {
          imap.end();
          reject(err);
        });

        imap.connect();
      });
    };

    // Build the prioritized scan list
    // If it's Gmail, try 465/587 first as they're standard
    const isGmail = email.toLowerCase().endsWith('@gmail.com') || email.toLowerCase().endsWith('@googlemail.com');
    const userSmtpPort = credentials.smtp_port || (isGmail ? 465 : 587);
    const smtpPorts = Array.from(new Set([userSmtpPort, 465, 587, 2525]));
    
    let verifiedSmtpPort: number | null = null;
    let verifiedImapPort: number | null = null;
    let lastError: any = null;

    // STEP A: Verify SMTP with auto-fallback
    // We do this first because many systems block 25/587 but not 465
    for (const port of smtpPorts) {
      try {
        console.log(`[Email Connect] Trying SMTP ${credentials.smtp_host}:${port}...`);
        await trySmtpVerify(credentials.smtp_host!, port);
        verifiedSmtpPort = port;
        break;
      } catch (err: any) {
        console.warn(`[Email Connect] SMTP Port ${port} failed: ${err.code || err.message}`);
        lastError = err;
        if (err.code === 'EAUTH' || err.responseCode === 535) break; 
      }
    }

    if (!verifiedSmtpPort) {
        const errInfo = getSmtpErrorDetails(lastError, credentials.smtp_host!);
        res.status(400).json(errInfo);
        return;
    }

    // STEP B: Verify IMAP
    try {
        console.log(`[Email Connect] Verifying IMAP ${credentials.imap_host}:${credentials.imap_port}...`);
        await tryImapVerify(credentials.imap_host!, credentials.imap_port!);
        verifiedImapPort = credentials.imap_port ?? null;
    } catch (imapErr: any) {
        console.warn(`[Email Connect] IMAP Verification failed: ${imapErr.message}`);
        res.status(400).json({
            error: "IMAP Connection Failed",
            details: imapErr.message,
            tip: isGmail 
                ? "Gmail requires IMAP to be manually enabled in your settings. Go to Gmail > Settings > Forwarding and POP/IMAP and click 'Enable IMAP'."
                : "Check your IMAP host and port. Ensure you are using 'App Passwords' if 2FA is enabled."
        });
        return;
    }

    credentials.smtp_port = verifiedSmtpPort;
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
      // Fire-and-forget: triggers background IMAP connection
      imapIdleManager.syncConnections();
      
      // Implement background, real-time fetching of full inbox history (quietly)
      setTimeout(() => {
          const integrations = storage.getIntegrations(userId) as any;
          integrations.then((ints: any[]) => {
              const customEmail = ints.find((i: any) => i.provider === 'custom_email' && i.accountType === email);
              if (customEmail) {
                  imapIdleManager.syncHistoricalEmails(userId, customEmail.id, 30).catch(console.error);
              }
          });
      }, 5000); // Give connection time to establish

      console.log(`[Email Connect] Background sync triggered for user ${userId}`);

      // Distribute leads from the Inventory pool to this new mailbox
      const { distributeLeadsFromPool } = await import('../lib/sales-engine/outreach-engine.js');
      const integrations = await storage.getIntegrations(userId);
      const customEmail = integrations.find((i: any) => i.provider === 'custom_email' && i.accountType === email);
      if (customEmail) {
        distributeLeadsFromPool(userId, customEmail.id).catch(err => 
          console.error('[Email Connect] Lead distribution failed:', err)
        );
      }
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
    const { integrationId } = req.body;

    if (integrationId) {
      await storage.deleteIntegration(userId, integrationId);
    } else {
      await storage.deleteIntegration(userId, 'custom_email');
    }

    res.json({
      success: true,
      message: 'Email account disconnected'
    });
  } catch (error: unknown) {
    console.error('Error disconnecting custom email:', error);
    res.status(500).json({ error: 'Failed to disconnect custom email' });
  }
});

/**
 * Get custom email status
 */
/**
 * GET /api/custom-email/status
 * Returns ALL connected email mailboxes: SMTP, Gmail, and Outlook.
 * This is the single endpoint the frontend uses to build the unified mailbox list.
 */
router.get('/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const allIntegrations = await storage.getIntegrations(userId);

    // Include ALL email-capable providers in the unified mailbox view
    const emailProviders = ['custom_email', 'gmail', 'outlook'];
    const mailboxes = allIntegrations
      .filter(i => emailProviders.includes(i.provider) && i.connected)
      .map(i => ({
        id: i.id,
        email: i.accountType,
        connected: i.connected,
        provider: i.provider, // 'custom_email' | 'gmail' | 'outlook'
        lastSync: i.lastSync,
      }));

    res.json({
      success: true,
      integrations: mailboxes,
      // Legacy single-mailbox fields for any existing UI that reads them
      connected: mailboxes.length > 0,
      email: mailboxes[0]?.email || null
    });
  } catch (error: unknown) {
    console.error('Error getting email status:', error);
    res.status(500).json({ error: 'Failed to get email status' });
  }
});


/**
 * Send a test email through connected SMTP
 */
/**
 * POST /api/custom-email/send-test
 * Send a test email through any connected mailbox.
 * Accepts optional `integrationId` to test a specific mailbox.
 */
router.post('/send-test', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { recipientEmail, subject, content, integrationId } = req.body;

    if (!recipientEmail) {
      res.status(400).json({ error: 'Recipient email is required' });
      return;
    }

    const { sendEmail } = await import('../lib/channels/email.js');

    await sendEmail(
      userId,
      recipientEmail,
      content || 'This is a test email from Audnix AI to verify your email connection.',
      subject || 'Audnix AI - Test Email',
      { isHtml: false, isRaw: true, integrationId: integrationId || undefined }
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
    const { integrationId } = req.query;
    const { imapIdleManager } = await import('../lib/email/imap-idle-manager.js');

    // If no integrationId, try to find the first one
    let targetId = integrationId as string;
    if (!targetId) {
      const int = await storage.getIntegration(userId, 'custom_email');
      if (int) targetId = int.id;
    }

    if (!targetId) {
      res.status(400).json({ error: 'No email integration found' });
      return;
    }

    const folders = imapIdleManager.getDiscoveredFolders(targetId);

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

    // Get the integration ID for the historical sync
    const integration = await storage.getIntegration(userId, 'custom_email');
    if (!integration) {
      res.status(400).json({ error: 'No custom email integration found' });
      return;
    }

    // Run in background to avoid timeout
    const { imapIdleManager: imapMgr } = await import('../lib/email/imap-idle-manager.js');
    imapMgr.syncHistoricalEmails(userId, integration.id, daysToSync)
      .then((result: any) => {
        console.log(`[Historical Sync] Background job finished for ${userId}:`, result);
      })
      .catch((err: any) => {
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
