/* @ts-nocheck */
import crypto from 'crypto';
import { storage } from '../../storage';
import nodemailer from 'nodemailer';

interface EmailOTPSession {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
}

const emailOTPSessions = new Map<string, EmailOTPSession>();

export class TwilioEmailOTP {
  private emailFrom: string;
  private transporter: any = null;

  constructor() {
    this.emailFrom = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com';
    this.initTransporter();
  }

  private initTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('⚠️  SMTP not configured. Set: SMTP_HOST, SMTP_USER, SMTP_PASS');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  isConfigured(): boolean {
    return !!this.transporter;
  }

  /**
   * Generate and send OTP via email using SMTP
   */
  async sendEmailOTP(email: string): Promise<{ success: boolean; error?: string }> {
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
        const error = 'SMTP not configured. Required: SMTP_HOST, SMTP_USER, SMTP_PASS';
        console.error(`❌ OTP ERROR: ${error}`);
        return { success: false, error };
      }

      console.log(`📧 Sending OTP to: ${email} from: ${this.emailFrom}`);
      
      const result = await this.transporter.sendMail({
        from: `"Audnix AI" <${this.emailFrom}>`,
        to: email,
        subject: `Your Audnix AI Verification Code: ${otp}`,
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f8fc;margin:0;padding:0}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden}
.header{background:linear-gradient(135deg,#1B1F3A 0%,#2D3548 100%);padding:30px 24px;text-align:center}
.logo-text{color:#fff;font-size:24px;font-weight:700;margin-top:12px}
.tagline{color:#B4B8FF;font-size:13px;margin-top:4px;font-weight:500}
.content{padding:40px 24px}
.greeting{font-size:16px;color:#0E0E0E;margin-bottom:8px;font-weight:600;letter-spacing:-0.3px}
.intro{font-size:14px;color:#4A5A7A;margin-bottom:32px;line-height:1.8;font-weight:500}
.otp-section{background:#f7f8fc;border-left:4px solid #06B6D4;padding:24px;border-radius:4px;margin:32px 0;text-align:center}
.otp-label{font-size:11px;color:#4A5A7A;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;margin-bottom:12px;display:block}
.otp-code{font-size:42px;font-weight:700;color:#1B1F3A;letter-spacing:6px;font-family:'Monaco',monospace;word-spacing:12px}
.footer{background:#fafbfc;padding:24px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#7A8FA3}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<div class="logo-text">Audnix AI</div>
<div class="tagline">Your AI Sales Closer</div>
</div>
<div class="content">
<p class="greeting">Verify your email</p>
<p class="intro">Your 6-digit verification code is below. This code expires in 10 minutes.</p>
<div class="otp-section">
<span class="otp-label">Your Verification Code</span>
<div class="otp-code">${otp}</div>
</div>
</div>
<div class="footer">
<p>Do not share this code with anyone. Audnix AI will never ask for your code.</p>
</div>
</div>
</body>
</html>`,
        text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
      });

      console.log(`✅ OTP sent to ${email} (Message ID: ${result.messageId})`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ OTP send failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyEmailOTP(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionKey = email.toLowerCase();
      const session = emailOTPSessions.get(sessionKey);

      if (!session) {
        return { success: false, error: 'No OTP found for this email' };
      }

      if (new Date() > session.expiresAt) {
        emailOTPSessions.delete(sessionKey);
        return { success: false, error: 'OTP has expired' };
      }

      if (session.attempts >= 5) {
        emailOTPSessions.delete(sessionKey);
        return { success: false, error: 'Too many attempts' };
      }

      if (code !== session.otp) {
        session.attempts++;
        return { success: false, error: 'Invalid OTP code' };
      }

      session.verified = true;
      emailOTPSessions.delete(sessionKey);

      console.log(`✅ OTP verified for ${email}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
