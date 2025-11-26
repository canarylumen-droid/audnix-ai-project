/**
 * Unified Email Sender for Audnix AI
 * Routes emails to correct SendGrid sender based on email type
 */

export enum EmailSenderType {
  AUTH = 'auth', // auth@audnixai.com - OTP codes
  REMINDERS = 'reminders', // hello@audnixai.com - Welcome, Day 2, Day 3, Winback
  BILLING = 'billing', // billing@audnixai.com - Payments, Invoices
}

export class AudnixEmailSender {
  private static sendgridApiKey = process.env.TWILIO_SENDGRID_API_KEY || '';

  /**
   * Get sender email based on type
   */
  static getSenderEmail(type: EmailSenderType): string {
    switch (type) {
      case EmailSenderType.AUTH:
        return process.env.TWILIO_EMAIL_FROM || 'auth@audnixai.com';
      case EmailSenderType.REMINDERS:
        return process.env.AUDNIX_REMINDER_EMAIL_FROM || 'hello@audnixai.com';
      case EmailSenderType.BILLING:
        return process.env.AUDNIX_BILLING_EMAIL_FROM || 'billing@audnixai.com';
      default:
        return 'noreply@audnixai.com';
    }
  }

  /**
   * Send email via SendGrid
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
      const senderEmail = this.getSenderEmail(options.senderType);
      const senderName = options.senderName || 'Audnix AI';

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: { email: senderEmail, name: senderName },
          content: [
            { type: 'text/html', value: options.html },
            { type: 'text/plain', value: options.text },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ SendGrid error: ${error.errors?.[0]?.message || 'Unknown error'}`);
        return { success: false, error: error.errors?.[0]?.message || 'SendGrid error' };
      }

      console.log(`✅ Email sent to ${options.to} from ${senderEmail}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Email send failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
