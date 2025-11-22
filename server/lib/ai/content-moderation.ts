/* @ts-nocheck */

import type { Message } from '@shared/schema';

interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  flags: string[];
  category?: 'spam' | 'offensive' | 'sexual' | 'violence' | 'safe';
  shouldBlock: boolean;
}

/**
 * Content moderation system
 * Detects inappropriate, spam, or offensive content
 */
export class ContentModerationService {
  
  // Keyword-based detection (can be enhanced with OpenAI Moderation API)
  private readonly offensiveKeywords = [
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell',
    'idiot', 'stupid', 'dumb', 'scam', 'fraud'
  ];

  private readonly spamPatterns = [
    /click here/i,
    /free money/i,
    /win \$\d+/i,
    /act now/i,
    /limited time/i,
    /guaranteed/i,
    /earn \$\d+ per day/i,
    /work from home/i
  ];

  private readonly sexualKeywords = [
    'sex', 'sexy', 'nude', 'porn', 'xxx', 'adult',
    'explicit', 'nsfw', 'hookup'
  ];

  private readonly violentKeywords = [
    'kill', 'murder', 'die', 'death', 'hurt', 'attack',
    'weapon', 'bomb', 'threat'
  ];

  /**
   * Moderate message content
   */
  async moderateContent(content: string): Promise<ModerationResult> {
    const lower = content.toLowerCase();
    const flags: string[] = [];
    let category: ModerationResult['category'] = 'safe';
    let shouldBlock = false;

    // Check for offensive language
    const offensiveCount = this.offensiveKeywords.filter(word => 
      lower.includes(word)
    ).length;
    if (offensiveCount > 0) {
      flags.push('offensive_language');
      category = 'offensive';
      if (offensiveCount >= 3) shouldBlock = true;
    }

    // Check for spam patterns
    const spamMatches = this.spamPatterns.filter(pattern => 
      pattern.test(content)
    ).length;
    if (spamMatches > 0) {
      flags.push('spam_pattern');
      category = 'spam';
      if (spamMatches >= 2) shouldBlock = true;
    }

    // Check for sexual content
    const sexualCount = this.sexualKeywords.filter(word => 
      lower.includes(word)
    ).length;
    if (sexualCount > 0) {
      flags.push('sexual_content');
      category = 'sexual';
      if (sexualCount >= 2) shouldBlock = true;
    }

    // Check for violent content
    const violentCount = this.violentKeywords.filter(word => 
      lower.includes(word)
    ).length;
    if (violentCount > 0) {
      flags.push('violent_content');
      category = 'violence';
      if (violentCount >= 2) shouldBlock = true;
    }

    // Check for excessive caps (shouting/aggressive)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      flags.push('excessive_caps');
      if (category === 'safe') category = 'offensive';
    }

    // Check for repeated characters (spam indicator)
    if (/(.)\1{4,}/.test(content)) {
      flags.push('repeated_characters');
      if (category === 'safe') category = 'spam';
    }

    // Calculate confidence
    const confidence = Math.min(
      0.5 + (flags.length * 0.15),
      0.95
    );

    const isAppropriate = flags.length === 0;

    return {
      isAppropriate,
      confidence,
      flags,
      category,
      shouldBlock
    };
  }

  /**
   * Enhanced moderation using OpenAI (if available)
   */
  async moderateWithAI(content: string): Promise<ModerationResult> {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key') {
      // Fallback to keyword-based
      return this.moderateContent(content);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({ input: content })
      });

      if (!response.ok) {
        throw new Error('OpenAI moderation failed');
      }

      const data = await response.json();
      const result = data.results[0];

      const flags: string[] = [];
      let category: ModerationResult['category'] = 'safe';

      if (result.categories.sexual) {
        flags.push('sexual_content');
        category = 'sexual';
      }
      if (result.categories.hate) {
        flags.push('offensive_language');
        category = 'offensive';
      }
      if (result.categories.violence) {
        flags.push('violent_content');
        category = 'violence';
      }
      if (result.categories['self-harm']) {
        flags.push('self_harm');
        category = 'violence';
      }

      return {
        isAppropriate: !result.flagged,
        confidence: Math.max(...Object.values(result.category_scores)) as number,
        flags,
        category,
        shouldBlock: result.flagged
      };
    } catch (error) {
      console.error('AI moderation error, falling back to keyword-based:', error);
      return this.moderateContent(content);
    }
  }

  /**
   * Log moderation event for review
   */
  async logModerationEvent(
    userId: string,
    leadId: string,
    content: string,
    result: ModerationResult
  ): Promise<void> {
    if (result.shouldBlock) {
      console.warn('⚠️ Content blocked:', {
        userId,
        leadId,
        flags: result.flags,
        category: result.category,
        preview: content.substring(0, 50)
      });
    }
  }
}

export const contentModerationService = new ContentModerationService();
