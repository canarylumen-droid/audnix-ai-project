
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

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
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

    return response.choices[0].message.content || `Hey ${leadName}! Thanks for reaching out. Here's the info you requested.`;
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

    return response.choices[0].message.content || `Hey ${leadName}, did you get a chance to check out what I sent earlier?`;
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
 * Process comment and initiate DM automation flow
 */
export async function processCommentAutomation(
  userId: string,
  comment: string,
  username: string,
  channel: 'instagram' | 'whatsapp' | 'email',
  postContext: string
): Promise<{
  success: boolean;
  lead?: Lead;
  initialMessage?: Message;
  followUpScheduled: boolean;
}> {
  try {
    // Step 1: Detect if this comment wants a DM
    const intent = await detectCommentIntent(comment);
    
    if (!intent.wantsDM) {
      console.log(`Comment from ${username} doesn't indicate DM intent - skipping automation`);
      return { success: false, followUpScheduled: false };
    }

    // Step 2: Create or get lead
    let lead = await storage.getLeadByUsername(username, channel);
    
    if (!lead) {
      lead = await storage.createLead({
        userId,
        name: username,
        channel,
        status: 'new',
        source: 'comment_automation',
        tags: ['comment', intent.intent, 'auto_dm'],
        metadata: {
          originalComment: comment,
          commentIntent: intent.intent,
          postContext
        }
      });
    }

    // Step 3: Generate and send initial DM
    const initialDM = await generateInitialDM(username, intent, postContext);
    
    const message = await storage.createMessage({
      leadId: lead.id,
      userId,
      provider: channel,
      direction: 'outbound',
      body: initialDM,
      audioUrl: null,
      metadata: {
        ai_generated: true,
        automation_type: 'comment_dm',
        original_comment: comment,
        intent: intent.intent
      }
    });

    // Step 4: Schedule 6-hour follow-up
    await scheduleCommentFollowUp(userId, lead.id, channel, intent.intent, postContext);

    // Step 5: Update lead status
    await storage.updateLead(lead.id, {
      status: 'replied',
      lastMessageAt: new Date()
    });

    console.log(`✓ Comment automation complete for ${username} - Initial DM sent, 6h follow-up scheduled`);

    return {
      success: true,
      lead,
      initialMessage: message,
      followUpScheduled: true
    };
  } catch (error) {
    console.error('Comment automation error:', error);
    return { success: false, followUpScheduled: false };
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
