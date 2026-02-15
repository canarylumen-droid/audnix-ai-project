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
 * Injects a tracking pixel into HTML email content
 */
export function injectTrackingPixel(html: string, trackingId: string): string {
  if (!trackingId) return html;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://audnixai.com';
  const pixelUrl = `${baseUrl}/api/outreach/track/${trackingId}`;
  const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none !important;" alt="" />`;

  // Try to inject before </body> or at the end
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixelHtml}</body>`);
  }
  return html + pixelHtml;
}

/**
 * Send email via custom SMTP (for custom domain emails)
 */

/**
 * Send email via custom SMTP (for custom domain emails)
 * Includes exponential backoff for transient failures
 */
async function sendCustomSMTP(
  userId: string,
  config: EmailConfig,
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false,
  trackingId?: string
): Promise<{ messageId: string }> {
  const nodemailer = await import('nodemailer');
  const { imapIdleManager } = await import('../email/imap-idle-manager.js');

  let emailBody = body;
  if (isHtml && trackingId) {
    emailBody = injectTrackingPixel(body, trackingId);
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port || 587,
    secure: config.smtp_port === 465,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
    // Increased timeouts for reliability
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });

  const messageId = `<${import.meta.url ? (await import('crypto')).randomUUID() : Date.now() + Math.random()}@audnixai.com>`;

  const fromAddress = config.from_name
    ? `"${config.from_name}" <${config.smtp_user}>`
    : config.smtp_user;

  const MAX_RETRIES = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[CustomSMTP] Retry attempt ${attempt} for`, to, `after ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
      }

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        [isHtml ? 'html' : 'text']: emailBody,
        messageId: messageId.replace(/[<>]/g, ''), // nodemailer adds brackets
      });

      // If we reach here, it worked!
      console.log(`[CustomSMTP] ✅ Successfully sent to ${to} (Attempt ${attempt + 1}) - Message-ID: ${info.messageId}`);

      // Attempt to save to "Sent" folder via persistent IMAP connection
      try {
        const rawMessage = createMimeMessage(fromAddress || '', to, subject, emailBody, isHtml, messageId);
        await imapIdleManager.appendSentMessage(userId, rawMessage, config);
      } catch (error) {
        console.error(`[CustomSMTP] ❌ Failed to save to Sent folder:`, error);
      }

      return { messageId: info.messageId }; // Exit function successfully
    } catch (error: any) {
      lastError = error;
      const isTransient = error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.responseCode >= 400 && error.responseCode < 500;

      if (!isTransient || attempt === MAX_RETRIES) {
        console.error(`[CustomSMTP] ❌ Permanent failure sending to`, to, ':', error.message);
        throw error;
      }
      console.warn(`[CustomSMTP] ⚠️ Transient failure (Attempt ${attempt + 1}):`, error.message);
    }
  }

  throw lastError || new Error('Failed to send email after retries');
}


/**
 * Import emails from custom IMAP server
 */
export async function importCustomEmails(
  config: EmailConfig,
  limit: number = 50,
  timeoutMs: number = 120000,
  mailbox: string = 'INBOX'
): Promise<ImportedEmail[]> {
  const Imap = (await import('imap')).default;
  const { simpleParser } = await import('mailparser');

  const imapHost = config.imap_host || config.smtp_host?.replace('smtp', 'imap') || '';
  const imapPort = config.imap_port || 993;

  if (!imapHost) {
    throw new Error('IMAP host not configured. Please provide explicit IMAP settings.');
  }

  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        let timeoutHandle: NodeJS.Timeout | null = null;
        let completed = false;
        let connectionEnded = false;

        const imap = new Imap({
          user: config.smtp_user!,
          password: config.smtp_pass!,
          host: imapHost,
          port: imapPort,
          tls: imapPort === 993,
          tlsOptions: { rejectUnauthorized: false },
          connTimeout: 45000, // Increased to 45s
          authTimeout: 45000, // Increased to 45s
          keepalive: false,   // Disable keepalive for one-off fetch
          debug: (msg: string) => {
            if (msg.includes('ENOTFOUND') || msg.includes('EAI_AGAIN')) return;
            // console.log(`[IMAP DEBUG] ${msg}`); // Uncomment for debugging
          }
        });

        const safeEnd = () => {
          try {
            if (imap.state !== 'disconnected') imap.end();
          } catch (err) {
            // Ignore
          }
        };

        const cleanup = () => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
          }
        };

        const emails: ImportedEmail[] = [];

        const startFetch = (targetBox: any) => {
          if (!targetBox || !targetBox.messages || targetBox.messages.total === 0) {
            safeEnd();
            return;
          }
          const total = targetBox.messages.total;
          const fetchRange = total <= limit ? `1:${total}` : `${total - limit + 1}:${total}`;
          const fetch = imap.seq.fetch(fetchRange, { bodies: '', struct: true });

          fetch.on('message', (msg: any) => {
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
            safeEnd();
            reject(new Error(`Failed to fetch emails: ${err.message}`));
          });

          fetch.once('end', () => {
            safeEnd();
          });
        };

        imap.once('ready', () => {
          // @ts-ignore
          imap.openBox(mailbox, true, async (err: Error | null, box: any) => {
            if (err) {
              // If folder not found, try with INBOX. prefix
              if (!mailbox.startsWith('INBOX.') && err.message.toLowerCase().includes('nonexistent')) {
                const prefixedMailbox = `INBOX.${mailbox}`;
                console.log(`[IMAP] Folder ${mailbox} not found, retrying with ${prefixedMailbox}`);
                imap.openBox(prefixedMailbox, true, (err3, box3) => {
                  if (!err3) {
                    startFetch(box3);
                  } else {
                    handleOpenError(err); // Original error
                  }
                });
                return;
              }
              handleOpenError(err);
            } else {
              startFetch(box);
            }
          });

          async function handleOpenError(handleErr: Error) {
            if (mailbox === 'Sent' || mailbox === 'Sent Items') {
              try {
                const boxes: any = await new Promise((res, rej) => imap.getBoxes((e, b) => e ? rej(e) : res(b)));
                const sentPatterns = ['sent', 'sent items', 'sent mail', 'sent messages', '[gmail]/sent mail', 'sent-mail'];

                const findBox = (obj: any, prefix = ''): string | null => {
                  for (const key in obj) {
                    const fullName = prefix + key;
                    if (sentPatterns.includes(key.toLowerCase())) return fullName;
                    if (obj[key].children) {
                      const found = findBox(obj[key].children, fullName + (obj[key].delimiter || '/'));
                      if (found) return found;
                    }
                  }
                  return null;
                };

                const discoveredSent = findBox(boxes);
                if (discoveredSent) {
                  console.log(`[IMAP] Discovered Sent folder: ${discoveredSent}`);
                  imap.openBox(discoveredSent, true, (err2, box2) => {
                    if (err2) {
                      cleanup(); safeEnd();
                      reject(new Error(`Failed to open discovered box ${discoveredSent}: ${err2.message}`));
                    } else {
                      startFetch(box2);
                    }
                  });
                  return;
                }
              } catch (e) {
                console.warn('[IMAP] Sent discovery failed', e);
              }
            }
            cleanup();
            safeEnd();
            reject(new Error(`Failed to open ${mailbox}: ${handleErr.message}`));
          }
        });

        imap.once('error', (err: Error) => {
          if (!completed) {
            cleanup();
            // Don't safeEnd here necessarily, as error might have closed it
            connectionEnded = true;

            let errorMessage = `IMAP connection error: ${err.message}`;
            if (err.message.toLowerCase().includes('enotfound') || err.message.toLowerCase().includes('not found')) {
              errorMessage = `IMAP Host not found: "${config.imap_host}". Please check the hostname and try again.`;
            } else if (err.message.toLowerCase().includes('etimedout') || err.message.toLowerCase().includes('timeout')) {
              errorMessage = `Connection to IMAP server timed out. Check your firewall settings or port ${imapPort}.`;
            } else if (err.message.toLowerCase().includes('econnrefused')) {
              errorMessage = `IMAP Connection refused by the server. Verify your port ${imapPort} and SSL settings.`;
            }
            reject(new Error(errorMessage));
          }
        });

        imap.once('end', () => {
          if (!completed) {
            cleanup();
            connectionEnded = true;
            resolve(emails);
          }
        });

        imap.connect();
      });
    } catch (error: any) {
      const isLastAttempt = attempt === MAX_RETRIES;
      const isTimeout = error.message.includes('tim') || error.message.includes('TIM'); // catch timeout, ETIMEDOUT, etc.

      if (!isLastAttempt && (isTimeout || error.message.includes('ECONNRESET') || error.message.includes('socket hang up'))) {
        console.warn(`[IMAP] Attempt ${attempt} failed for ${config.smtp_user}: ${error.message}. Retrying in ${BASE_DELAY * attempt}ms...`);
        await new Promise(res => setTimeout(res, BASE_DELAY * attempt));
        continue;
      }

      // If we're out of retries or it's a fatal error, rethrow or return empty based on policy
      if (isLastAttempt) {
        console.error(`[IMAP] All ${MAX_RETRIES} attempts failed for ${config.smtp_user}: ${error.message}`);
        // We resolve empty to avoid crashing the worker, but log the error
        return [];
      }
      throw error; // Propagate other errors
    }
  }
  return [];
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

// Re-adding missing interface due to previous edit error
export interface EmailOptions {
  isRaw?: boolean; // If true, sends content as-is without branded wrapper
  trackingId?: string;
  brandColors?: BrandColors;
  businessName?: string;
  buttonUrl?: string;
  buttonText?: string;
  isMeetingInvite?: boolean;
  isHtml?: boolean;
  campaignId?: string;
  leadId?: string;
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
): Promise<{ messageId: string }> {
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
        emailBody = generateBrandedEmail(content, { text: 'View Details', url: 'https://audnixai.com' }, brandColors, businessName);
      }
    }

    const result = await sendCustomSMTP(userId, credentials, recipientEmail, subject, emailBody, true, options.trackingId);
    if (result && result.messageId) {
      await storage.createEmailMessage({
        userId,
        leadId: options.leadId || null,
        campaignId: options.campaignId || null,
        messageId: result.messageId,
        subject,
        from: credentials.smtp_user || '',
        to: recipientEmail,
        body: emailBody,
        direction: 'outbound',
        provider: 'custom_email',
        sentAt: new Date(),
        metadata: { trackingId: options.trackingId }
      });
    }
    console.log(`📧 Email sent via user's SMTP: ${credentials.smtp_user} -> ${recipientEmail}`);
    return result;
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
      emailBody = generateBrandedEmail(content, { text: 'View Details', url: 'https://audnixai.com' }, brandColors, businessName);
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
    const result = await sendGmailMessage(
      credentials,
      recipientEmail,
      emailSubject,
      emailBody,
      options.isHtml,
      options.trackingId
    );
    if (result && result.messageId) {
      await storage.createEmailMessage({
        userId,
        leadId: options.leadId || null,
        campaignId: options.campaignId || null,
        messageId: result.messageId,
        subject: emailSubject,
        from: credentials.email || '',
        to: recipientEmail,
        body: emailBody,
        direction: 'outbound',
        provider: 'gmail',
        sentAt: new Date(),
        metadata: { trackingId: options.trackingId }
      });
    }
    return result;
  } else if (emailIntegration.provider === 'outlook') {
    const result = await sendOutlookMessage(
      credentials,
      recipientEmail,
      emailSubject,
      emailBody,
      options.isHtml,
      options.trackingId
    );
    if (result && result.messageId) {
      await storage.createEmailMessage({
        userId,
        leadId: options.leadId || null,
        campaignId: options.campaignId || null,
        messageId: result.messageId || `outlook-${Date.now()}`,
        subject: emailSubject,
        from: credentials.email || '',
        to: recipientEmail,
        body: emailBody,
        direction: 'outbound',
        provider: 'outlook',
        sentAt: new Date(),
        metadata: { trackingId: options.trackingId }
      });
    }
    return result;
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
  isHtml: boolean = false,
  trackingId?: string
): Promise<{ messageId: string }> {
  let emailBody = body;
  if (isHtml && trackingId) {
    emailBody = injectTrackingPixel(body, trackingId);
  }

  const message = createMimeMessage(credentials.email, to, subject, emailBody, isHtml);
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

  return { messageId: data.id || '' };
}

/**
 * Send email via Outlook/Microsoft Graph API
 */
async function sendOutlookMessage(
  credentials: EmailCredentials,
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false,
  trackingId?: string
): Promise<{ messageId: string }> {
  let emailBody = body;
  if (isHtml && trackingId) {
    emailBody = injectTrackingPixel(body, trackingId);
  }

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
          content: emailBody
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

  // Outlook doesn't return the message ID in the sendMail response (202 Accepted)
  // We return null/empty and rely on IMAP sync for the ID if needed later
  return { messageId: '' };
}

/**
 * Create MIME message for Gmail with HTML support
 */
function createMimeMessage(
  from: string,
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false,
  messageId?: string
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
    messageId ? `Message-ID: ${messageId}` : `Message-ID: <${Date.now()}@audnixai.com>`,
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
