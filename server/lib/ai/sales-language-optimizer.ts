/* @ts-nocheck */

/**
 * Sales Language Optimizer
 * 
 * Replaces basic sales terms with premium/professional language
 * Used when responding to objections and handling leads
 * 
 * Word Replacements:
 * - "buy" → "join"
 * - "contract" → "agreement"
 * - "cost/price" → "investment"
 * - "follow up/follow-up" → "reconnect"
 * - "customer" → "client"
 * - "expensive" → "premium"
 * - "maybe" → "for sure" (in sales context)
 */

/**
 * Optimize sales language in AI-generated responses
 * Smart replacements that maintain context and don't break sentences
 */
export function optimizeSalesLanguage(text: string): string {
  if (!text) return text;

  let optimized = text;

  // Replace "buy" with "join" (case-insensitive, word boundaries)
  optimized = optimized.replace(/\bbuy\b/gi, (match) => {
    return match.toLowerCase() === 'buy' ? 'join' : 'Join';
  });

  // Replace "contract" with "agreement"
  optimized = optimized.replace(/\bcontracts?\b/gi, (match) => {
    if (match.toLowerCase() === 'contracts') return 'agreements';
    if (match.toLowerCase() === 'contract') return 'agreement';
    return match;
  });

  // Replace "cost" or "price" with "investment"
  optimized = optimized.replace(/\b(cost|costs|price|pricing|priced)\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower === 'cost') return 'investment';
    if (lower === 'costs') return 'investments';
    if (lower === 'price' || lower === 'priced') return 'investment';
    if (lower === 'pricing') return 'investment plan';
    return match;
  });

  // Replace "follow up" or "follow-up" with "reconnect"
  optimized = optimized.replace(/\bfollow[- ]?ups?\b/gi, (match) => {
    if (match.toLowerCase().includes('ups')) return 'reconnects';
    return 'reconnect';
  });

  // Replace "customer" with "client"
  optimized = optimized.replace(/\bcustomers?\b/gi, (match) => {
    if (match.toLowerCase() === 'customers') return 'clients';
    return 'client';
  });

  // Replace "expensive" with "premium"
  optimized = optimized.replace(/\bexpensive\b/gi, 'premium');

  // Replace "maybe" with "for sure" (only in sales context)
  // Be careful: only replace "maybe" when it appears as a standalone word indicating uncertainty in a sales context
  optimized = optimized.replace(/\bmaybe\b/gi, (match, offset, string) => {
    // Check context: if followed by "later", "next time", "another time" - skip
    const afterContext = string.substring(offset + match.length, offset + match.length + 30).toLowerCase();
    
    if (afterContext.includes('later') || afterContext.includes('another') || afterContext.includes('next')) {
      return match; // Don't replace
    }

    // Replace in sales/commitment context
    return 'for sure';
  });

  return optimized;
}

/**
 * Generate objection-handling response with premium language
 * Used when lead says "price is too high" or similar objections
 */
export function buildObjectionResponse(objection: string, businessContext?: string): string {
  const objectionLower = objection.toLowerCase();

  // Price objection
  if (objectionLower.includes('price') || objectionLower.includes('expensive') || objectionLower.includes('cost') || objectionLower.includes('too much')) {
    return `I understand the investment is significant. Let me show you the ROI - our clients typically see 3-5x return within the first month. Can we schedule a quick 15-minute call to explore which plan works best for you?`;
  }

  // Time/commitment objection
  if (objectionLower.includes('time') || objectionLower.includes('busy') || objectionLower.includes('now')) {
    return `I completely get it - you're busy building your business. Our clients spend just 10 minutes per day managing everything. When would be a good time for a quick reconnect to see if this is a fit?`;
  }

  // Unsure/hesitant objection
  if (objectionLower.includes('not sure') || objectionLower.includes('think about') || objectionLower.includes('consider')) {
    return `No pressure at all! Many of our top clients felt the same way initially. How about I share a quick success story from someone in your industry, and we can reconnect in 2 days?`;
  }

  // Already have solution objection
  if (objectionLower.includes('already have') || objectionLower.includes('using') || objectionLower.includes('different')) {
    return `That's awesome you've got a solution in place. Most clients we work with switch because they save 15+ hours per week. Could we grab 15 minutes to see if there's a better way?`;
  }

  // Default: ask to reconnect
  return `Got it - totally understand. Would you be open to a quick reconnect next week to explore if this could help you grow faster?`;
}

/**
 * Apply sales language to objection handling
 */
export function handleObjectionWithSalesLanguage(objection: string, baseResponse?: string): string {
  const response = baseResponse || buildObjectionResponse(objection);
  return optimizeSalesLanguage(response);
}
