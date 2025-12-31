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
 * Format a message with ManyChat-style button link
 * Clean, branded, professional appearance
 */
export function formatDMWithButton(message: string, button: DMButton): string {
  const buttonText = button.text.toUpperCase();
  const buttonLine = `╔═══════════════════════╗`;
  const buttonContent = `║  🔗 ${buttonText}  ║`;
  const buttonBottom = `╚═══════════════════════╝`;
  
  return `${message}\n\n${buttonLine}\n${buttonContent}\n${buttonBottom}\n\n👆 ${button.url}`;
}

/**
 * Format DM with multiple button options (ManyChat style)
 */
export function formatDMWithButtons(message: string, buttons: DMButton[]): string {
  const formattedButtons = buttons.slice(0, 3).map((btn, i) => {
    const emoji = i === 0 ? '🔥' : i === 1 ? '✨' : '💡';
    return `${emoji} ${btn.text}: ${btn.url}`;
  }).join('\n');
  
  return `${message}\n\n━━━━━━━━━━━━━━━━━━━\n${formattedButtons}\n━━━━━━━━━━━━━━━━━━━\n\n👆 Tap a link above to continue`;
}

/**
 * Format short comment reply (emoji + quick message)
 */
export function formatCommentReply(intent: string): string {
  const replies: Record<string, string[]> = {
    'link': ['🔥 Sent!', '✨ Check DMs!', '📩 Just DMd you!', '🚀 In your DMs!'],
    'info': ['📩 DMd you!', '✨ Check inbox!', '💬 Sent details!'],
    'offer': ['🎁 Sending now!', '✨ Check DMs!', '🔥 Just sent!'],
    'product': ['📦 DMd you!', '✨ Check inbox!', '💫 Sent info!'],
    'general': ['👍 DMd you!', '✨ Check DMs!', '💬 Sent!']
  };
  
  const options = replies[intent] || replies['general'];
  return options[Math.floor(Math.random() * options.length)];
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
 * Escape HTML entities to prevent XSS attacks
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate URL scheme to prevent XSS via javascript: URLs
 */
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
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
  
  if (!isValidUrl(button.url)) {
    throw new Error('Invalid button URL: only HTTP and HTTPS protocols are allowed');
  }
  
  const sanitizedMessage = message.split('\n').map(p => `<p>${escapeHtml(p)}</p>`).join('');
  const sanitizedBusinessName = escapeHtml(businessName);
  const sanitizedButtonText = escapeHtml(button.text);
  const sanitizedButtonUrl = escapeHtml(button.url);
  
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
      <h1>${sanitizedBusinessName}</h1>
    </div>
    <div class="content">
      ${sanitizedMessage}
      <center>
        <a href="${sanitizedButtonUrl}" class="button">${sanitizedButtonText.toUpperCase()}</a>
      </center>
    </div>
    <div class="footer">
      <p>Sent with care by ${sanitizedBusinessName}</p>
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
