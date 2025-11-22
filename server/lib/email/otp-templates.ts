/*
 * Premium OTP Email Templates
 * 
 * Professional, branded OTP email templates with:
 * - Dark theme for modern look
 * - High visual hierarchy
 * - Clear trust indicators
 * - Mobile responsive
 */

interface OTPEmailOptions {
  code: string;
  companyName: string;
  userEmail: string;
  expiryMinutes?: number;
  logoUrl?: string;
  brandColor?: string;
}

/**
 * Premium branded OTP email template
 */
export function generateOTPEmail(options: OTPEmailOptions): string {
  const {
    code,
    companyName,
    userEmail,
    expiryMinutes = 10,
    logoUrl,
    brandColor = '#00D9FF'
  } = options;

  const darkBg = '#0F172A';
  const cardBg = '#1E293B';
  const textPrimary = '#F1F5F9';
  const textSecondary = '#CBD5E1';
  const accentColor = brandColor;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OTP Code</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${darkBg};
      color: ${textPrimary};
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background-color: ${cardBg};
      border-radius: 12px;
      padding: 40px;
      margin: 20px 0;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      height: 40px;
      margin-bottom: 20px;
    }
    .logo img {
      height: 100%;
      width: auto;
    }
    h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 10px;
      color: ${textPrimary};
    }
    .subtitle {
      color: ${textSecondary};
      font-size: 14px;
    }
    .otp-section {
      background: linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 100%);
      border: 2px solid ${accentColor};
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-label {
      color: ${textSecondary};
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }
    .otp-code {
      font-size: 48px;
      font-weight: 700;
      letter-spacing: 8px;
      color: ${accentColor};
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      margin: 15px 0;
      user-select: all;
    }
    .otp-expiry {
      color: ${textSecondary};
      font-size: 13px;
      margin-top: 12px;
    }
    .warning {
      background-color: rgba(244, 63, 94, 0.1);
      border-left: 4px solid #F03F5E;
      padding: 15px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .warning-title {
      color: #F03F5E;
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .warning-text {
      color: ${textSecondary};
      font-size: 13px;
    }
    .info-box {
      background-color: rgba(0, 217, 255, 0.05);
      border: 1px solid rgba(0, 217, 255, 0.2);
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-title {
      color: ${accentColor};
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .info-text {
      color: ${textSecondary};
      font-size: 13px;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .footer-text {
      color: ${textSecondary};
      font-size: 12px;
      line-height: 1.8;
    }
    .footer-link {
      color: ${accentColor};
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: rgba(255,255,255,0.1);
      margin: 30px 0;
    }
    .trust-badge {
      text-align: center;
      margin: 20px 0;
      font-size: 11px;
      color: ${textSecondary};
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .badge-icon {
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="${companyName}" /></div>` : ''}
        <h1>Verify Your Identity</h1>
        <p class="subtitle">Enter this code to sign in to ${companyName}</p>
      </div>

      <div class="otp-section">
        <div class="otp-label">Your verification code</div>
        <div class="otp-code">${code}</div>
        <div class="otp-expiry">
          ⏱️ This code expires in ${expiryMinutes} minutes
        </div>
      </div>

      <div class="info-box">
        <div class="info-title">💡 What's next?</div>
        <div class="info-text">
          Enter this 6-digit code in your ${companyName} app or website. Do not share this code with anyone.
        </div>
      </div>

      <div class="warning">
        <div class="warning-title">🔒 Security Notice</div>
        <div class="warning-text">
          We will never ask you to share this code. If you did not request this code, please ignore this email or change your password immediately.
        </div>
      </div>

      <div class="divider"></div>

      <div class="footer">
        <div class="trust-badge">
          <span class="badge-icon">✓</span>
          <span>${companyName} Account • ${userEmail}</span>
        </div>
        <div class="footer-text">
          <p style="margin-bottom: 8px;">This is an automated message. Please do not reply.</p>
          <p>
            <a href="#" class="footer-link">Account Security</a> • 
            <a href="#" class="footer-link">Help Center</a> • 
            <a href="#" class="footer-link">Report Abuse</a>
          </p>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px; color: ${textSecondary}; font-size: 11px;">
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate plaintext version for fallback
 */
export function generateOTPPlaintext(options: OTPEmailOptions): string {
  const { code, companyName, expiryMinutes = 10, userEmail } = options;

  return `Your ${companyName} Verification Code

Verification Code: ${code}

This code expires in ${expiryMinutes} minutes.

---

SECURITY NOTICE:
We will never ask you to share this code. If you did not request this code, please change your password immediately.

Account: ${userEmail}

This is an automated message. Please do not reply.

© ${new Date().getFullYear()} ${companyName}
`;
}

/**
 * Generate alternate minimal OTP template
 */
export function generateOTPMinimal(options: OTPEmailOptions): string {
  const { code, companyName, expiryMinutes = 10 } = options;

  const accentColor = options.brandColor || '#00D9FF';
  const darkBg = '#0F172A';
  const cardBg = '#1E293B';
  const textPrimary = '#F1F5F9';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="background-color: ${darkBg}; color: ${textPrimary}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: ${cardBg}; border-radius: 8px; padding: 40px; text-align: center;">
    <h2 style="margin: 0 0 10px 0; font-size: 24px;">Verification Code</h2>
    <p style="margin: 0 0 30px 0; color: #94A3B8; font-size: 14px;">Sign in to ${companyName}</p>
    
    <div style="background-color: rgba(0,217,255,0.1); border: 2px solid ${accentColor}; border-radius: 8px; padding: 30px; margin: 30px 0;">
      <div style="font-size: 44px; font-weight: bold; letter-spacing: 4px; color: ${accentColor}; font-family: monospace; margin-bottom: 15px;">${code}</div>
      <div style="color: #94A3B8; font-size: 12px;">Expires in ${expiryMinutes} minutes</div>
    </div>

    <p style="margin: 20px 0; color: #94A3B8; font-size: 13px; line-height: 1.6;">
      Do not share this code with anyone. ${companyName} will never ask for it.
    </p>
  </div>
</body>
</html>
`;
}
