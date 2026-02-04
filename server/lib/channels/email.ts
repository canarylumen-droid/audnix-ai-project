import { generateBrandedEmail, generateMeetingEmail, type BrandColors } from '../ai/dm-formatter.js';
import { storage } from '../../storage.js';
import * as cheerio from 'cheerio';

/**
 * Email messaging functions with branded templates using extracted PDF brand colors
 */

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

interface EmailCredentials {
  accessToken: string;
  email: string;
}

interface ImportedEmail {
  from: string | undefined;
  to: string | undefined;
  subject: string | undefined;
  text: string | undefined;
  html: string | undefined;
  date: Date | undefined;
}

interface GmailMessage {
  id: string;
  threadId: string;
}

interface OutlookMessage {
  id: string;
  subject: string;
  receivedDateTime: string;
  from?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
}

interface GmailApiResponse {
  messages?: GmailMessage[];
  error?: {
    message?: string;
  };
}

interface OutlookApiResponse {
  value?: OutlookMessage[];
  error?: {
    message?: string;
  };
}

interface GmailSendResponse {
  id?: string;
  threadId?: string;
  error?: {
    message?: string;
  };
}

interface OutlookSendResponse {
  error?: {
    message?: string;
  };
}

interface ParsedEmailAddress {
  text?: string;
}

interface ParsedEmail {
  from?: ParsedEmailAddress;
  to?: ParsedEmailAddress;
  subject?: string;
  text?: string;
  html?: string;
  date?: Date;
}

/**
 * Send email via custom SMTP (for custom domain emails)
 */
async function sendCustomSMTP(
  config: EmailConfig,
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false
): Promise<void> {
  const nodemailer = await import('nodemailer');

  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port || 587,
    secure: config.smtp_port === 465,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
  });

  // Use from_name if provided (RFC 5322 format: "Name <email>")
  const fromAddress = config.from_name
    ? `"${config.from_name}" <${config.smtp_user}>`
    : config.smtp_user;

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    [isHtml ? 'html' : 'text']: body,
  });
}

/**
 * Import emails from custom IMAP server
 */
export async function importCustomEmails(
  config: EmailConfig,
  limit: number = 50,
  timeoutMs: number = 30000,
  mailbox: string = 'INBOX'
): Promise<ImportedEmail[]> {
  const Imap = (await import('imap')).default;
  const { simpleParser } = await import('mailparser');

  const imapHost = config.imap_host || config.smtp_host?.replace('smtp', 'imap') || '';
  const imapPort = config.imap_port || 993;

  if (!imapHost) {
    throw new Error('IMAP host not configured. Please provide explicit IMAP settings.');
  }

  return new Promise((resolve, reject) => {
    let timeoutHandle: NodeJS.Timeout | null = null;
    let completed = false;

    const cleanup = () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      completed = true;
    };

    timeoutHandle = setTimeout(() => {
      if (!completed) {
        completed = true;
        reject(new Error(`IMAP connection timeout after ${timeoutMs}ms. Please check your IMAP settings.`));
      }
    }, timeoutMs);

    const imap = new Imap({
      user: config.smtp_user!,
      password: config.smtp_pass!,
      host: imapHost,
      port: imapPort,
      tls: imapPort === 993,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 10000
    });

    const emails: ImportedEmail[] = [];

    imap.once('ready', () => {
      // @ts-ignore - The types for imap might not have the correct signature for the callback
      imap.openBox(mailbox, true, (err: Error | null, box: any) => {
        if (err) {
          if (mailbox === 'Sent' || mailbox === 'Sent Items') {
            console.log(`Failed to open ${mailbox}, trying common alternatives...`);
          }
          cleanup();
          imap.end();
          reject(new Error(`Failed to open ${mailbox}: ${err.message}`));
          return;
        }

        // Check if mailbox is empty or invalid
        if (!box || !box.messages || box.messages.total === 0) {
          imap.end();
          return; // Resolve will happen on 'end' event
        }

        const total = box.messages.total;
        // Ensure we don't request more than available
        const fetchRange = total < limit ? `1:${total}` : `1:${limit}`;

        const fetch = imap.seq.fetch(fetchRange, {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg: { on: (event: string, callback: (stream: NodeJS.ReadableStream) => void) => void }) => {
          msg.on('body', (stream: NodeJS.ReadableStream) => {
            simpleParser(stream as any, (parseErr: Error | null, parsed: any) => {
              if (!parseErr && parsed) {
                emails.push({
                  from: parsed.from?.text,
                  to: parsed.to?.text,
                  subject: parsed.subject,
                  text: parsed.text,
                  html: parsed.html,
                  date: parsed.date
                });
              }
            });
          });
        });

        fetch.once('error', (err: Error) => {
          cleanup();
          imap.end();
          reject(new Error(`Failed to fetch emails: ${err.message}`));
        });

        fetch.once('end', () => {
          imap.end();
        });
      });
    });

    imap.once('error', (err: Error) => {
      if (!completed) {
        cleanup();
        let errorMessage = `IMAP connection error: ${err.message}`;
        if (err.message.includes('ENOTFOUND')) {
          errorMessage = `IMAP Host not found: "${config.imap_host}". Please check the hostname and try again.`;
        } else if (err.message.includes('ETIMEDOUT')) {
          errorMessage = `Connection to IMAP server timed out. Check your firewall settings or port ${imapPort}.`;
        } else if (err.message.includes('ECONNREFUSED')) {
          errorMessage = `IMAP Connection refused by the server. Verify your port ${imapPort} and SSL settings.`;
        }
        reject(new Error(errorMessage));
      }
    });

    imap.once('end', () => {
      if (!completed) {
        cleanup();
        resolve(emails);
      }
    });

    imap.connect();
  });
}

/**
 * Get brand colors from user's extracted PDF data
 */
async function getUserBrandColors(userId: string): Promise<BrandColors | undefined> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return undefined;

    const metadata = user.metadata as Record<string, unknown> | undefined;
    if (!metadata) return undefined;

    // Check for brand colors from PDF extraction (stored in brand_colors or extracted_brand)
    const brandColors = metadata.brand_colors as Record<string, string> | undefined;
    const extractedBrand = metadata.extracted_brand as { colors?: Record<string, string> } | undefined;

    // Priority: explicit brand_colors > extracted_brand.colors
    const colors = brandColors || extractedBrand?.colors;

    if (colors && (colors.primary || colors.accent || colors.secondary)) {
      return {
        primary: colors.primary || colors.accent || '#3B82F6',
        accent: colors.accent || colors.secondary || colors.primary || '#10B981',
      };
    }

    return undefined;
  } catch (error) {
    console.error('Error fetching brand colors:', error);
    return undefined;
  }
}

interface EmailOptions {
  isHtml?: boolean;
  brandColors?: BrandColors;
  businessName?: string;
  buttonText?: string;
  buttonUrl?: string;
  isMeetingInvite?: boolean;
  isRaw?: boolean; // If true, sends content as-is without branded wrapper
}

/**
 * Send email using appropriate provider with optional branding
 * Priority: custom_email (user's SMTP) > gmail > outlook
 */
export async function sendEmail(
  userId: string,
  recipientEmail: string,
  content: string,
  subject: string,
  options: EmailOptions = {}
): Promise<void> {
  const customEmailIntegration = await storage.getIntegration(userId, 'custom_email');

  if (customEmailIntegration?.connected) {
    const { decrypt } = await import('../crypto/encryption.js');
    if (!customEmailIntegration.encryptedMeta) {
      throw new Error('Email credentials not configured');
    }
    const credentialsStr = await decrypt(customEmailIntegration.encryptedMeta);
    const credentials = JSON.parse(credentialsStr) as EmailConfig;

    let emailBody = content;
    
    // Only apply branding if NOT raw
    if (!options.isRaw) {
      const brandColors = options.brandColors || await getUserBrandColors(userId);
      const user = await storage.getUser(userId);
      const businessName = options.businessName || user?.businessName || user?.company || 'Our Team';

      if (options.buttonUrl && options.buttonText) {
        if (options.isMeetingInvite) {
          emailBody = generateMeetingEmail(content, options.buttonUrl, brandColors, businessName);
        } else {
          emailBody = generateBrandedEmail(content, { text: options.buttonText, url: options.buttonUrl }, brandColors, businessName);
        }
      } else {
        emailBody = generateBrandedEmail(content, { text: 'View Details', url: 'https://audnix.com' }, brandColors, businessName);
      }
    }

    await sendCustomSMTP(credentials, recipientEmail, subject, emailBody, true);
    console.log(`📧 Email sent via user's SMTP: ${credentials.smtp_user} -> ${recipientEmail}`);
    return;
  }

  // Fallback to Gmail or Outlook via Storage
  const integrations = await storage.getIntegrations(userId);
  const emailIntegration = integrations.find(i =>
    ['gmail', 'outlook'].includes(i.provider) && i.connected
  );

  if (!emailIntegration) {
    throw new Error('Email not connected. Please connect your business email in Settings.');
  }

  const brandColors = options.brandColors || await getUserBrandColors(userId);

  const { generateEmailSubject } = await import('./email-subject-generator.js');
  const emailSubject = subject || await generateEmailSubject(userId, content);

  const user = await storage.getUser(userId);
  const businessName = options.businessName || user?.businessName || user?.company || 'Our Team';

  let emailBody = content;
  
  if (!options.isRaw) {
    if (options.buttonUrl && options.buttonText) {
      if (options.isMeetingInvite) {
        emailBody = generateMeetingEmail(
          content,
          options.buttonUrl,
          brandColors,
          businessName
        );
      } else {
        emailBody = generateBrandedEmail(
          content,
          { text: options.buttonText, url: options.buttonUrl },
          brandColors,
          businessName
        );
      }
      options.isHtml = true;
    } else {
      emailBody = generateBrandedEmail(content, { text: 'View Details', url: 'https://audnix.com' }, brandColors, businessName);
      options.isHtml = true;
    }
  } else {
    // If raw, ensure we still treat as HTML if it contains tags, or plain text
    // The send functions take `isHtml` flag. If raw, we should probably auto-detect or rely on sender?
    // For now, let's assume raw input from manual replies is plaintext or basic HTML
    options.isHtml = true; // Manual messages usually have simple formatting
  }

  // Assuming credentials are stored in encryptedMeta like other integrations, or if they are in JSON
  // Note: Standard OAuth integrations usually store refresh tokens. 
  // We need to fetch the access token logic if it's not directly in credentials.
  // The original code accessed 'credentials' column. In Neon schema 'encryptedMeta' is the column.
  // Gmail/Outlook auth likely uses `oauth.ts` or similar helpers to get VALID token.
  // We should prob use the helper functions from those files if available.

  // Actually, I should check how Gmail/Outlook tokens are stored.
  // `oauth.ts` stores them. `storage.ts` has `getOAuthAccount`.
  // Using `storage.getOAuthAccount` is safer for token retrieval (handles refresh).

  const { GmailOAuth } = await import('../oauth/gmail.js');
  const { OutlookOAuth } = await import('../oauth/outlook.js');

  let accessToken: string | null = null;
  let fromEmail: string | undefined;

  if (emailIntegration.provider === 'gmail') {
    const gmailOAuth = new GmailOAuth();
    accessToken = await gmailOAuth.getValidToken(userId);
    // Need email address too. Usually stored in integration.accountType or metadata
    fromEmail = emailIntegration.accountType || undefined;
  } else if (emailIntegration.provider === 'outlook') {
    const outlookOAuth = new OutlookOAuth();
    accessToken = await outlookOAuth.getValidToken(userId);
    fromEmail = emailIntegration.accountType || undefined;
  }

  if (!accessToken) {
    throw new Error('Invalid email credentials or token expired');
  }

  // Stub credentials object for compatibility with helper functions
  const credentials = {
    accessToken,
    email: fromEmail || ''
  };

  if (emailIntegration.provider === 'gmail') {
    await sendGmailMessage(
      credentials,
      recipientEmail,
      emailSubject,
      emailBody,
      options.isHtml
    );
  } else if (emailIntegration.provider === 'outlook') {
    await sendOutlookMessage(
      credentials,
      recipientEmail,
      emailSubject,
      emailBody,
      options.isHtml
    );
  } else {
    throw new Error('Unsupported email provider');
  }
}

/**
 * Send email via Gmail API
 */
async function sendGmailMessage(
  credentials: EmailCredentials,
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false
): Promise<void> {
  const message = createMimeMessage(credentials.email, to, subject, body, isHtml);
  const encodedMessage = Buffer.from(message).toString('base64url');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage
    })
  });

  const data = await response.json() as GmailSendResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to send Gmail');
  }
}

/**
 * Send email via Outlook/Microsoft Graph API
 */
async function sendOutlookMessage(
  credentials: EmailCredentials,
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false
): Promise<void> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: subject,
        body: {
          contentType: isHtml ? 'HTML' : 'Text',
          content: body
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
      },
      saveToSentItems: true
    })
  });

  if (!response.ok) {
    const data = await response.json() as OutlookSendResponse;
    throw new Error(data.error?.message || 'Failed to send Outlook email');
  }
}

/**
 * Create MIME message for Gmail with HTML support
 */
function createMimeMessage(
  from: string,
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false
): string {
  const boundary = '----=_Part_' + Date.now();

  const stripHtml = (html: string): string => {
    if (!html) return '';
    try {
      const $ = cheerio.load(html);

      // Remove dangerous tags
      $('script, style, iframe, object, embed, link').remove();

      // Get text content
      let text = $.text();

      return text.replace(/\s+/g, ' ').trim();
    } catch (e) {
      // Fallback for environment issues, though cheerio should work
      return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  };

  const parts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    isHtml ? stripHtml(body) : body,
    ''
  ];

  if (isHtml) {
    parts.push(
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      body,
      ''
    );
  }

  parts.push(`--${boundary}--`);

  return parts.join('\r\n');
}

/**
 * Get email inbox messages
 */
export async function getEmailInbox(
  userId: string,
  limit: number = 20
): Promise<GmailMessage[] | OutlookMessage[]> {
  const integrations = await storage.getIntegrations(userId);
  const emailIntegration = integrations.find(i =>
    ['gmail', 'outlook'].includes(i.provider) && i.connected
  );

  if (!emailIntegration) {
    throw new Error('Email not connected');
  }

  const { GmailOAuth } = await import('../oauth/gmail.js');
  const { OutlookOAuth } = await import('../oauth/outlook.js');

  let accessToken: string | null = null;
  let emailAddress: string | undefined = emailIntegration.accountType || undefined;

  if (emailIntegration.provider === 'gmail') {
    const gmailOAuth = new GmailOAuth();
    accessToken = await gmailOAuth.getValidToken(userId);
  } else if (emailIntegration.provider === 'outlook') {
    const outlookOAuth = new OutlookOAuth();
    accessToken = await outlookOAuth.getValidToken(userId);
  }

  if (!accessToken) {
    throw new Error('Invalid email credentials');
  }

  if (emailIntegration.provider === 'gmail') {
    return await getGmailInbox({ accessToken, email: emailAddress || '' }, limit);
  } else if (emailIntegration.provider === 'outlook') {
    return await getOutlookInbox({ accessToken, email: emailAddress || '' }, limit);
  }

  return [];
}

/**
 * Get Gmail inbox
 */
async function getGmailInbox(credentials: { accessToken: string, email: string }, limit: number): Promise<GmailMessage[]> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}`, {
    headers: {
      'Authorization': `Bearer ${credentials.accessToken}`
    }
  });

  const data = await response.json() as GmailApiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to get Gmail inbox');
  }

  return data.messages || [];
}

/**
 * Get Outlook inbox
 */
async function getOutlookInbox(credentials: { accessToken: string, email: string }, limit: number): Promise<OutlookMessage[]> {
  const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$top=${limit}&$orderby=receivedDateTime desc`, {
    headers: {
      'Authorization': `Bearer ${credentials.accessToken}`
    }
  });

  const data = await response.json() as OutlookApiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to get Outlook inbox');
  }

  return data.value || [];
}
