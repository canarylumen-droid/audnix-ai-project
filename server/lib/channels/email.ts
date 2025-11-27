/* @ts-nocheck */

import { supabaseAdmin } from '../supabase-admin';
import { generateBrandedEmail, generateMeetingEmail, type BrandColors } from '../ai/dm-formatter';
import { storage } from '../../storage';

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
): Promise<any[]> {
  const Imap = require('imap');
  const { simpleParser } = require('mailparser');
  
  // Use explicit IMAP settings if provided, otherwise try to derive from SMTP
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
  // First check for custom email integration (user's own SMTP)
  const customEmailIntegration = await storage.getIntegration(userId, 'custom_email');
  
  if (customEmailIntegration?.connected) {
    // Use user's custom SMTP to send emails
    const { decrypt } = await import('../crypto/encryption');
    const credentialsStr = await decrypt(customEmailIntegration.encryptedMeta!);
    const credentials = JSON.parse(credentialsStr);
    
    // Get brand colors
    const brandColors = options.brandColors || await getUserBrandColors(userId);
    
    // Get user's business name
    const user = await storage.getUser(userId);
    const businessName = options.businessName || user?.businessName || user?.company || 'Our Team';
    
    // Generate branded HTML email
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
    
    // Send via user's custom SMTP
    await sendCustomSMTP(credentials, recipientEmail, subject, emailBody, true);
    console.log(`📧 Email sent via user's SMTP: ${credentials.smtp_user} -> ${recipientEmail}`);
    return;
  }
  
  // Fallback to Supabase Gmail/Outlook if no custom email
  if (!supabaseAdmin) {
    throw new Error('No email provider configured. Please connect your business email in Settings.');
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
    throw new Error('Email not connected. Please connect your business email in Settings.');
  }

  // Get brand colors from brand_embeddings
  const brandColors = options.brandColors || await getUserBrandColors(userId);
  
  // Auto-generate subject if not provided
  const { generateEmailSubject } = await import('./email-subject-generator');
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
  
  // Helper function to safely strip HTML tags
  const stripHtml = (html: string): string => {
    // Remove script tags and content safely
    let safe = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, '');
    // Remove style tags and content safely
    safe = safe.replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>/gi, '');
    // Remove iframe tags and content safely
    safe = safe.replace(/<iframe(?:\s[^>]*)?>[\s\S]*?<\/iframe>/gi, '');
    // Remove all remaining HTML tags
    safe = safe.replace(/<[^>]+>/g, '');
    // Decode HTML entities to readable text (no double encoding)
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
