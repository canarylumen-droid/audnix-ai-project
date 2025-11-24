/* @ts-nocheck */
import crypto from 'crypto';
import { storage } from '../../storage';

interface EmailOTPSession {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
}

const emailOTPSessions = new Map<string, EmailOTPSession>();

export class TwilioEmailOTP {
  private accountSid: string;
  private authToken: string;
  private emailFrom: string;
  private sendgridApiKey: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.emailFrom = process.env.TWILIO_EMAIL_FROM || 'auth@audnixai.com';
    this.sendgridApiKey = process.env.TWILIO_SENDGRID_API_KEY || '';
  }

  isConfigured(): boolean {
    const hasValidAccountSid = this.accountSid && this.accountSid.startsWith('AC');
    return !!(hasValidAccountSid && this.authToken && this.sendgridApiKey);
  }

  /**
   * Generate and send OTP via email using Twilio SendGrid
   * Falls back to development mode if credentials are not configured
   */
  async sendEmailOTP(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();

      // Store session
      const sessionKey = email.toLowerCase();
      emailOTPSessions.set(sessionKey, {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        verified: false,
        attempts: 0,
      });

      // Development/Mock mode if credentials not configured
      if (!this.isConfigured()) {
        console.warn(`⚠️  DEVELOPMENT MODE: OTP for ${email}: ${otp}`);
        return { success: true };
      }

      // Send via Twilio SendGrid API
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email }],
              subject: `Audnix AI - Your Verification Code: ${otp}`,
            },
          ],
          from: { email: this.emailFrom, name: 'Audnix AI' },
          content: [
            {
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #06B6D4;">Audnix AI - Verification Code</h2>
                  <p>Your verification code is:</p>
                  <h1 style="color: #06B6D4; font-size: 48px; letter-spacing: 5px; margin: 20px 0;">${otp}</h1>
                  <p style="color: #666;">This code expires in 10 minutes.</p>
                  <p style="color: #999; font-size: 12px;">Never share this code with anyone.</p>
                </div>
              `,
            },
          ],
          reply_to: { email: this.emailFrom }, // Use configured email for replies
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid error:', error);
        return { success: false, error: 'Failed to send OTP email' };
      }

      console.log(`✅ OTP email sent to ${email}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error sending email OTP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify OTP from email
   */
  async verifyEmailOTP(email: string, otp: string): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      const sessionKey = email.toLowerCase();
      const session = emailOTPSessions.get(sessionKey);

      if (!session) {
        return { success: false, error: 'OTP request not found. Request a new code.' };
      }

      if (new Date() > session.expiresAt) {
        emailOTPSessions.delete(sessionKey);
        return { success: false, error: 'OTP expired. Request a new code.' };
      }

      session.attempts += 1;
      if (session.attempts > 5) {
        emailOTPSessions.delete(sessionKey);
        return { success: false, error: 'Too many attempts. Request a new code.' };
      }

      if (session.otp !== otp) {
        return { success: false, error: 'Invalid OTP. Please try again.' };
      }

      // Mark verified
      session.verified = true;
      emailOTPSessions.delete(sessionKey);

      return { success: true };
    } catch (error: any) {
      console.error('Error verifying email OTP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if OTP was verified (for login flow)
   */
  isOTPVerified(email: string): boolean {
    const sessionKey = email.toLowerCase();
    const session = emailOTPSessions.get(sessionKey);
    return session?.verified || false;
  }

  /**
   * Resend OTP
   */
  async resendEmailOTP(email: string): Promise<{ success: boolean; error?: string }> {
    const sessionKey = email.toLowerCase();
    emailOTPSessions.delete(sessionKey);
    return this.sendEmailOTP(email);
  }
}

export const twilioEmailOTP = new TwilioEmailOTP();
