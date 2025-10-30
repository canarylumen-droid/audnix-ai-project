
/**
 * Format messages with channel-specific rich formatting
 * Instagram: Visual button-like elements (ManyChat style)
 * WhatsApp: Clean link formatting with context
 * Email: Branded HTML templates with CTA buttons
 */

export interface DMButton {
  text: string;
  url: string;
}

export interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

/**
 * Format a message with a button-like link
 */
export function formatDMWithButton(message: string, button: DMButton): string {
  return `${message}\n\n━━━━━━━━━━━━━━━━━━\n🔗 ${button.text.toUpperCase()}\n${button.url}\n━━━━━━━━━━━━━━━━━━`;
}

/**
 * Format a follow request message
 */
export function formatFollowRequest(message: string): string {
  return `${message}\n\n━━━━━━━━━━━━━━━━━━\n💫 FOLLOW TO STAY CONNECTED\nDo you mind following me so we can stay connected? 🙏\n━━━━━━━━━━━━━━━━━━`;
}

/**
 * Format multiple choice options (max 3 for readability)
 */
export function formatChoiceButtons(message: string, choices: string[]): string {
  const formattedChoices = choices
    .slice(0, 3)
    .map((choice, i) => `${i + 1}️⃣ ${choice.toUpperCase()}`)
    .join('\n');
  
  return `${message}\n\n━━━━━━━━━━━━━━━━━━\n${formattedChoices}\n━━━━━━━━━━━━━━━━━━\n\nReply with the number of your choice`;
}

/**
 * Format WhatsApp message with clean link presentation
 */
export function formatWhatsAppLink(message: string, button: DMButton): string {
  return `${message}\n\n┌─────────────────────┐\n│ 🔗 ${button.text.toUpperCase()} │\n└─────────────────────┘\n\n${button.url}\n\n✨ Tap the link above to get started`;
}

/**
 * Format WhatsApp meeting link with calendar emoji
 */
export function formatWhatsAppMeeting(message: string, calendarLink: string): string {
  return `${message}\n\n┌─────────────────────┐\n│ 📅 SCHEDULE MEETING │\n└─────────────────────┘\n\n${calendarLink}\n\n✓ Pick a time that works for you`;
}

/**
 * Generate branded HTML email template
 */
export function generateBrandedEmail(
  message: string, 
  button: DMButton, 
  brandColors: BrandColors = {},
  businessName: string = 'Our Team'
): string {
  const primaryColor = brandColors.primary || '#6366f1';
  const accentColor = brandColors.accent || '#8b5cf6';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 40px 30px; line-height: 1.6; color: #374151; }
    .button { display: inline-block; padding: 16px 32px; background: ${primaryColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .button:hover { background: ${accentColor}; }
    .footer { padding: 30px; text-align: center; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${businessName}</h1>
    </div>
    <div class="content">
      ${message.split('\n').map(p => `<p>${p}</p>`).join('')}
      <center>
        <a href="${button.url}" class="button">${button.text.toUpperCase()}</a>
      </center>
    </div>
    <div class="footer">
      <p>Sent with care by ${businessName}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate meeting invite email template
 */
export function generateMeetingEmail(
  message: string,
  calendarLink: string,
  brandColors: BrandColors = {},
  businessName: string = 'Our Team'
): string {
  const primaryColor = brandColors.primary || '#6366f1';
  
  return generateBrandedEmail(
    message,
    { text: '📅 Schedule Your Meeting', url: calendarLink },
    brandColors,
    businessName
  );
}
