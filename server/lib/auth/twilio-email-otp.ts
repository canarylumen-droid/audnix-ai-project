import crypto from 'crypto';
import { SendGridDiagnostic } from './sendgrid-diagnostic.js';
import type { OTPVerificationResult } from '@shared/types';

interface EmailOTPSession {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
}

interface OTPSendResult {
  success: boolean;
  error?: string;
}

interface SendGridErrorResponse {
  errors?: Array<{ message?: string }>;
}

const emailOTPSessions = new Map<string, EmailOTPSession>();

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

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
    const isFullyConfigured = !!this.sendgridApiKey;
    
    if (!isFullyConfigured) {
      console.error(`❌ SendGrid OTP not configured. Missing: TWILIO_SENDGRID_API_KEY`);
    }
    
    return isFullyConfigured;
  }

  async sendEmailOTP(email: string): Promise<OTPSendResult> {
    try {
      const otp = crypto.randomInt(100000, 999999).toString();

      const sessionKey = email.toLowerCase();
      emailOTPSessions.set(sessionKey, {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
        attempts: 0,
      });

      if (!this.isConfigured()) {
        const error = 'SendGrid API not configured. Required: TWILIO_SENDGRID_API_KEY';
        console.error(`❌ OTP ERROR: ${error}`);
        return { success: false, error };
      }

      console.log(`📧 Sending OTP to: ${email} from: ${this.emailFrom}`);
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
              subject: `Your Audnix AI Verification Code: ${otp}`,
            },
          ],
          from: { email: this.emailFrom, name: 'Audnix AI' },
          content: [
            {
              type: 'text/html',
              value: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f8fc;margin:0;padding:0}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,#1B1F3A 0%,#2D3548 100%);padding:30px 24px;text-align:center}
.logo{width:100%;max-width:200px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center}
.logo img{width:100%;max-width:180px;height:auto}
.logo-text{color:#fff;font-size:24px;font-weight:700;margin-top:12px}
.tagline{color:#B4B8FF;font-size:13px;margin-top:4px;font-weight:500}
.content{padding:40px 24px}
.greeting{font-size:16px;color:#0E0E0E;margin-bottom:8px;font-weight:600;letter-spacing:-0.3px}
.intro{font-size:14px;color:#4A5A7A;margin-bottom:32px;line-height:1.8;font-weight:500}
.otp-section{background:#f7f8fc;border-left:4px solid #06B6D4;padding:24px;border-radius:4px;margin:32px 0;text-align:center}
.otp-label{font-size:11px;color:#4A5A7A;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;margin-bottom:12px;display:block}
.otp-code{font-size:42px;font-weight:700;color:#1B1F3A;letter-spacing:6px;font-family:'Monaco',monospace;word-spacing:12px}
.expiration{font-size:12px;color:#7A8FA3;margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb}
.security-note{background:#f0f4ff;padding:16px 24px;border-radius:4px;border-left:3px solid #06B6D4;margin:24px 0}
.security-note p{font-size:13px;color:#4A5A7A;margin:0}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7A8FA3}
.footer p{margin:8px 0}
.footer a{color:#06B6D4;text-decoration:none;font-weight:500}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<div class="logo">
<img src="https://audnixai.com/logo.png" alt="Audnix AI" style="max-width:160px">
</div>
<div class="tagline">Your AI Sales Closer</div>
</div>
<div class="content">
<p class="greeting">Verify your email</p>
<p class="intro">Your 6-digit verification code is below. This code expires in 10 minutes.</p>
<div class="otp-section">
<span class="otp-label">Your Verification Code</span>
<div class="otp-code">${otp}</div>
<p class="expiration">Valid for 10 minutes</p>
</div>
<div class="security-note">
<p><strong>🔒 Keep this code private.</strong> Audnix support will never ask for your verification code.</p>
</div>
</div>
<div class="footer">
<p><strong>Didn't request this?</strong> You can safely ignore this email.</p>
<p>© 2025 Audnix AI — Automate Revenue</p>
<p><a href="https://audnixai.com">audnixai.com</a></p>
</div>
</div>
</body>
</html>`,
            },
          ],
          reply_to: { email: this.emailFrom },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const statusCode = response.status;
        console.error(`❌ SendGrid API Error [${statusCode}]: ${errorText}`);
        
        let errorMsg = 'Failed to send OTP email';
        try {
          const errorJson: SendGridErrorResponse = JSON.parse(errorText);
          if (errorJson.errors?.[0]?.message) {
            errorMsg = errorJson.errors[0].message;
          }
        } catch {
          // Keep default error message
        }
        
        return { success: false, error: errorMsg };
      }

      console.log(`✅ OTP email sent to ${email}`);
      return { success: true };
    } catch (error: unknown) {
      console.error('Error sending email OTP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async verifyEmailOTP(email: string, otp: string): Promise<OTPVerificationResult> {
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
      const maxAttempts = 5;
      const remainingAttempts = maxAttempts - session.attempts;
      
      if (session.attempts > maxAttempts) {
        emailOTPSessions.delete(sessionKey);
        return { success: false, error: 'Too many attempts. Request a new code.', remainingAttempts: 0 };
      }

      if (session.otp !== otp) {
        return { 
          success: false, 
          error: 'Invalid OTP. Please try again.',
          remainingAttempts,
          expiresAt: session.expiresAt
        };
      }

      session.verified = true;
      emailOTPSessions.delete(sessionKey);

      return { success: true };
    } catch (error: unknown) {
      console.error('Error verifying email OTP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  isOTPVerified(email: string): boolean {
    const sessionKey = email.toLowerCase();
    const session = emailOTPSessions.get(sessionKey);
    return session?.verified ?? false;
  }

  async resendEmailOTP(email: string): Promise<OTPSendResult> {
    const sessionKey = email.toLowerCase();
    emailOTPSessions.delete(sessionKey);
    return this.sendEmailOTP(email);
  }
}

export const twilioEmailOTP = new TwilioEmailOTP();

if (process.env.NODE_ENV === 'development') {
  SendGridDiagnostic.diagnose().catch(console.error);
}
