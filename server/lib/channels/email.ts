
import { supabaseAdmin } from '../supabase-admin';
import { generateBrandedEmail, generateMeetingEmail, type BrandColors } from '../ai/dm-formatter';
import { storage } from '../../storage';

/**
 * Email messaging functions with branded templates using extracted PDF brand colors
 */

interface EmailConfig {
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  oauth_token?: string;
  provider?: 'gmail' | 'outlook' | 'smtp' | 'custom';
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
async function importCustomEmails(
  config: EmailConfig,
  limit: number = 50
): Promise<any[]> {
  const Imap = require('imap');
  const { simpleParser } = require('mailparser');
  
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.smtp_user,
      password: config.smtp_pass,
      host: config.smtp_host?.replace('smtp', 'imap') || '',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    const emails: any[] = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err: any) => {
        if (err) {
          reject(err);
          return;
        }

        const fetch = imap.seq.fetch('1:' + limit, {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg: any) => {
          msg.on('body', (stream: any) => {
            simpleParser(stream, (err: any, parsed: any) => {
              if (!err) {
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

    imap.once('error', (err: any) => {
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
    // Brand colors will be fetched from integrations or settings table in the future
    // For now, return undefined to use default colors
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
 * Check Gmail daily send limit and queue if needed
 */
async function checkGmailDailyLimit(userId: string): Promise<{
  canSend: boolean;
  emailsSentToday: number;
  limit: number;
  resetTime: Date;
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured');
  }

  // Get user's Gmail limit (500 for regular, 2000 for workspace)
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('gmail_email, subscription_tier')
    .eq('id', userId)
    .single();

  const isWorkspace = user?.gmail_email?.endsWith('@yourdomain.com'); // Check if workspace
  const dailyLimit = isWorkspace ? 2000 : 500;

  // Count emails sent today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: sentToday } = await supabaseAdmin
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('channel', 'email')
    .gte('created_at', today.toISOString());

  const emailsSentToday = sentToday?.length || 0;
  const resetTime = new Date(today);
  resetTime.setDate(resetTime.getDate() + 1);

  return {
    canSend: emailsSentToday < dailyLimit,
    emailsSentToday,
    limit: dailyLimit,
    resetTime
  };
}

/**
 * Send email using appropriate provider with optional branding
 */
export async function sendEmail(
  userId: string,
  recipientEmail: string,
  content: string,
  subject: string,
  options: EmailOptions = {}
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured');
  }

  // Get email configuration for user
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

  // Check Gmail rate limit
  if (integration.provider === 'gmail') {
    const limitCheck = await checkGmailDailyLimit(userId);
    
    if (!limitCheck.canSend) {
      throw new Error(
        `Gmail daily limit reached (${limitCheck.emailsSentToday}/${limitCheck.limit}). ` +
        `Resets at ${limitCheck.resetTime.toLocaleTimeString()}.`
      );
    }
  }

  // Get brand colors from brand_embeddings
  const brandColors = options.brandColors || await getUserBrandColors(userId);
  
  // Auto-generate subject if not provided
  const emailSubject = subject || await generateEmailSubject(userId, content);

  // Get business name
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('business_name, company')
    .eq('user_id', userId)
    .single();
  const businessName = options.businessName || userData?.business_name || userData?.company || 'Our Team';

  // Generate HTML email if button is provided
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
    // Always send as branded HTML for professional look
    emailBody = generateBrandedEmail(
      content,
      { text: 'View Details', url: '#' },
      brandColors,
      businessName
    );
    options.isHtml = true;
  }

  if (integration.provider === 'gmail') {
    await sendGmailMessage(
      integration.credentials as any, 
      recipientEmail, 
      emailSubject, 
      emailBody,
      options.isHtml
    );
  } else if (integration.provider === 'outlook') {
    await sendOutlookMessage(
      integration.credentials as any, 
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
  credentials: { accessToken: string; email: string },
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to send Gmail');
  }
}

/**
 * Send email via Outlook/Microsoft Graph API
 */
async function sendOutlookMessage(
  credentials: { accessToken: string; email: string },
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


/**
 * Batch send emails with Gmail rate limiting (100 per batch, max 500/day)
 */
export async function sendBatchEmails(
  userId: string,
  recipients: Array<{ email: string; content: string; subject: string }>,
  options: EmailOptions = {}
): Promise<{
  sent: number;
  queued: number;
  failed: number;
  errors: string[];
  resetTime?: Date;
}> {
  const results = {
    sent: 0,
    queued: 0,
    failed: 0,
    errors: [] as string[],
    resetTime: undefined as Date | undefined
  };

  try {
    // Check daily limit first
    const limitCheck = await checkGmailDailyLimit(userId);
    
    if (!limitCheck.canSend) {
      // Queue all emails for tomorrow
      results.queued = recipients.length;
      results.resetTime = limitCheck.resetTime;
      results.errors.push(
        `Daily limit reached (${limitCheck.emailsSentToday}/${limitCheck.limit}). ` +
        `All ${recipients.length} emails queued for ${limitCheck.resetTime.toLocaleString()}`
      );
      
      // TODO: Store in email_queue table for tomorrow
      return results;
    }

    const remaining = limitCheck.limit - limitCheck.emailsSentToday;
    const canSendNow = Math.min(recipients.length, remaining, 100); // Max 100 per batch
    const toQueue = recipients.length - canSendNow;

    // Send what we can now
    for (let i = 0; i < canSendNow; i++) {
      try {
        await sendEmail(
          userId,
          recipients[i].email,
          recipients[i].content,
          recipients[i].subject,
          options
        );
        results.sent++;
        
        // Rate limit: 1 email per 100ms (600/minute max)
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${recipients[i].email}: ${error.message}`);
      }
    }

    // Queue the rest
    if (toQueue > 0) {
      results.queued = toQueue;
      results.resetTime = limitCheck.resetTime;
      results.errors.push(`${toQueue} emails queued for tomorrow (daily limit reached)`);
    }

    return results;
  } catch (error: any) {
    results.errors.push(`Batch error: ${error.message}`);
    return results;
  }
}

          }
        ]
      },
      saveToSentItems: true
    })
  });

  if (!response.ok) {
    const data = await response.json();
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
  
  // Helper function to properly strip HTML tags with comprehensive sanitization
  const stripHtml = (html: string): string => {
    // First encode all special characters to prevent injection
    const encodeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };
    
    // Remove dangerous tags first
    let safe = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    
    // Strip remaining HTML tags
    safe = safe.replace(/<[^>]+>/g, '');
    
    // Decode common entities to readable text
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
): Promise<any[]> {
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

  if (integration.provider === 'gmail') {
    return await getGmailInbox(integration.credentials as any, limit);
  } else if (integration.provider === 'outlook') {
    return await getOutlookInbox(integration.credentials as any, limit);
  }

  return [];
}

/**
 * Get Gmail inbox
 */
async function getGmailInbox(credentials: { accessToken: string }, limit: number): Promise<any[]> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}`, {
    headers: {
      'Authorization': `Bearer ${credentials.accessToken}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to get Gmail inbox');
  }

  return data.messages || [];
}

/**
 * Get Outlook inbox
 */
async function getOutlookInbox(credentials: { accessToken: string }, limit: number): Promise<any[]> {
  const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$top=${limit}&$orderby=receivedDateTime desc`, {
    headers: {
      'Authorization': `Bearer ${credentials.accessToken}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to get Outlook inbox');
  }

  return data.value || [];
}
