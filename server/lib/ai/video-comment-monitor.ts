
import OpenAI from 'openai';
import { storage } from '../../storage';
import { InstagramProvider } from '../providers/instagram';
import { decrypt } from '../crypto/encryption';

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
 * Detect buying intent from Instagram comment with human-like analysis
 */
export async function detectBuyingIntent(comment: string, videoContext: string): Promise<{
  hasBuyingIntent: boolean;
  intentType: 'high_interest' | 'curious' | 'price_objection' | 'inappropriate' | 'neutral';
  confidence: number;
  shouldDM: boolean;
  suggestedResponse?: string;
}> {
  if (isDemoMode) {
    const lowerComment = comment.toLowerCase();
    const hasBuyingIntent = /\b(link|interested|price|buy|want|need|how much)\b/.test(lowerComment);
    return {
      hasBuyingIntent,
      intentType: 'high_interest',
      confidence: 0.85,
      shouldDM: hasBuyingIntent,
      suggestedResponse: undefined
    };
  }

  try {
    const prompt = `You are an expert sales psychologist analyzing Instagram comments for buying signals.

Comment: "${comment}"
Video Context: "${videoContext}"

Analyze this comment and determine:

1. BUYING INTENT LEVEL:
   - High Interest: "link", "interested", "dm me", "how do I get this", "need this"
   - Curious: "what is this", "how does it work", "tell me more"
   - Price Objection: "too expensive", "cheaper option", "discount", "can't afford"
   - Inappropriate: Insults, spam, offensive language, trolling
   - Neutral: General comments, emojis only, unrelated

2. Should we DM? (true/false)
   - YES if: High interest, Curious, Price objection (we can handle)
   - NO if: Inappropriate, Neutral, Just emojis

3. If inappropriate/rude, suggest a MATURE professional response that:
   - Acknowledges their concern calmly
   - Doesn't engage with negativity
   - Redirects professionally
   - Shows empathy

Return JSON only: 
{
  "hasBuyingIntent": boolean,
  "intentType": "high_interest" | "curious" | "price_objection" | "inappropriate" | "neutral",
  "confidence": 0.0-1.0,
  "shouldDM": boolean,
  "suggestedResponse": "optional response for handling difficult comments"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a master sales psychologist and conflict resolution expert.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 250,
      temperature: 0.4
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
 * Generate human-like DM that sounds like a real salesperson
 */
export async function generateSalesmanDM(
  leadName: string,
  comment: string,
  intentType: string,
  productLink: string,
  ctaText: string,
  videoContext: string,
  brandKnowledge?: string
): Promise<{ message: string; linkButton: { text: string; url: string }; askFollow?: boolean }> {
  if (isDemoMode) {
    return {
      message: `Hey ${leadName} I noticed you showed interest in my post while scrolling. I think you'll love this`,
      linkButton: { text: ctaText || 'Check it out', url: productLink },
      askFollow: false
    };
  }

  try {
    const prompt = `You are a TOP-PERFORMING salesperson sending a DM to someone who commented on your Instagram video.

Lead Name: ${leadName}
Their Comment: "${comment}"
Intent Type: ${intentType}
Video Context: ${videoContext}
Product/Offer: ${productLink}
${brandKnowledge ? `Brand Knowledge: ${brandKnowledge}` : ''}

CRITICAL RULES:
1. Sound like a REAL HUMAN having a conversation - no hyphens, no robotic punctuation
2. Address them by first name casually like "Hey Sarah" or just "Sarah"
3. Open with "I noticed you showed interest in my post while scrolling" or similar natural line
4. NO copy-paste vibe - each message should feel unique
5. Keep it under 80 words - sales pros are brief and punchy
6. NO hyphen bullets NO excessive punctuation like "..." or "!!!"
7. Build urgency naturally if it's an offer - "might be your last shot" "filling up fast"
8. If price objection: Acknowledge it maturely, focus on VALUE and ROI, ask emotional closing question
9. End naturally - don't force a hard close, just make them WANT to click
10. For the link button text: Keep it 2-4 words max, action-oriented

PRICE OBJECTION HANDLING:
If intent is price_objection, use emotional sales tactics:
- "I get it, but would you rather invest $X now and be financially free in 6 months, or keep waiting for the 'right time' that never comes?"
- "Most people who hesitate regret it when they see others getting results. You in or out?"
- Focus on transformation, not price
- Make them feel they're losing opportunity by waiting

Generate JSON:
{
  "message": "the DM text (natural, conversational, NO hyphens)",
  "linkButton": { "text": "2-4 word CTA", "url": "${productLink}" },
  "askFollow": false
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a legendary salesperson who closes deals through authentic human connection.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 300,
      temperature: 0.85
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Salesman DM generation error:', error);
    return {
      message: `Hey ${leadName} I noticed you showed interest in my post while scrolling. This might be exactly what you need`,
      linkButton: { text: ctaText || 'See it here', url: productLink }
    };
  }
}

/**
 * Monitor video comments in real-time
 */
export async function monitorVideoComments(userId: string): Promise<void> {
  try {
    // Get user's active video monitors
    const monitors = await storage.getVideoMonitors(userId);
    
    if (!monitors || monitors.length === 0) {
      return;
    }

    // Get Instagram integration
    const integrations = await storage.getIntegrations(userId);
    const igIntegration = integrations.find(i => i.provider === 'instagram' && i.connected);
    
    if (!igIntegration) {
      console.log('Instagram not connected for user', userId);
      return;
    }

    const provider = new InstagramProvider(igIntegration.encryptedMeta);

    for (const monitor of monitors) {
      if (!monitor.isActive) continue;

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

          // Generate salesman-style DM
          const dm = await generateSalesmanDM(
            comment.username,
            comment.text,
            intent.intentType,
            monitor.productLink,
            monitor.ctaText,
            monitor.metadata.videoCaption || '',
            brandKnowledge
          );

          // Send DM with link button (Instagram format)
          const messagePayload = {
            text: dm.message,
            quick_replies: [
              {
                content_type: 'text',
                title: dm.linkButton.text,
                payload: dm.linkButton.url
              }
            ]
          };

          await provider.sendMessage(comment.userId, messagePayload.text);

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
    }
  } catch (error) {
    console.error('Video comment monitoring error:', error);
  }
}

/**
 * Fetch comments from Instagram video
 */
async function fetchVideoComments(provider: InstagramProvider, videoId: string): Promise<any[]> {
  // This would integrate with Instagram Graph API
  // For now returning mock structure
  return [];
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
        await monitorVideoComments(user.id);
      }
    } catch (error) {
      console.error('Comment monitoring error:', error);
    }
  }, 30000); // Check every 30 seconds
}
