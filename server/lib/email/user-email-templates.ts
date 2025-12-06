interface WelcomeEmailOptions {
  userName: string;
  companyName: string;
  dashboardUrl?: string;
  brandColor?: string;
}

interface TrialReminderOptions {
  userName: string;
  companyName: string;
  daysRemaining: number;
  upgradeUrl?: string;
  brandColor?: string;
}

export function generateWelcomeEmail(options: WelcomeEmailOptions): { html: string; text: string } {
  const {
    userName,
    companyName,
    dashboardUrl = 'https://audnixai.com/dashboard',
    brandColor = '#00D9FF'
  } = options;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #F1F5F9; font-size: 24px; font-weight: 700; margin: 0;">${companyName}</h1>
      <p style="color: ${brandColor}; font-size: 14px; margin: 8px 0 0 0;">Your AI Sales Closer</p>
    </div>
    
    <div style="background-color: #1E293B; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
      <h2 style="color: #F1F5F9; font-size: 22px; font-weight: 600; margin: 0 0 16px 0;">Welcome to ${companyName}, ${userName}!</h2>
      
      <p style="color: #94A3B8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        You're now part of the AI-powered sales automation revolution. Your 14-day free trial starts now.
      </p>

      <div style="background-color: #0F172A; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: ${brandColor}; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">WHAT'S INCLUDED:</h3>
        <ul style="color: #CBD5E1; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>AI-powered lead conversations</li>
          <li>Smart follow-up automation</li>
          <li>Multi-channel inbox (Instagram, WhatsApp, Email)</li>
          <li>Real-time sales insights</li>
        </ul>
      </div>

      <a href="${dashboardUrl}" style="display: block; background-color: ${brandColor}; color: #0F172A; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Go to Dashboard
      </a>
    </div>

    <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px; line-height: 1.5;">
      Questions? Just reply to this email - we're here to help.<br>
      ${companyName} Team
    </p>
  </div>
</body>
</html>
`;

  const text = `Welcome to ${companyName}, ${userName}!

You're now part of the AI-powered sales automation revolution. Your 14-day free trial starts now.

WHAT'S INCLUDED:
- AI-powered lead conversations
- Smart follow-up automation
- Multi-channel inbox (Instagram, WhatsApp, Email)
- Real-time sales insights

Get started: ${dashboardUrl}

Questions? Just reply to this email - we're here to help.

${companyName} Team`;

  return { html, text };
}

export function generateTrialReminderEmail(options: TrialReminderOptions): { html: string; text: string } {
  const {
    userName,
    companyName,
    daysRemaining,
    upgradeUrl = 'https://audnixai.com/dashboard/settings?tab=billing',
    brandColor = '#00D9FF'
  } = options;

  const urgencyText = daysRemaining <= 1 
    ? 'Your trial ends tomorrow!' 
    : `Your trial ends in ${daysRemaining} days`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #F1F5F9; font-size: 24px; font-weight: 700; margin: 0;">${companyName}</h1>
    </div>
    
    <div style="background-color: #1E293B; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
      <div style="background-color: #FEF3C7; color: #92400E; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 24px; text-align: center;">
        ${urgencyText}
      </div>

      <h2 style="color: #F1F5F9; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Hi ${userName},</h2>
      
      <p style="color: #94A3B8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        We hope you've been enjoying ${companyName}. Your free trial is ending soon - don't lose access to your AI sales automation.
      </p>

      <div style="background-color: #0F172A; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: ${brandColor}; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">KEEP THESE FEATURES:</h3>
        <ul style="color: #CBD5E1; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Your trained AI sales assistant</li>
          <li>All your connected channels</li>
          <li>Lead data and conversation history</li>
          <li>Automation workflows</li>
        </ul>
      </div>

      <a href="${upgradeUrl}" style="display: block; background-color: ${brandColor}; color: #0F172A; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Upgrade Now
      </a>

      <p style="color: #64748B; font-size: 13px; text-align: center; margin-top: 16px;">
        Questions about pricing? Reply to this email.
      </p>
    </div>

    <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
      ${companyName} Team
    </p>
  </div>
</body>
</html>
`;

  const text = `${urgencyText}

Hi ${userName},

We hope you've been enjoying ${companyName}. Your free trial is ending soon - don't lose access to your AI sales automation.

KEEP THESE FEATURES:
- Your trained AI sales assistant
- All your connected channels
- Lead data and conversation history
- Automation workflows

Upgrade now: ${upgradeUrl}

Questions about pricing? Reply to this email.

${companyName} Team`;

  return { html, text };
}

export function generateTrialExpiredEmail(options: Omit<TrialReminderOptions, 'daysRemaining'>): { html: string; text: string } {
  const {
    userName,
    companyName,
    upgradeUrl = 'https://audnixai.com/dashboard/settings?tab=billing',
    brandColor = '#00D9FF'
  } = options;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #F1F5F9; font-size: 24px; font-weight: 700; margin: 0;">${companyName}</h1>
    </div>
    
    <div style="background-color: #1E293B; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
      <div style="background-color: #FEE2E2; color: #991B1B; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 24px; text-align: center;">
        Your trial has expired
      </div>

      <h2 style="color: #F1F5F9; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Hi ${userName},</h2>
      
      <p style="color: #94A3B8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Your ${companyName} trial period has ended. Your data is safe - upgrade now to continue where you left off.
      </p>

      <a href="${upgradeUrl}" style="display: block; background-color: ${brandColor}; color: #0F172A; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Reactivate My Account
      </a>

      <p style="color: #64748B; font-size: 13px; text-align: center; margin-top: 16px;">
        Need help? Just reply to this email.
      </p>
    </div>

    <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 24px;">
      ${companyName} Team
    </p>
  </div>
</body>
</html>
`;

  const text = `Your trial has expired

Hi ${userName},

Your ${companyName} trial period has ended. Your data is safe - upgrade now to continue where you left off.

Reactivate your account: ${upgradeUrl}

Need help? Just reply to this email.

${companyName} Team`;

  return { html, text };
}
