import OpenAI from 'openai';
import { storage } from '../../storage';
import { InstagramProvider } from '../providers/instagram';
import { decrypt } from '../crypto/encryption';
import { formatDMWithButton } from './dm-formatter';
import { workerHealthMonitor } from '../monitoring/worker-health';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

const isDemoMode = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key';

interface VideoMonitorConfig {
  id: string;
  userId: string;
  videoId: string;
  videoUrl: string;
  productLink: string;
  ctaText: string;
  isActive: boolean;
  autoReplyEnabled: boolean;
  metadata: {
    videoCaption?: string;
    productName?: string;
    pricePoint?: string;
    pdfContext?: string; // Added for PDF context
    replyToComments?: boolean; // Added to control comment replies
    askForFollow?: boolean; // Added to control asking for follow
    instagramHandle?: string; // Added for Instagram handle
  };
}

/**
 * Detect ANY interest from Instagram comment - no keywords required
 * AI analyzes context, tone, and user behavior to determine if they should get a DM
 */
export async function detectBuyingIntent(comment: string, videoContext: string): Promise<{
  hasBuyingIntent: boolean;
  intentType: 'high_interest' | 'curious' | 'price_objection' | 'inappropriate' | 'neutral';
  confidence: number;
  shouldDM: boolean;
  suggestedResponse?: string;
  detectedInterest?: string;
}> {
  if (isDemoMode) {
    const lowerComment = comment.toLowerCase();
    const hasBuyingIntent = /\b(link|interested|price|buy|want|need|how much)\b/.test(lowerComment);
    return {
      hasBuyingIntent,
      intentType: 'high_interest',
      confidence: 0.85,
      shouldDM: hasBuyingIntent,
      suggestedResponse: undefined,
      detectedInterest: 'Product interest detected'
    };
  }

  try {
    const prompt = `You are an AI trained to detect ANY form of interest in Instagram comments - not just keywords.

Comment: "${comment}"
Video Context: "${videoContext}"

CRITICAL: We DM ANYONE who shows even SLIGHT interest. Don't wait for "link" or "interested" keywords.

Analyze this comment for:

1. INTEREST SIGNALS (DM these):
   - Direct questions about the product/service
   - Expressing curiosity ("what is this?", "tell me more", "how?")
   - Asking for details, pricing, or availability
   - Showing excitement or positive emotion ("wow", "amazing", "love this")
   - ANY comment that indicates they might want to learn more
   - Emojis that show interest (😍, 🔥, 👀, 💯, ✨)
   - Tagging friends (shows they're sharing/interested)
   - Asking "how do I get this" or similar

2. NEUTRAL/SKIP (don't DM):
   - Pure spam or bots
   - Completely unrelated comments
   - Offensive/inappropriate language
   - Just generic praise with no curiosity ("nice video")

3. What they're interested in (extract from comment and video context):
   - What specific aspect caught their attention?
   - What problem are they trying to solve?

Return JSON:
{
  "hasBuyingIntent": boolean,
  "intentType": "high_interest" | "curious" | "price_objection" | "competitor_comparison" | "inappropriate" | "neutral",
  "confidence": 0.0-1.0,
  "shouldDM": boolean (true for ANY interest, false only for spam/offensive),
  "detectedInterest": "what they're interested in (e.g., 'pricing info', 'how it works', 'getting started')",
  "suggestedResponse": "optional response for handling difficult comments"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a hyper-intelligent sales AI that detects interest from ANY comment - no keywords needed. You understand context, tone, and human behavior.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 300,
      temperature: 0.5
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Buying intent detection error:', error);
    return {
      hasBuyingIntent: false,
      intentType: 'neutral',
      confidence: 0,
      shouldDM: false
    };
  }
}

/**
 * Generate context-aware DM using REAL username and detected interest
 * No fake names - uses their actual Instagram username
 */
export async function generateSalesmanDM(
  leadName: string,
  comment: string,
  intentType: string,
  productLink: string,
  ctaText: string,
  videoContext: string,
  brandKnowledge?: string,
  detectedInterest?: string
): Promise<{ message: string; linkButton: { text: string; url: string }; askFollow?: boolean }> {
  if (isDemoMode) {
    return {
      message: `Hey ${leadName}, I noticed you showed interest in my video. Based on your comment, I think this is exactly what you're looking for`,
      linkButton: { text: ctaText || 'Check it out', url: productLink },
      askFollow: false
    };
  }

  try {
    const prompt = `You are a TOP-PERFORMING salesperson sending a DM to someone who commented on your Instagram video.

Lead Username: ${leadName} (use this EXACT name - it's their real Instagram username)
Their Comment: "${comment}"
What They're Interested In: ${detectedInterest || 'the product/offer'}
Intent Type: ${intentType}
Video Context: ${videoContext}
Product/Offer Link: ${productLink}
${brandKnowledge ? `What We Offer: ${brandKnowledge}` : ''}

CRITICAL RULES - READ CAREFULLY:
1. Start with "Hey ${leadName}" (use their EXACT username, no fake names)
2. Reference what they showed interest in from the comment: "${comment}"
3. Talk about what THEY want (based on "${detectedInterest || 'their interest'}")
4. Connect their interest to what YOU offer (use brand knowledge if available)
5. Make it feel personalized and contextual - NOT generic
6. Keep it under 60 words - short, punchy, direct
7. NO hyphens, NO excessive punctuation (!!!, ???)
8. Sound like a confident human, not a bot
9. Create urgency naturally - "this might be your last shot" or "spots filling up"
10. End with a strong CTA that makes them want to click

PERSONALIZATION EXAMPLES:
- If they asked "how?": "Hey ${leadName}, you asked how this works - let me show you exactly what this does and how it can help you..."
- If they said "wow": "Hey ${leadName}, glad you're excited! This is exactly what you need if you want to..."
- If they asked about price: "Hey ${leadName}, I get it - pricing matters. But here's why this is worth every penny..."

Generate JSON:
{
  "message": "the personalized DM text (NO link in message, we add it as a button)",
  "linkButton": { "text": "2-4 word CTA like GET IT NOW or SEE HOW", "url": "${productLink}" },
  "askFollow": false
}

REMEMBER: Use their REAL username (${leadName}), reference their actual comment, and talk about what THEY want.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a legendary salesperson who creates hyper-personalized DMs that convert. Every message feels like it was written just for that person.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 350,
      temperature: 0.9
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Salesman DM generation error:', error);
    return {
      message: `Hey ${leadName}, I noticed you showed interest in my video. Based on what you said, I think you'll love this`,
      linkButton: { text: ctaText || 'See it here', url: productLink }
    };
  }
}

/**
 * Generate natural comment reply (beats ManyChat with human-like responses)
 */
export async function generateCommentReply(
  comment: string,
  detectedInterest: string,
  videoContext: string,
  askForFollow: boolean,
  userInstagramHandle?: string
): Promise<string> {
  if (isDemoMode) {
    return "Great question! Check your DM 💬";
  }

  try {
    const prompt = `You are replying to an Instagram comment. Be BRIEF (max 15 words), natural, and human.

Comment: "${comment}"
What they want: ${detectedInterest}
Video about: ${videoContext}
${askForFollow ? `Instagram Handle: @${userInstagramHandle}` : ''}

RULES:
1. Sound like a real person, not a bot
2. Be enthusiastic but not salesy
3. Reference what THEY said
4. Keep it SUPER short (10-15 words max)
5. ${askForFollow ? 'Naturally ask them to follow you for the link/info' : 'Tell them to check DM'}
6. Use 1-2 emojis max
7. Make it feel exclusive/valuable

${askForFollow ? `EXAMPLES:
- "Love that! Follow me quick so I can send this over 🔥"
- "Yes! Follow @${userInstagramHandle} real quick & I'll hook you up ✨"
- "Perfect! Hit follow so I can share the details with you 💯"` : `EXAMPLES:
- "Great question! Just sent you the details 💬"
- "Love the energy! Check your DM 🔥"
- "Yes! Sliding into your DMs now ✨"`}

Generate ONLY the comment reply text (no quotes, no explanations):`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You write natural Instagram comment replies that sound human and capture leads fast.' },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 50,
      temperature: 0.9
    });

    return response.choices[0].message.content?.trim() || "Check your DM! 💬";
  } catch (error) {
    console.error('Comment reply generation error:', error);
    return askForFollow ? `Follow me for the link! 🔥` : "Check your DM! 💬";
  }
}

/**
 * Monitor video comments in real-time
 */
export async function monitorVideoComments(userId: string, videoMonitorId: string): Promise<void> {
  try {
    const { storage } = await import('../../storage');

    // Check if user has paid plan
    const user = await storage.getUserById(userId);
    if (!user || user.plan === 'trial') {
      console.log(`🔒 Video comment monitoring blocked: User ${userId} is on trial plan`);
      return;
    }

    // Get video monitor config
    const monitor = await storage.getVideoMonitor(videoMonitorId);

    // Get Instagram integration
    const integrations = await storage.getIntegrations(userId);
    const igIntegration = integrations.find(i => i.provider === 'instagram' && i.connected);

    if (!igIntegration) {
      console.log('Instagram not connected for user', userId);
      return;
    }

    const provider = new InstagramProvider(igIntegration.encryptedMeta);

    if (!monitor.isActive) return;

    try {
      // Fetch recent comments on this video
      const comments = await fetchVideoComments(provider, monitor.videoId);

      for (const comment of comments) {
        // Check if we already processed this comment
        const alreadyProcessed = await storage.isCommentProcessed(comment.id);
        if (alreadyProcessed) continue;

        // Detect buying intent with context from PDF if provided
        const videoContext = monitor.metadata?.pdfContext || monitor.metadata.videoCaption || 'Product video';
        const intent = await detectBuyingIntent(comment.text, videoContext);

        if (!intent.shouldDM) {
          await storage.markCommentProcessed(comment.id, 'ignored', intent.intentType);
          continue;
        }

        // FILTER: Check for inappropriate content before processing
        const { contentModerationService } = await import('./content-moderation');
        const moderationResult = await contentModerationService.moderateWithAI(comment.text);

        if (moderationResult.shouldBlock || moderationResult.category === 'inappropriate') {
          console.log(`🚫 Blocked inappropriate comment from ${comment.username}: ${moderationResult.category}`);
          await storage.markCommentProcessed(comment.id, 'blocked_inappropriate', 'inappropriate');
          continue;
        }

        // Get or create lead
        let lead = await storage.getLeadByUsername(comment.username, 'instagram');

        if (!lead) {
          lead = await storage.createLead({
            userId,
            name: comment.username,
            channel: 'instagram',
            externalId: comment.userId,
            status: 'new',
            source: 'video_comment_automation',
            tags: ['video-comment', intent.intentType, 'auto-captured'],
            metadata: {
              originalComment: comment.text,
              videoId: monitor.videoId,
              videoUrl: monitor.videoUrl,
              commentIntent: intent.intentType
            }
          });
        }

        // STEP 1: Reply to comment FIRST with emoji + "check DM"
        // This happens BEFORE sending DM (human-like flow)
        let commentReplied = false;
        if (monitor.metadata?.replyToComments !== false) {
          try {
            const commentReply = await generateCommentReply(
              comment.text,
              intent.detectedInterest || 'the offer',
              videoContext,
              monitor.metadata?.askForFollow || false,
              monitor.metadata?.instagramHandle
            );

            await provider.replyToComment(comment.id, commentReply);
            commentReplied = true;
            console.log(`✅ [1/3] Replied to comment: "${commentReply}"`);
          } catch (error: any) {
            console.error(`❌ Failed to reply to comment from ${comment.username}:`, error.message);
            console.log(`⚠️  Will still attempt DM, but comment reply failed`);
            // Continue to DM even if comment reply fails
          }
        } else {
          console.log(`ℹ️  Comment reply disabled for this monitor`);
        }

        // STEP 2: Wait 2-8 minutes AFTER replying (human-like timing)
        const existingLead = lead || { status: 'new' };
        const baseDelay = {
          'hot': 2 * 60 * 1000,
          'warm': 3.5 * 60 * 1000,
          'new': 5 * 60 * 1000,
          'cold': 7 * 60 * 1000,
          'replied': 4 * 60 * 1000
        }[existingLead.status] || 5 * 60 * 1000;

        const jitter = (Math.random() * 0.4 - 0.2) * baseDelay;
        const replyDelay = baseDelay + jitter;

        console.log(`⏰ [2/3] Waiting ${Math.round(replyDelay / 60000)} minutes before sending DM to ${comment.username} (status: ${existingLead.status})`);
        await new Promise(resolve => setTimeout(resolve, replyDelay));


        // STEP 3: Generate and send DM
        const dm = await generateSalesmanDM(
          comment.username,
          comment.text,
          intent.intentType,
          monitor.productLink,
          monitor.ctaText,
          monitor.metadata.videoCaption || '',
          await storage.getBrandKnowledge(userId), // Fetch brand knowledge here
          intent.detectedInterest
        );

        // Send DM with link in message
        const fullMessage = formatDMWithButton(dm.message, dm.linkButton.text, dm.linkButton.url);

        await provider.sendMessage(comment.userId, fullMessage);
        console.log(`✅ [3/3] DM sent to ${comment.username} with product link`);

        // Save message
        await storage.createMessage({
          leadId: lead.id,
          userId,
          provider: 'instagram',
          direction: 'outbound',
          body: dm.message,
          audioUrl: null,
          metadata: {
            ai_generated: true,
            automation_type: 'video_comment',
            intent_type: intent.intentType,
            link_button: dm.linkButton,
            comment_id: comment.id,
            comment_replied: commentReplied,
            comment_reply_enabled: monitor.metadata?.replyToComments !== false
          }
        });

        // Mark comment as processed
        await storage.markCommentProcessed(comment.id, 'dm_sent', intent.intentType);

        // Update lead status
        await storage.updateLead(lead.id, {
          status: 'replied',
          lastMessageAt: new Date()
        });

        console.log(`✓ Video comment automation complete for ${comment.username} (${intent.intentType})`);
      }
    } catch (error: any) {
      // Check if this is an Instagram auth error (HTML response means invalid token)
      if (error.message?.includes('<!DOCTYPE html>') || error.message?.includes('<html')) {
        console.warn(`⚠️  Instagram access token expired for user ${userId} - attempting refresh`);

        // Try to refresh the token
        try {
          const { InstagramOAuth } = await import('../oauth/instagram');
          const instagramOAuth = new InstagramOAuth();
          const newToken = await instagramOAuth.refreshToken(userId);

          if (newToken) {
            console.log(`✅ Instagram token refreshed for user ${userId}`);
            // Retry the monitoring with new token
            return monitorVideoComments(userId, videoMonitorId);
          }
        } catch (refreshError: any) {
          console.error(`❌ Failed to refresh Instagram token for user ${userId}:`, refreshError.message);

          // Mark integration as disconnected
          await storage.updateIntegration(userId, 'instagram', {
            connected: false,
            metadata: {
              error: 'Token expired - please reconnect',
              lastError: new Date().toISOString()
            }
          });

          // Create notification for user
          await storage.createNotification({
            userId,
            title: '🔒 Instagram Connection Lost',
            message: 'Your Instagram connection has expired. Please reconnect to continue automation.',
            type: 'warning',
            read: false
          });
        }

        workerHealthMonitor.recordError('video-comment-monitor', 'Instagram token expired');
      } else {
        console.error('Error fetching queue jobs:', error);
        workerHealthMonitor.recordError('video-comment-monitor', error.message);
      }
    }
  } catch (error) {
    console.error('Video comment monitoring error:', error);
  }
}

/**
 * Fetch comments from Instagram video
 */
async function fetchVideoComments(provider: InstagramProvider, videoId: string): Promise<any[]> {
  try {
    // Use Instagram Graph API to fetch comments
    const comments = await provider.getMediaComments(videoId);

    return comments.map((comment: any) => ({
      id: comment.id,
      text: comment.text,
      username: comment.username,
      userId: comment.from?.id || comment.id,
      timestamp: comment.timestamp
    }));
  } catch (error) {
    console.error('Error fetching video comments:', error);
    return [];
  }
}

/**
 * Start comment monitoring worker (runs every 30 seconds)
 */
export function startVideoCommentMonitoring() {
  console.log('🎥 Starting video comment monitoring worker...');
  console.log('📊 Comment sync: Every 30 seconds');
  console.log('⏰ Reply timing: 2-8 minutes (human-like, based on lead status)');

  setInterval(async () => {
    try {
      const users = await storage.getAllUsers();

      for (const user of users) {
        try {
          // Fetch all active video monitors for the user
          const activeMonitors = await (storage as any).getActiveVideoMonitors?.(user.id) || [];
          for (const monitor of activeMonitors) {
            await monitorVideoComments(user.id, monitor.id);
          }
        } catch (monitorError: any) {
          // Skip if table doesn't exist yet
          if (!monitorError.message?.includes('does not exist')) {
            console.error(`Error monitoring for user ${user.id}:`, monitorError.message);
          }
        }
      }
    } catch (error: any) {
      // Only log real errors, not missing table errors
      if (!error.message?.includes('does not exist')) {
        console.error('Comment monitoring error:', error.message);
      }
    }
  }, 30000); // Check every 30 seconds
}