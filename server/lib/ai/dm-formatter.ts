
/**
 * Format Instagram DMs with visual "button-like" elements
 * Since Instagram API doesn't support rich buttons, we use visual formatting
 * to create a similar experience like ManyChat
 */

export interface DMButton {
  text: string;
  url: string;
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
