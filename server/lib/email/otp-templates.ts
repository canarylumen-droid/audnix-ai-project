interface OTPEmailOptions {
  code: string;
  companyName: string;
  userEmail: string;
  expiryMinutes?: number;
  logoUrl?: string;
  brandColor?: string;
}

export function generateOTPEmail(options: OTPEmailOptions): string {
  const {
    code,
    companyName,
    expiryMinutes = 10,
    brandColor = '#00D9FF'
  } = options;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px;">
  <div style="max-width: 400px; margin: 0 auto; text-align: center;">
    <h2 style="color: #F1F5F9; font-size: 20px; font-weight: 600; margin: 0 0 24px 0;">Your Verification Code</h2>
    
    <div style="background-color: #1E293B; border-radius: 8px; padding: 32px; border: 1px solid ${brandColor}40;">
      <div style="font-size: 36px; font-weight: 700; letter-spacing: 6px; color: ${brandColor}; font-family: 'Monaco', 'Menlo', monospace;">${code}</div>
      <div style="color: #94A3B8; font-size: 13px; margin-top: 16px;">Expires in ${expiryMinutes} minutes</div>
    </div>

    <p style="color: #64748B; font-size: 12px; margin-top: 24px; line-height: 1.5;">
      Never share this code. ${companyName} will never ask for it.
    </p>
  </div>
</body>
</html>
`;
}

export function generateOTPPlaintext(options: OTPEmailOptions): string {
  const { code, companyName, expiryMinutes = 10 } = options;

  return `Your ${companyName} Verification Code: ${code}

This code expires in ${expiryMinutes} minutes.

Never share this code with anyone.`;
}

export function generateOTPMinimal(options: OTPEmailOptions): string {
  return generateOTPEmail(options);
}
