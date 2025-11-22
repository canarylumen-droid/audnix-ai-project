/* @ts-nocheck */
/**
 * Multi-Provider Email Failover System
 * 
 * Automatically tries multiple email providers in order:
 * 1. Resend (fast, reliable, no setup)
 * 2. Mailgun (bulletproof, industry standard)
 * 3. Custom SMTP (user's own server)
 * 4. Gmail API fallback
 * 5. Outlook API fallback
 */

import { Resend } from 'resend';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { storage } from '../../storage';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface FailoverResult {
  success: boolean;
  provider: string;
  error?: string;
}

class MultiProviderEmailFailover {
  private resend: Resend | null = null;
  private mailgunKey: string | null = null;
  private mailgunDomain: string | null = null;

  constructor() {
    // Initialize Resend if key available
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    // Initialize Mailgun if keys available
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      this.mailgunKey = process.env.MAILGUN_API_KEY;
      this.mailgunDomain = process.env.MAILGUN_DOMAIN;
    }
  }

  /**
   * Send email with automatic failover
   */
  async send(
    email: EmailPayload,
    userId?: string,
    customSmtpConfig?: any
  ): Promise<FailoverResult> {
    const providers: Array<{ name: string; fn: () => Promise<void> }> = [];

    // 1. Try Resend (primary - fastest)
    if (this.resend) {
      providers.push({
        name: 'Resend',
        fn: () => this.sendViaResend(email)
      });
    }

    // 2. Try Mailgun (secondary - bulletproof)
    if (this.mailgunKey && this.mailgunDomain) {
      providers.push({
        name: 'Mailgun',
        fn: () => this.sendViaMailgun(email)
      });
    }

    // 3. Try custom SMTP if configured
    if (customSmtpConfig || userId) {
      providers.push({
        name: 'Custom SMTP',
        fn: () => this.sendViaSMTP(email, customSmtpConfig, userId)
      });
    }

    // 4. Gmail fallback
    if (userId) {
      providers.push({
        name: 'Gmail',
        fn: () => this.sendViaGmail(email, userId)
      });
    }

    // 5. Outlook fallback
    if (userId) {
      providers.push({
        name: 'Outlook',
        fn: () => this.sendViaOutlook(email, userId)
      });
    }

    // Try each provider in order
    for (const provider of providers) {
      try {
        await provider.fn();
        console.log(`✅ Email sent via ${provider.name}: ${email.to}`);
        return { success: true, provider: provider.name };
      } catch (error: any) {
        console.warn(`⚠️ ${provider.name} failed: ${error.message}`);
        // Continue to next provider
      }
    }

    // All providers failed
    const lastError = providers[providers.length - 1];
    return {
      success: false,
      provider: 'none',
      error: `All email providers failed. Last tried: ${lastError?.name || 'unknown'}`
    };
  }

  /**
   * Send via Resend (fastest)
   */
  private async sendViaResend(email: EmailPayload): Promise<void> {
    if (!this.resend) {
      throw new Error('Resend not configured');
    }

    const result = await this.resend.emails.send({
      from: email.from || 'noreply@resend.dev',
      to: email.to,
      subject: email.subject,
      html: email.html,
      replyTo: email.replyTo
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  /**
   * Send via Mailgun (industry standard)
   */
  private async sendViaMailgun(email: EmailPayload): Promise<void> {
    if (!this.mailgunKey || !this.mailgunDomain) {
      throw new Error('Mailgun not configured');
    }

    const form = new FormData();
    form.append('from', email.from || `noreply@${this.mailgunDomain}`);
    form.append('to', email.to);
    form.append('subject', email.subject);
    form.append('html', email.html);
    if (email.replyTo) {
      form.append('h:Reply-To', email.replyTo);
    }

    const response = await fetch(
      `https://api.mailgun.net/v3/${this.mailgunDomain}/messages`,
      {
        method: 'POST',
        auth: `api:${this.mailgunKey}`,
        body: form as any
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mailgun error: ${error.message}`);
    }
  }

  /**
   * Send via custom SMTP
   */
  private async sendViaSMTP(
    email: EmailPayload,
    config?: any,
    userId?: string
  ): Promise<void> {
    let smtpConfig = config;

    // Get SMTP config from user's integration if not provided
    if (!smtpConfig && userId) {
      const integration = await storage.getIntegration(userId, 'custom_email');
      if (integration?.encryptedMeta) {
        const { decrypt } = await import('../crypto/encryption');
        const decrypted = await decrypt(integration.encryptedMeta);
        smtpConfig = JSON.parse(decrypted);
      }
    }

    if (!smtpConfig) {
      throw new Error('SMTP configuration not found');
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: smtpConfig.smtp_port || 587,
      secure: smtpConfig.smtp_port === 465,
      auth: {
        user: smtpConfig.smtp_user,
        pass: smtpConfig.smtp_pass
      }
    });

    const result = await transporter.sendMail({
      from: email.from || smtpConfig.smtp_user,
      to: email.to,
      subject: email.subject,
      html: email.html,
      replyTo: email.replyTo
    });

    if (!result.messageId) {
      throw new Error('SMTP send failed - no message ID returned');
    }
  }

  /**
   * Send via Gmail API
   */
  private async sendViaGmail(email: EmailPayload, userId: string): Promise<void> {
    const integrations = await storage.getIntegrations(userId);
    const gmailIntegration = integrations.find(i => i.provider === 'gmail' && i.connected);

    if (!gmailIntegration?.encryptedMeta) {
      throw new Error('Gmail not configured');
    }

    const { decrypt } = await import('../crypto/encryption');
    const decrypted = await decrypt(gmailIntegration.encryptedMeta);
    const credentials = JSON.parse(decrypted);

    const message = this.createMimeMessage(
      credentials.email,
      email.to,
      email.subject,
      email.html
    );

    const encodedMessage = Buffer.from(message).toString('base64url');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedMessage })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gmail API error');
    }
  }

  /**
   * Send via Outlook API
   */
  private async sendViaOutlook(email: EmailPayload, userId: string): Promise<void> {
    const integrations = await storage.getIntegrations(userId);
    const outlookIntegration = integrations.find(i => i.provider === 'outlook' && i.connected);

    if (!outlookIntegration?.encryptedMeta) {
      throw new Error('Outlook not configured');
    }

    const { decrypt } = await import('../crypto/encryption');
    const decrypted = await decrypt(outlookIntegration.encryptedMeta);
    const credentials = JSON.parse(decrypted);

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          subject: email.subject,
          body: {
            contentType: 'HTML',
            content: email.html
          },
          toRecipients: [{ emailAddress: { address: email.to } }]
        },
        saveToSentItems: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Outlook API error');
    }
  }

  /**
   * Create MIME message for Gmail
   */
  private createMimeMessage(from: string, to: string, subject: string, html: string): string {
    const boundary = `----=_Part_${Date.now()}`;

    return `From: ${from}
To: ${to}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="${boundary}"

--${boundary}
Content-Type: text/plain; charset="UTF-8"

${this.stripHtml(html)}

--${boundary}
Content-Type: text/html; charset="UTF-8"

${html}

--${boundary}--`;
  }

  /**
   * Strip HTML tags from string - use safe method
   */
  private stripHtml(html: string): string {
    // Create a temporary DOM element to safely parse HTML
    const text = html
      // Remove script tags and content
      .replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, '')
      // Remove style tags and content
      .replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>/gi, '')
      // Remove all remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities safely
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');

    return text.trim();
  }
}

export const multiProviderEmailFailover = new MultiProviderEmailFailover();
