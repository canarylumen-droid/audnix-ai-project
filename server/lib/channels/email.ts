import { supabaseAdmin } from '../supabase-admin.js';
import { generateBrandedEmail, generateMeetingEmail, type BrandColors } from '../ai/dm-formatter.js';
import { storage } from '../../storage.js';

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
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port || 587,
    secure: config.smtp_port === 465,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
  });

  await transporter.sendMail({
    from: config.smtp_user,
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
  limit: number = 50
): Promise<ImportedEmail[]> {
  const Imap = require('imap');
  const { simpleParser } = require('mailparser');
  
  const imapHost = config.imap_host || config.smtp_host?.replace('smtp', 'imap') || '';
  const imapPort = config.imap_port || 993;
  
  if (!imapHost) {
    throw new Error('IMAP host not configured. Please provide explicit IMAP settings.');
  }
  
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.smtp_user,
      password: config.smtp_pass,
      host: imapHost,
      port: imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    const emails: ImportedEmail[] = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }

        const fetch = imap.seq.fetch('1:' + limit, {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg: { on: (event: string, callback: (stream: NodeJS.ReadableStream) => void) => void }) => {
          msg.on('body', (stream: NodeJS.ReadableStream) => {
            simpleParser(stream, (parseErr: Error | null, parsed: ParsedEmail) => {
              if (!parseErr) {
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

        fetch.once('end', () => {
          imap.end();
        });
      });
    });

    imap.once('error', (err: Error) => {
      reject(err);
    });

    imap.once('end', () => {
      resolve(emails);
    });

    imap.connect();
  });
}

/**
 * Get brand colors from user's extracted PDF data
 */
async function getUserBrandColors(userId: string): Promise<BrandColors | undefined> {
  try {
    return undefined;
  } catch (error) {
    console.error('Error fetching brand colors:', error);
  }
  return undefined;
}

interface EmailOptions {
  isHtml?: boolean;
  brandColors?: BrandColors;
  businessName?: string;
  buttonText?: string;
  buttonUrl?: string;
  isMeetingInvite?: boolean;
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
    const { decrypt } = await import('../../crypto/encryption.js');
    if (!customEmailIntegration.encryptedMeta) {
      throw new Error('Email credentials not configured');
    }
    const credentialsStr = await decrypt(customEmailIntegration.encryptedMeta);
    const credentials = JSON.parse(credentialsStr) as EmailConfig;
    
    const brandColors = options.brandColors || await getUserBrandColors(userId);
    
    const user = await storage.getUser(userId);
    const businessName = options.businessName || user?.businessName || user?.company || 'Our Team';
    
    let emailBody = content;
    if (options.buttonUrl && options.buttonText) {
      if (options.isMeetingInvite) {
        emailBody = generateMeetingEmail(content, options.buttonUrl, brandColors, businessName);
      } else {
        emailBody = generateBrandedEmail(content, { text: options.buttonText, url: options.buttonUrl }, brandColors, businessName);
      }
    } else {
      emailBody = generateBrandedEmail(content, { text: 'View Details', url: '#' }, brandColors, businessName);
    }
    
    await sendCustomSMTP(credentials, recipientEmail, subject, emailBody, true);
    console.log(`📧 Email sent via user's SMTP: ${credentials.smtp_user} -> ${recipientEmail}`);
    return;
  }
  
  if (!supabaseAdmin) {
    throw new Error('No email provider configured. Please connect your business email in Settings.');
  }

  const { data: integration } = await supabaseAdmin
    .from('integrations')
    .select('provider, credentials')
    .eq('user_id', userId)
    .in('provider', ['gmail', 'outlook'])
    .eq('is_active', true)
    .single();

  if (!integration) {
    throw new Error('Email not connected. Please connect your business email in Settings.');
  }

  const brandColors = options.brandColors || await getUserBrandColors(userId);
  
  const { generateEmailSubject } = await import('./email-subject-generator.js');
  const emailSubject = subject || await generateEmailSubject(userId, content);

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('business_name, company')
    .eq('user_id', userId)
    .single();
  const businessName = options.businessName || userData?.business_name || userData?.company || 'Our Team';

  let emailBody = content;
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
    emailBody = generateBrandedEmail(
      content,
      { text: 'View Details', url: '#' },
      brandColors,
      businessName
    );
    options.isHtml = true;
  }

  const credentials = integration.credentials as EmailCredentials | null;
  if (!credentials || !credentials.accessToken || !credentials.email) {
    throw new Error('Invalid email credentials');
  }

  if (integration.provider === 'gmail') {
    await sendGmailMessage(
      credentials, 
      recipientEmail, 
      emailSubject, 
      emailBody,
      options.isHtml
    );
  } else if (integration.provider === 'outlook') {
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
    let safe = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, '');
    safe = safe.replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>/gi, '');
    safe = safe.replace(/<iframe(?:\s[^>]*)?>[\s\S]*?<\/iframe>/gi, '');
    safe = safe.replace(/<[^>]+>/g, '');
    safe = safe
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
    
    return safe.trim();
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
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured');
  }
  
  const { data: integration } = await supabaseAdmin
    .from('integrations')
    .select('provider, credentials')
    .eq('user_id', userId)
    .in('provider', ['gmail', 'outlook'])
    .eq('is_active', true)
    .single();

  if (!integration) {
    throw new Error('Email not connected');
  }

  const credentials = integration.credentials as { accessToken: string } | null;
  if (!credentials || !credentials.accessToken) {
    throw new Error('Invalid email credentials');
  }

  if (integration.provider === 'gmail') {
    return await getGmailInbox(credentials, limit);
  } else if (integration.provider === 'outlook') {
    return await getOutlookInbox(credentials, limit);
  }

  return [];
}

/**
 * Get Gmail inbox
 */
async function getGmailInbox(credentials: { accessToken: string }, limit: number): Promise<GmailMessage[]> {
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
async function getOutlookInbox(credentials: { accessToken: string }, limit: number): Promise<OutlookMessage[]> {
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
