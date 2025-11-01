import OpenAI from 'openai';
import { storage } from '../../storage';
import { InstagramProvider } from '../providers/instagram';
import { decrypt } from '../crypto/encryption';
import { formatDMWithButton } from './dm-formatter';

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

        // Detect buying intent
        const intent = await detectBuyingIntent(
          comment.text,
          monitor.metadata.videoCaption || 'Product video'
        );

        if (!intent.shouldDM) {
          // Mark as processed but no action needed
          await storage.markCommentProcessed(comment.id, 'ignored', intent.intentType);
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

        // Get brand knowledge for personalization
        const brandKnowledge = await storage.getBrandKnowledge(userId);

        // Generate salesman-style DM with detected interest
        const dm = await generateSalesmanDM(
          comment.username,
          comment.text,
          intent.intentType,
          monitor.productLink,
          monitor.ctaText,
          monitor.metadata.videoCaption || '',
          brandKnowledge,
          intent.detectedInterest
        );

        // Send DM with link in message (Instagram doesn't support rich buttons in API)
        // We'll format it as a natural message with the link
        const fullMessage = formatDMWithButton(dm.message, dm.linkButton.text, dm.linkButton.url);

        await provider.sendMessage(comment.userId, fullMessage);

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
            comment_id: comment.id
          }
        });

        // Mark comment as processed
        await storage.markCommentProcessed(comment.id, 'dm_sent', intent.intentType);

        // Update lead status
        await storage.updateLead(lead.id, {
          status: 'replied',
          lastMessageAt: new Date()
        });

        console.log(`✓ Video comment DM sent to ${comment.username} (${intent.intentType})`);
      }
    } catch (error) {
      console.error(`Error monitoring video ${monitor.videoId}:`, error);
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
  console.log('Starting video comment monitoring worker...');

  setInterval(async () => {
    try {
      const users = await storage.getAllUsers();

      for (const user of users) {
        // Fetch all active video monitors for the user
        const activeMonitors = await storage.getActiveVideoMonitors(user.id);
        for (const monitor of activeMonitors) {
          await monitorVideoComments(user.id, monitor.id);
        }
      }
    } catch (error) {
      console.error('Comment monitoring error:', error);
    }
  }, 30000); // Check every 30 seconds
}