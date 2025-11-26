/**
 * Message Rotator - Avoid spam detection with intelligent template rotation
 * Every 3-5 messages uses different template + tone
 */

export type MessageType = 'hook' | 'value' | 'social_proof' | 'urgency' | 'followup';

export interface MessageTemplate {
  id: string;
  type: MessageType;
  subject?: string; // Email subject
  body: string;
  tone: 'professional' | 'casual' | 'urgent' | 'friendly';
  personalizationFields: string[]; // [name], [company], [challenge]
  channel: 'email' | 'whatsapp' | 'instagram';
}

/**
 * HOOK TEMPLATES - 5 variations to avoid pattern detection
 */
export const HOOKS: MessageTemplate[] = [
  {
    id: 'hook_1',
    type: 'hook',
    subject: 'Hey [name], quick thought...',
    body: `Hey [name],

Saw your recent post on [topic] and it reminded me of something...

Most [role] are still manually [painpoint], which is costing them time they don't have.

I built something that fixes this. Interested?`,
    tone: 'casual',
    personalizationFields: ['name', 'topic', 'role', 'painpoint'],
    channel: 'email',
  },
  {
    id: 'hook_2',
    type: 'hook',
    subject: '[name] - your [result] just improved',
    body: `[name],

Quick observation: your [company] is doing [achievement], which means you're probably struggling with [challenge].

I work with [similar_role] on exactly this.

Have 10 min to chat?`,
    tone: 'professional',
    personalizationFields: ['name', 'company', 'achievement', 'challenge', 'similar_role'],
    channel: 'email',
  },
  {
    id: 'hook_3',
    type: 'hook',
    subject: 'One thing I noticed about [company]',
    body: `[name],

I've been following [company] for a bit, and what you're doing with [initiative] is impressive.

That said, I think there's a gap around [opportunity]. We help [role] close that.

Worth exploring?`,
    tone: 'professional',
    personalizationFields: ['name', 'company', 'initiative', 'opportunity', 'role'],
    channel: 'email',
  },
  {
    id: 'hook_4',
    type: 'hook',
    body: `Hey [name],

[company] + [industry] = opportunity for $X month in untapped revenue.

Most teams miss this because [reason].

I help them find it. Quick call?`,
    tone: 'urgent',
    personalizationFields: ['name', 'company', 'industry', 'reason'],
    channel: 'whatsapp',
  },
  {
    id: 'hook_5',
    type: 'hook',
    body: `[name] - I just helped a [similar_company] do [result]. Your team could be next.

Interested in a quick walkthrough?`,
    tone: 'friendly',
    personalizationFields: ['name', 'similar_company', 'result'],
    channel: 'whatsapp',
  },
];

/**
 * VALUE PITCH TEMPLATES - Show concrete benefit
 */
export const VALUE_PITCHES: MessageTemplate[] = [
  {
    id: 'value_1',
    type: 'value',
    body: `Here's what I'm seeing: most [role] spend 15+ hours/week on [task], which is $[cost]/week in lost productivity.

Our system automates it in 30 minutes. You get [benefit].

That's a [ROI_multiplier]x ROI in month 1. Let me show you.`,
    tone: 'professional',
    personalizationFields: ['role', 'task', 'cost', 'benefit', 'ROI_multiplier'],
    channel: 'email',
  },
  {
    id: 'value_2',
    type: 'value',
    body: `What if you could [big_outcome] without hiring more team?

That's what [company_1] did with us. They went from [metric_before] → [metric_after] in [timeframe].

Your team has the same potential. We just proved it.`,
    tone: 'friendly',
    personalizationFields: ['big_outcome', 'company_1', 'metric_before', 'metric_after', 'timeframe'],
    channel: 'email',
  },
  {
    id: 'value_3',
    type: 'value',
    body: `Quick math on [your_goal]:

Manual approach: [effort], [time], [cost]
Our approach: [effort_reduced], [time_reduced], [cost_savings]

We guarantee [benefit] or money back. Worth a conversation?`,
    tone: 'urgent',
    personalizationFields: ['your_goal', 'effort', 'time', 'cost', 'benefit'],
    channel: 'whatsapp',
  },
];

/**
 * SOCIAL PROOF TEMPLATES - Build credibility
 */
export const SOCIAL_PROOFS: MessageTemplate[] = [
  {
    id: 'proof_1',
    type: 'social_proof',
    body: `[name], I should mention:

[client_1] went from [before] → [after] using this.
[client_2] did the same in [timeframe].

We're 3 for 3 with [industry]. You'd be the game-changer for [company].`,
    tone: 'professional',
    personalizationFields: ['name', 'client_1', 'before', 'after', 'client_2', 'timeframe', 'industry', 'company'],
    channel: 'email',
  },
  {
    id: 'proof_2',
    type: 'social_proof',
    body: `📊 Real results from [industry]:
• [company_1]: +[percentage]% conversion
• [company_2]: [metric] → [metric_improved]
• [company_3]: Saved $[amount]/month

You're looking at the same potential. Proof is in the walkthrough.`,
    tone: 'casual',
    personalizationFields: ['industry', 'company_1', 'percentage', 'company_2', 'metric', 'metric_improved', 'company_3', 'amount'],
    channel: 'email',
  },
  {
    id: 'proof_3',
    type: 'social_proof',
    body: `Founders in your space have already moved. [name] started last week. [name_2] the week before.

Curious what they're seeing? I'll show you.`,
    tone: 'urgent',
    personalizationFields: ['name', 'name_2'],
    channel: 'whatsapp',
  },
];

/**
 * URGENCY TEMPLATES - Create FOMO without being pushy
 */
export const URGENCY_FRAMES: MessageTemplate[] = [
  {
    id: 'urgency_1',
    type: 'urgency',
    body: `[name],

Quick heads-up: [offer] is only available to [segment_size] teams for the next [days] days.

You're in a great position for this. Shall I hold a spot for you?`,
    tone: 'professional',
    personalizationFields: ['name', 'offer', 'segment_size', 'days'],
    channel: 'email',
  },
  {
    id: 'urgency_2',
    type: 'urgency',
    body: `Most teams we work with make this decision in under 24 hours.

I want to make sure [company] gets the same priority. Can I book you in tomorrow?`,
    tone: 'professional',
    personalizationFields: ['company'],
    channel: 'email',
  },
  {
    id: 'urgency_3',
    type: 'urgency',
    body: `Pricing goes up [date]. Want to lock in the current rate?`,
    tone: 'urgent',
    personalizationFields: ['date'],
    channel: 'whatsapp',
  },
];

/**
 * FOLLOW-UP TEMPLATES - Re-engage non-responders
 */
export const FOLLOWUPS: MessageTemplate[] = [
  {
    id: 'followup_1',
    type: 'followup',
    body: `[name],

Just following up on my message from [days] days ago about [topic].

Curious if this is still on your radar or if timing's off?`,
    tone: 'casual',
    personalizationFields: ['name', 'days', 'topic'],
    channel: 'email',
  },
  {
    id: 'followup_2',
    type: 'followup',
    body: `Hey [name],

Didn't hear back - might've gotten lost in the shuffle.

Here's the tl;dr:
→ We help [role] do [outcome]
→ [Company] saw [result]
→ Curious if you want to explore

If not now, let me know 👍`,
    tone: 'friendly',
    personalizationFields: ['name', 'role', 'outcome', 'company', 'result'],
    channel: 'email',
  },
  {
    id: 'followup_3',
    type: 'followup',
    body: `Last attempt: [company], you're perfect for this but I'm probably not reaching you at the right time.

If you ever want to chat about [challenge], I'm here.

No pressure. 🙂`,
    tone: 'professional',
    personalizationFields: ['company', 'challenge'],
    channel: 'email',
  },
];

/**
 * Get random template of type, never same twice in a row
 */
export function getNextTemplate(
  messageType: MessageType,
  previousTemplateId?: string
): MessageTemplate {
  const templates = getTemplatesByType(messageType);
  let template = templates[Math.floor(Math.random() * templates.length)];

  // Never repeat same template consecutively
  while (template.id === previousTemplateId && templates.length > 1) {
    template = templates[Math.floor(Math.random() * templates.length)];
  }

  return template;
}

export function getTemplatesByType(type: MessageType): MessageTemplate[] {
  switch (type) {
    case 'hook':
      return HOOKS;
    case 'value':
      return VALUE_PITCHES;
    case 'social_proof':
      return SOCIAL_PROOFS;
    case 'urgency':
      return URGENCY_FRAMES;
    case 'followup':
      return FOLLOWUPS;
    default:
      return HOOKS;
  }
}

/**
 * Personalize template with lead data
 */
export function personalizeMessage(
  template: MessageTemplate,
  leadData: Record<string, string>
): string {
  let message = template.body;
  if (template.subject) message = template.subject + '\n\n' + message;

  // Replace all fields: [name] → value
  template.personalizationFields.forEach((field) => {
    const value = leadData[field] || `[${field}]`;
    message = message.replace(new RegExp(`\\[${field}\\]`, 'g'), value);
  });

  return message;
}

/**
 * Rotation strategy: Don't send same variation 3x in a row per lead
 */
export function shouldRotateTemplate(
  sendCount: number, // How many times sent to this lead
  messageType: MessageType
): boolean {
  // Every 3rd message to a lead must use different template
  return sendCount % 3 === 0;
}
