/* @ts-nocheck */

/**
 * Sales Language Optimizer v2
 * 
 * 20+ Premium-to-Natural conversational word replacements
 * Makes AI responses sound like a real person, not a robot
 * 
 * Strategy: Replace formal/sales terms with conversational alternatives
 */

/**
 * 20+ word replacements for natural, conversational tone
 * Less corporate, more human
 */
export function optimizeSalesLanguage(text: string): string {
  if (!text) return text;

  let optimized = text;

  // 1. "buy" → "join" or "get started"
  optimized = optimized.replace(/\bbuy\b/gi, (match) => 
    match.toLowerCase() === 'buy' ? 'join' : 'Join'
  );

  // 2. "contract" → "agreement" or "terms"
  optimized = optimized.replace(/\bcontracts?\b/gi, (match) => {
    if (match.toLowerCase() === 'contracts') return 'agreements';
    return 'agreement';
  });

  // 3. "cost/price" → "investment"
  optimized = optimized.replace(/\b(cost|costs|pricing|price|priced)\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower === 'costs') return 'investments';
    if (lower === 'pricing') return 'investment plan';
    return 'investment';
  });

  // 4. "follow up/follow-up" → "reconnect" or "touch base"
  optimized = optimized.replace(/\bfollow[- ]?ups?\b/gi, () => 'reconnect');

  // 5. "customer" → "client" or "team member"
  optimized = optimized.replace(/\bcustomers?\b/gi, (match) => 
    match.toLowerCase() === 'customers' ? 'clients' : 'client'
  );

  // 6. "expensive" → "premium" or "investment"
  optimized = optimized.replace(/\bexpensive\b/gi, 'premium');

  // 7. "maybe" → "for sure" (context-aware)
  optimized = optimized.replace(/\bmaybe\b/gi, (match, offset, string) => {
    const afterContext = string.substring(offset + match.length, offset + match.length + 30).toLowerCase();
    if (afterContext.includes('later') || afterContext.includes('another') || afterContext.includes('next')) {
      return match;
    }
    return 'for sure';
  });

  // 8. "problem" → "challenge" or "situation"
  optimized = optimized.replace(/\bproblems?\b/gi, (match) => 
    match.toLowerCase() === 'problems' ? 'challenges' : 'challenge'
  );

  // 9. "sell" → "share" or "introduce"
  optimized = optimized.replace(/\bsell(ing|s)?\b/gi, (match) => {
    if (match.toLowerCase() === 'selling') return 'sharing';
    if (match.toLowerCase() === 'sells') return 'shares';
    return 'share';
  });

  // 10. "sales" → "growth" or "business"
  optimized = optimized.replace(/\bsales\b/gi, 'growth');

  // 11. "free trial" → "test it out" or "try it first"
  optimized = optimized.replace(/\bfree\s+trial\b/gi, 'try-before-you-buy');

  // 12. "deal" → "opportunity" or "offer"
  optimized = optimized.replace(/\bdeal\b/gi, 'opportunity');

  // 13. "service" → "solution" or "tool"
  optimized = optimized.replace(/\bservice\b/gi, 'solution');

  // 14. "guarantee" → "I've got your back" or "you're covered"
  optimized = optimized.replace(/\bguarantee\b/gi, (match) => 
    match === 'Guarantee' ? "I've got your back" : "i've got your back"
  );

  // 15. "reach out" → "connect" or "chat"
  optimized = optimized.replace(/\breach\s+out\b/gi, 'connect');

  // 16. "implement" → "get going" or "set up"
  optimized = optimized.replace(/\bimplement(ing|s)?\b/gi, (match) => {
    if (match.toLowerCase() === 'implementing') return 'getting going';
    if (match.toLowerCase() === 'implements') return 'gets going';
    return 'get going';
  });

  // 17. "utilize" → "use" or "leverage"
  optimized = optimized.replace(/\butilize\b/gi, 'use');

  // 18. "signify" → "mean" or "show"
  optimized = optimized.replace(/\bsignify\b/gi, 'mean');

  // 19. "request" → "ask" or "need"
  optimized = optimized.replace(/\brequests?\b/gi, (match) => 
    match.toLowerCase() === 'requests' ? 'asks' : 'ask'
  );

  // 20. "proceed" → "move forward" or "keep going"
  optimized = optimized.replace(/\bproceed\b/gi, 'move forward');

  // 21. "hesitant" → "unsure" or "not sure yet"
  optimized = optimized.replace(/\bhesitant\b/gi, 'unsure');

  // 22. "commitment" → "all-in" or "partnership"
  optimized = optimized.replace(/\bcommitment\b/gi, 'partnership');

  // 23. "leverage" → "tap into" or "use"
  optimized = optimized.replace(/\bleverag(e|ing)\b/gi, (match) => 
    match.toLowerCase().includes('ing') ? 'tapping into' : 'tap into'
  );

  // 24. "synergy" → "team up" or "together"
  optimized = optimized.replace(/\bsynergy\b/gi, 'teamwork');

  return optimized;
}

/**
 * Generate natural objection-handling response
 * More conversational, less salesy
 */
export function buildObjectionResponse(objection: string): string {
  const objectionLower = objection.toLowerCase();

  // Price objection
  if (objectionLower.includes('price') || objectionLower.includes('expensive') || 
      objectionLower.includes('cost') || objectionLower.includes('too much') ||
      objectionLower.includes('expensive')) {
    return `Look, I get it - money's a big deal. But here's the thing: most of our team members see 3-5x return in the first month. How about we hop on a quick 15-min call so I can show you exactly how this works for someone like you?`;
  }

  // Time/commitment objection
  if (objectionLower.includes('time') || objectionLower.includes('busy') || 
      objectionLower.includes('later') || objectionLower.includes('now')) {
    return `Totally get it - you're slammed right now. The cool part? Most team members spend just 10 mins a day managing everything. When's a good time this week to touch base and see if this is a fit?`;
  }

  // Unsure/hesitant objection
  if (objectionLower.includes('not sure') || objectionLower.includes('think about') || 
      objectionLower.includes('consider') || objectionLower.includes('unsure') ||
      objectionLower.includes('hesitant')) {
    return `No pressure at all, honestly. A lot of our best team members felt the same way at first. Want me to share a quick success story from someone in your space? We can reconnect in 2 days if you'd like.`;
  }

  // Already have solution objection
  if (objectionLower.includes('already have') || objectionLower.includes('using') || 
      objectionLower.includes('different') || objectionLower.includes('another')) {
    return `That's awesome - love that you're trying things. Real talk though: most people who switch save 15+ hours per week. Could we grab 15 mins so I can show you what's different here?`;
  }

  // Not interested objection
  if (objectionLower.includes('not interested') || objectionLower.includes('not for me') ||
      objectionLower.includes("doesn't sound") || objectionLower.includes('pass')) {
    return `Cool, I hear you. No hard feelings. Just so you know, if things change or you want to see what all the buzz is about, I'm right here. Talk soon!`;
  }

  // Default: ask to reconnect naturally
  return `Got it - totally understand. Would you be down to reconnect next week? No pressure, but I think you'd dig what we're doing here.`;
}

/**
 * Apply sales language to objection handling
 */
export function handleObjectionWithSalesLanguage(objection: string, baseResponse?: string): string {
  const response = baseResponse || buildObjectionResponse(objection);
  return optimizeSalesLanguage(response);
}

/**
 * Make text more conversational (less corporate, more human)
 * Used to soften professional language
 */
export function makeConversational(text: string): string {
  if (!text) return text;

  let result = text;

  // Replace corporate phrases
  result = result.replace(/\bplease\b/gi, ''); // Remove unnecessary pleases
  result = result.replace(/\bkindly\b/gi, ''); // Remove kindly
  result = result.replace(/\bthank\s+you\b/gi, 'thanks'); // thank you → thanks
  result = result.replace(/\bregretting\b/gi, 'wishing I'); // regretting → wishing I
  result = result.replace(/\bwould\s+you\s+mind\b/gi, 'can you'); // would you mind → can you
  result = result.replace(/\bit\s+would\s+be\s+appreciated\b/gi, "i'd appreciate it"); // formal → casual

  return result.trim();
}
