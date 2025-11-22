/*
 * Day-aware email sequence generation
 * 
 * The AI should know:
 * - What day of the campaign it is (Day 0, 1, 2, 5, 7)
 * - What was said in previous emails
 * - Whether they opened/clicked the previous email
 * - Their engagement level (hot/warm/cold)
 * 
 * This allows personalized, context-aware follow-ups that feel human
 */

export interface DayAwareContext {
  campaignDay: number;
  previousMessages: Array<{
    sentAt: Date;
    body: string;
    opened?: boolean;
    clicked?: boolean;
  }>;
  leadEngagement: 'hot' | 'warm' | 'cold';
  leadName: string;
  brandName: string;
  userSenderName?: string;
  lastReplyTime?: Date;
}

export class DayAwareSequence {
  /**
   * Generate email subject based on campaign day and engagement
   * 
   * Day 0: Hook/value proposition
   * Day 1: Light follow-up (not demanding)
   * Day 2: Push benefit
   * Day 5: Soft check-in
   * Day 7: Final close
   */
  static generateSubjectLine(context: DayAwareContext): string {
    const { campaignDay, leadName, brandName, leadEngagement } = context;

    const subjects: Record<number, Record<string, string[]>> = {
      0: {
        hot: [
          `Quick question for ${leadName}`,
          `${brandName} insight for you`,
          `Thought of you regarding...`,
        ],
        warm: [
          `Following up on earlier`,
          `Quick thing for ${leadName}`,
          `Revisiting our conversation`,
        ],
        cold: [
          `Check this out`,
          `One thing ${leadName} should see`,
          `Relevant to your work`,
        ],
      },
      1: {
        hot: [
          `Re: [previous subject] - missed this`,
          `${leadName}, didn't see your reply yet but...`,
          `One more thing...`,
        ],
        warm: [
          `Circling back - was wondering...`,
          `Hope this didn't get lost`,
          `Trying again...`,
        ],
        cold: [
          `Didn't catch your reply - sending again`,
          `Following up once more`,
          `Last attempt...`,
        ],
      },
      2: {
        hot: [
          `Quick follow-up - ${leadName}`,
          `Still relevant...`,
          `Wanted to make sure this landed`,
        ],
        warm: [
          `Checking in...`,
          `Final check in`,
          `Last time reaching out`,
        ],
        cold: [
          `One final follow-up`,
          `Last message from me`,
          `Closing the loop`,
        ],
      },
      5: {
        hot: [
          `Saw you were interested - ${brandName}`,
          `Re-checking...`,
          `One thing you missed`,
        ],
        warm: [
          `Still here if you need`,
          `Gentle reminder`,
          `Quick last check`,
        ],
        cold: [
          `Archiving unless...`,
          `Still interested?`,
          `One last thing`,
        ],
      },
      7: {
        hot: [
          `Final: ${leadName}, let's close this`,
          `Last chance - ${brandName}`,
          `Closing this out`,
        ],
        warm: [
          `Closing the loop - ${leadName}`,
          `Last attempt`,
          `Final message`,
        ],
        cold: [
          `Closing out`,
          `Ending outreach`,
          `Archive`,
        ],
      },
    };

    const subjectsForDay = subjects[campaignDay] || subjects[0];
    const subjectsForEngagement = subjectsForDay[leadEngagement] || subjectsForDay['cold'];
    return subjectsForEngagement[Math.floor(Math.random() * subjectsForEngagement.length)];
  }

  /**
   * Generate email body with day-aware context
   * 
   * Knows what was said before, so doesn't repeat
   * Adjusts tone based on campaign progression
   */
  static generateEmailBody(context: DayAwareContext): string {
    const { campaignDay, leadName, brandName, leadEngagement, previousMessages } = context;

    // Get context from previous emails
    const lastMessage = previousMessages[previousMessages.length - 1];
    const wasOpened = lastMessage?.opened;
    const wasClicked = lastMessage?.clicked;

    let body = '';

    switch (campaignDay) {
      case 0:
        // Initial pitch - hook, value, light CTA
        body = `Hi ${leadName},

Quick thought – came across your [work/content/brand] and thought you might find this useful.

[Your unique insight/value prop based on their niche]

Worth a quick chat? 

Thanks,
[Your name]`;
        break;

      case 1:
        // Follow-up 1 - don't repeat, add new angle
        if (wasOpened) {
          body = `Hey ${leadName},

Noticed you opened that last one. Just wanted to add one thing I forgot...

[New angle or social proof]

Let me know if this makes sense.

${context.userSenderName || 'Thanks'}`;
        } else {
          body = `${leadName},

Sending again in case it got lost. The point was [brief value prop].

Curious if this resonates?

${context.userSenderName || 'Thanks'}`;
        }
        break;

      case 2:
        // Follow-up 2 - push benefit, not reminder
        if (wasClicked) {
          body = `${leadName},

Since you checked that out, figured you might also care about [related benefit].

Quick thought – [specific use case relevant to them]

Let me know?

${context.userSenderName || 'Thanks'}`;
        } else {
          body = `${leadName},

Probably bad timing. But the core insight was [1-2 sentences].

Worth revisiting?

${context.userSenderName || 'Thanks'}`;
        }
        break;

      case 5:
        // Soft check-in at day 5
        body = `${leadName},

Haven't heard back, so probably not a fit. But if this is still on your radar, wanted to check in.

Open to a quick chat if timing is better now.

${context.userSenderName || 'Thanks'}`;
        break;

      case 7:
        // Final close
        body = `${leadName},

Last attempt. If this isn't relevant, totally understand and I'll close the loop.

But if you want to talk, [booking link or CTA].

${context.userSenderName || 'All the best'}`;
        break;

      default:
        body = `Hi ${leadName}, reaching out about [your value prop]. Curious if this is relevant.`;
    }

    return body;
  }

  /**
   * Build system prompt for day-aware AI responses
   */
  static buildSystemPrompt(context: DayAwareContext): string {
    return `You are an AI email copywriter for ${context.brandName}. 
    
Current campaign context:
- Campaign Day: ${context.campaignDay} of 7
- Lead Name: ${context.leadName}
- Lead Engagement Level: ${context.leadEngagement}
${context.previousMessages.length > 0 ? `- Previous message sent: ${context.previousMessages[context.previousMessages.length - 1].body}` : ''}
${context.previousMessages[context.previousMessages.length - 1]?.opened ? '- Lead OPENED the previous email' : ''}
${context.previousMessages[context.previousMessages.length - 1]?.clicked ? '- Lead CLICKED the previous email' : ''}

Guidelines:
1. DO NOT repeat what was said in previous emails
2. DO adjust tone based on campaign day (urgent on day 7, casual on day 1)
3. DO personalize using their name and context
4. DO keep emails short and punchy (2-3 sentences)
5. DO sound like a real human, not a bot
6. DO include soft CTAs, not pushy ones (except day 7)

Write the email now. Keep it natural and conversational.`;
  }
}

export default DayAwareSequence;
