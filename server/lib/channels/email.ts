
import { supabaseAdmin } from '../supabase-admin';
import { generateBrandedEmail, generateMeetingEmail, type BrandColors } from '../ai/dm-formatter';

/**
 * Email messaging functions with branded templates
 */

interface EmailConfig {
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  oauth_token?: string;
  provider?: 'gmail' | 'outlook' | 'smtp';
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
 */
export async function sendEmail(
  userId: string,
  recipientEmail: string,
  content: string,
  subject: string,
  options: EmailOptions = {}
): Promise<void> {
  // Get email configuration for user
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

  // Generate HTML email if button is provided
  let emailBody = content;
  if (options.buttonUrl && options.buttonText) {
    if (options.isMeetingInvite) {
      emailBody = generateMeetingEmail(
        content,
        options.buttonUrl,
        options.brandColors,
        options.businessName
      );
    } else {
      emailBody = generateBrandedEmail(
        content,
        { text: options.buttonText, url: options.buttonUrl },
        options.brandColors,
        options.businessName
      );
    }
    options.isHtml = true;
  }

  if (integration.provider === 'gmail') {
    await sendGmailMessage(
      integration.credentials as any, 
      recipientEmail, 
      subject, 
      emailBody,
      options.isHtml
    );
  } else if (integration.provider === 'outlook') {
    await sendOutlookMessage(
      integration.credentials as any, 
      recipientEmail, 
      subject, 
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
    isHtml ? body.replace(/<[^>]*>/g, '') : body,
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
