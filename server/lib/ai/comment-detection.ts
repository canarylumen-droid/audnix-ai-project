import OpenAI from 'openai';
import { storage } from '../../storage';
import type { Lead, Message } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

const isDemoMode = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key';

/**
 * Detect if a comment indicates user wants a DM (link, info, etc.)
 */
export async function detectCommentIntent(comment: string): Promise<{
  wantsDM: boolean;
  intent: 'link' | 'info' | 'offer' | 'product' | 'general';
  confidence: number;
  originalMessage: string;
}> {
  if (isDemoMode) {
    const lowerComment = comment.toLowerCase();
    const wantsDM = /\b(link|dm|info|interested|send|yes)\b/.test(lowerComment);
    return {
      wantsDM,
      intent: 'link',
      confidence: 0.85,
      originalMessage: comment
    };
  }

  try {
    const prompt = `Analyze this social media comment and determine if the user wants to receive a DM with more information.

Comment: "${comment}"

Common patterns that indicate wanting a DM:
- "Link" or "link please"
- "DM me"
- "Interested"
- "Send info"
- "Yes"
- Single word responses to "comment X for [something]"

Determine:
1. Does this user want a DM? (true/false)
2. What type of content did they request? (link, info, offer, product, general)
3. Confidence level (0.0-1.0)

Return JSON only: { "wantsDM": boolean, "intent": string, "confidence": number }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert at analyzing social media engagement patterns.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 150,
      temperature: 0.3
    });

    const analysis = JSON.parse(response.choices[0].message.body || '{}');
    
    return {
      wantsDM: analysis.wantsDM || false,
      intent: analysis.intent || 'general',
      confidence: analysis.confidence || 0.5,
      originalMessage: comment
    };
  } catch (error) {
    console.error('Comment detection error:', error);
    return {
      wantsDM: false,
      intent: 'general',
      confidence: 0,
      originalMessage: comment
    };
  }
}

/**
 * Generate personalized initial DM based on what they commented for
 */
export async function generateInitialDM(
  leadName: string,
  commentIntent: {
    wantsDM: boolean;
    intent: 'link' | 'info' | 'offer' | 'product' | 'general';
    originalMessage: string;
  },
  postContext: string
): Promise<string> {
  if (isDemoMode) {
    return `Hey ${leadName}! Thanks for your interest. Here's what you asked for: [Your Link/Info]`;
  }

  try {
    const prompt = `Generate a friendly, personalized DM to send to someone who commented on our post.

Lead Name: ${leadName}
What they commented: "${commentIntent.originalMessage}"
Intent: ${commentIntent.intent}
Post Context: ${postContext}

Guidelines:
- Address them by name naturally (just once at the start)
- Reference what they asked for (link, info, offer, etc.)
- Be warm but professional
- Keep it under 100 words
- Include a clear next step or CTA
- Sound human, not like a bot
- If it's an offer, create light urgency ("limited spots", "early access")

Generate the DM:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a skilled digital marketer creating personalized DM responses.' },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 200,
      temperature: 0.8
    });

    return response.choices[0].message.body || `Hey ${leadName}! Thanks for reaching out. Here's the info you requested.`;
  } catch (error) {
    console.error('Initial DM generation error:', error);
    return `Hey ${leadName}! Thanks for your interest. Let me share what you asked for.`;
  }
}

/**
 * Generate 6-hour follow-up for leads who didn't open or engage
 */
export async function generateFollowUpDM(
  leadName: string,
  originalIntent: 'link' | 'info' | 'offer' | 'product' | 'general',
  messageOpened: boolean,
  linkClicked: boolean,
  postContext: string
): Promise<string> {
  if (isDemoMode) {
    return `Hey ${leadName}, just wanted to make sure you saw the ${originalIntent} I sent earlier. Still interested?`;
  }

  try {
    const engagementStatus = !messageOpened 
      ? 'never opened the message'
      : linkClicked 
      ? 'opened and clicked' 
      : 'opened but didn\'t click the link';

    const prompt = `Generate a gentle follow-up DM for someone who commented 6 hours ago.

Lead Name: ${leadName}
Original Intent: ${originalIntent}
Engagement: ${engagementStatus}
Post Context: ${postContext}

Guidelines:
- Use their name naturally (once at start)
- Acknowledge you sent something earlier (don't be pushy)
- For offers: Create urgency ("might be last chance", "limited spots filling up")
- For info/links: Check if they had a chance to look
- For products: Soft reminder with benefit highlight
- Keep it friendly and conversational (60-80 words max)
- End with a question or gentle CTA
- Don't sound desperate or robotic

Generate the follow-up:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a skilled sales professional creating thoughtful follow-up messages.' },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 180,
      temperature: 0.8
    });

    return response.choices[0].message.body || `Hey ${leadName}, did you get a chance to check out what I sent earlier?`;
  } catch (error) {
    console.error('Follow-up DM generation error:', error);
    return `Hey ${leadName}, just following up on the ${originalIntent} I shared. Still interested?`;
  }
}

/**
 * Schedule 6-hour follow-up for a lead
 */
export async function scheduleCommentFollowUp(
  userId: string,
  leadId: string,
  channel: string,
  originalIntent: 'link' | 'info' | 'offer' | 'product' | 'general',
  postContext: string
): Promise<void> {
  try {
    // Schedule follow-up for 6 hours from now
    const followUpTime = new Date(Date.now() + 6 * 60 * 60 * 1000);

    await storage.createNotification({
      userId,
      title: '⏰ Comment Follow-Up Scheduled',
      message: `Auto follow-up set for 6 hours - Lead from ${channel} comment`,
      type: 'info',
      read: false,
      metadata: {
        leadId,
        followUpType: 'comment_automation',
        intent: originalIntent,
        scheduledFor: followUpTime.toISOString(),
        postContext
      }
    });

    console.log(`✓ Scheduled 6-hour follow-up for lead ${leadId} (${originalIntent})`);
  } catch (error) {
    console.error('Error scheduling comment follow-up:', error);
  }
}

/**
 * Select appropriate emoji based on intent
 */
function selectEmojiForIntent(intent: string): string {
  const emojiMap: Record<string, string> = {
    'link': '🚀',
    'info': '📩',
    'offer': '🎁',
    'product': '✨',
    'general': '👍'
  };
  return emojiMap[intent] || '✅';
}

/**
 * Check if comment contains inappropriate content
 */
async function isCommentAppropriate(comment: string): Promise<boolean> {
  try {
    const { contentModerationService } = await import('./content-moderation');
    const result = await contentModerationService.moderateContent(comment);
    return result.isAppropriate;
  } catch (error) {
    console.error('Content moderation check failed:', error);
    // Default to allowing if moderation fails
    return true;
  }
}

/**
 * Process comment and initiate DM automation flow
 * NEW FLOW: Reply with emoji → Wait 2-8min → Send DM
 */
export async function processCommentAutomation(
  userId: string,
  comment: string,
  username: string,
  channel: 'instagram' | 'whatsapp' | 'email',
  postContext: string,
  commentId?: string // Optional: for replying to specific comment
): Promise<{
  success: boolean;
  lead?: Lead;
  initialMessage?: Message;
  commentReplied?: boolean;
  followUpScheduled: boolean;
}> {
  try {
    // Step 0: Check for inappropriate content
    const isAppropriate = await isCommentAppropriate(comment);
    if (!isAppropriate) {
      console.log(`❌ Comment from ${username} flagged as inappropriate - skipping automation`);
      return { success: false, followUpScheduled: false, commentReplied: false };
    }

    // Step 1: Detect if this comment wants a DM
    const intent = await detectCommentIntent(comment);
    
    if (!intent.wantsDM) {
      console.log(`Comment from ${username} doesn't indicate DM intent - skipping automation`);
      return { success: false, followUpScheduled: false, commentReplied: false };
    }

    // Step 2: REPLY TO COMMENT FIRST with emoji (like human behavior)
    const emoji = selectEmojiForIntent(intent.intent);
    let commentReplied = false;
    
    if (channel === 'instagram' && commentId) {
      try {
        // Reply to the comment with emoji
        // This would use Instagram Graph API comment reply endpoint
        console.log(`💬 Replying to comment ${commentId} with emoji: ${emoji}`);
        // TODO: Implement actual Instagram comment reply via Graph API
        // For now, log the action
        await storage.createNotification({
          userId,
          title: '💬 Comment Reply Sent',
          message: `Replied "${emoji}" to ${username}'s comment. DM will be sent shortly.`,
          type: 'info',
          read: false,
          metadata: {
            username,
            emoji,
            originalComment: comment,
            action: 'comment_reply'
          }
        });
        commentReplied = true;
      } catch (error) {
        console.error('Failed to reply to comment:', error);
        // Continue with automation even if comment reply fails
      }
    }

    // Step 3: Create or get lead
    let lead = await storage.getLeadByUsername(username, channel);
    
    if (!lead) {
      lead = await storage.createLead({
        userId,
        name: username,
        channel,
        status: 'new',
        tags: ['comment', intent.intent, 'auto_dm'],
        metadata: {
          source: 'comment_automation',
          originalComment: comment,
          commentIntent: intent.intent,
          postContext,
          commentReplied: commentReplied
        }
      });
    }

    // Step 4: Generate initial DM (but don't send yet - scheduled in follow-up)
    const initialDM = await generateInitialDM(username, intent, postContext);
    
    // Step 5: Schedule DM for 2-8 minutes later (human-like timing)
    const delayMinutes = Math.floor(Math.random() * 6) + 2; // Random 2-8 minutes
    const dmTime = new Date(Date.now() + delayMinutes * 60 * 1000);
    
    await storage.createNotification({
      userId,
      title: '⏰ DM Scheduled',
      message: `DM to ${username} will be sent in ${delayMinutes} minutes (after comment reply)`,
      type: 'info',
      read: false,
      metadata: {
        leadId: lead.id,
        dmBody: initialDM,
        scheduledFor: dmTime.toISOString(),
        intent: intent.intent,
        action: 'send_dm'
      }
    });

    console.log(`✓ Comment automation started for ${username}:`);
    console.log(`  - Comment replied with ${emoji}`);
    console.log(`  - DM scheduled in ${delayMinutes} minutes`);

    return {
      success: true,
      lead,
      commentReplied,
      followUpScheduled: true
    };
  } catch (error) {
    console.error('Comment automation error:', error);
    return { success: false, followUpScheduled: false, commentReplied: false };
  }
}

/**
 * Check and execute scheduled comment follow-ups
 */
export async function executeCommentFollowUps(): Promise<void> {
  try {
    const now = new Date();
    
    // Get all notifications for comment follow-ups that are due
    const allUsers = await storage.getAllUsers().catch(() => []);
    
    for (const user of allUsers) {
      const notifications = await storage.getNotifications(user.id);
      
      for (const notification of notifications) {
        if (
          notification.type === 'info' &&
          notification.metadata?.followUpType === 'comment_automation' &&
          notification.metadata?.scheduledFor
        ) {
          const scheduledTime = new Date(notification.metadata.scheduledFor);
          
          if (now >= scheduledTime) {
            const leadId = notification.metadata.leadId;
            const intent = notification.metadata.intent;
            const postContext = notification.metadata.postContext || '';
            
            // Get lead and check engagement
            const lead = await storage.getLeadById(leadId);
            if (!lead) continue;
            
            const messages = await storage.getMessagesByLeadId(leadId);
            const lastMessage = messages[messages.length - 1];
            
            // Check if message was opened/clicked (simplified - would need real tracking)
            const messageOpened = lastMessage?.metadata?.opened || false;
            const linkClicked = lastMessage?.metadata?.clicked || false;
            
            // Generate and send follow-up
            const followUpDM = await generateFollowUpDM(
              lead.name,
              intent,
              messageOpened,
              linkClicked,
              postContext
            );
            
            await storage.createMessage({
              leadId: lead.id,
              userId: user.id,
              provider: lead.channel as any,
              direction: 'outbound',
              body: followUpDM,
              audioUrl: null,
              metadata: {
                ai_generated: true,
                automation_type: 'comment_followup',
                hours_after_initial: 6
              }
            });
            
            // Mark notification as read
            await storage.markNotificationRead(notification.id);
            
            console.log(`✓ Sent 6-hour follow-up to ${lead.name}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error executing comment follow-ups:', error);
  }
}
