/**
 * Audnix AI - Email Sender (Generic SMTP)
 * Works with any SMTP server: Gmail, company mail, custom servers
 */

import nodemailer from 'nodemailer';

export enum EmailSenderType {
  AUTH = 'auth',           // OTP
  REMINDERS = 'reminders', // Day 1-3 nurture sequences
  BILLING = 'billing',     // Payment confirmations & invoices
}

export class AudnixEmailSender {
  private static transporter: any = null;

  /**
   * Initialize SMTP transporter on first use
   */
  private static initTransporter() {
    if (this.transporter) return;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('⚠️  SMTP not configured. Set: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log(`✅ SMTP configured: ${smtpUser} @ ${smtpHost}:${smtpPort}`);
  }

  /**
   * Get sender email based on type
   */
  static getSenderEmail(type: EmailSenderType): string {
    const defaultFrom = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com';
    
    switch (type) {
      case EmailSenderType.AUTH:
        return process.env.SMTP_FROM_EMAIL || defaultFrom;
      case EmailSenderType.REMINDERS:
        return process.env.SMTP_FROM_EMAIL || defaultFrom;
      case EmailSenderType.BILLING:
        return process.env.SMTP_FROM_EMAIL || defaultFrom;
      default:
        return defaultFrom;
    }
  }

  /**
   * Send email via SMTP
   */
  static async send(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
    senderType: EmailSenderType;
    senderName?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      this.initTransporter();

      if (!this.transporter) {
        throw new Error('SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS');
      }

      const senderEmail = this.getSenderEmail(options.senderType);
      const senderName = options.senderName || 'Audnix AI';

      const result = await this.transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(`✅ ${options.senderType} email sent to ${options.to} (Message ID: ${result.messageId})`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Email send failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
