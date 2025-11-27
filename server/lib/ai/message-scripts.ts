import type { ChannelType } from '@shared/types';

export interface EmailMessageScript {
  subject: string;
  tone: string;
  structure: string;
  example: string;
}

export interface SocialMessageScript {
  tone: string;
  structure: string;
  example: string;
}

export type MessageScript = EmailMessageScript | SocialMessageScript;

export interface EmailScripts {
  day1: EmailMessageScript;
  day2: EmailMessageScript;
  day5: EmailMessageScript;
  day7: EmailMessageScript;
}

export interface WhatsAppScripts {
  day3: SocialMessageScript;
  day6: SocialMessageScript;
}

export interface InstagramScripts {
  day5: SocialMessageScript;
  day8: SocialMessageScript;
}

export interface ChannelScripts {
  email: EmailScripts;
  whatsapp: WhatsAppScripts;
  instagram: InstagramScripts;
}

export interface PersonalizeScriptContext {
  lead: { 
    name: string; 
    firstName: string; 
    company?: string; 
    metadata?: Record<string, unknown>; 
  };
  sender: { 
    name: string; 
    email?: string; 
  };
  observation?: string;
  question?: string;
  value?: string;
  resource?: string;
}

export const messageScripts: ChannelScripts = {
  email: {
    day1: {
      subject: 'Quick question about {{lead.name}}',
      tone: 'friendly, curious, no pitch',
      structure: 'Personal greeting → Show you did research → Ask a genuine question → Keep it short',
      example: `Hi {{lead.name}},

I came across {{lead.metadata?.company || 'your work'}} and noticed {{specific_observation}}.

I was wondering: {{genuine_question}}

Looking forward to hearing from you!

{{sender.name}}`
    },
    day2: {
      subject: 'Re: {{previous_subject}} - {{quick_value_add}}',
      tone: 'helpful, still no pressure',
      structure: 'Acknowledge if no response → Add something valuable → Soft call-to-action',
      example: `Hi {{lead.name}},

Wanted to add one more thing to my previous email: {{specific_value}}.

Thought you might find it useful given {{context}}.

Let me know if you'd like to explore further.

{{sender.name}}`
    },
    day5: {
      subject: 'Last thing: {{specific_value_prop}}',
      tone: 'educational, valuable, final opportunity',
      structure: 'Light acknowledgment → Share insight/resource → Final soft ask → Exit gracefully',
      example: `Hi {{lead.name}},

I'll keep this short - just wanted to share {{resource_or_insight}} that might be relevant.

{{brief_explanation_why_it_matters}}

If you ever want to discuss further, I'm here. If not, no worries!

{{sender.name}}`
    },
    day7: {
      subject: 'One last thought about {{lead.name}}',
      tone: 'personal, warm, graceful exit',
      structure: 'Personal note → Offer without expectation → Clear exit path → Stay connected',
      example: `Hi {{lead.name}},

Not going to follow up anymore, but wanted to say - {{genuine_personal_comment}}.

If things change or you want to chat down the road, feel free to reach out.

All the best,
{{sender.name}}`
    }
  },

  whatsapp: {
    day3: {
      tone: 'casual, conversational, friendly',
      structure: 'Casual greeting → Specific mention → Question or update',
      example: `Hey {{lead.name}}! 👋

Saw {{specific_thing}} and thought of you. How are things going with {{context}}?

No pressure, just checking in 😊`
    },
    day6: {
      tone: 'helpful, value-first, quick',
      structure: 'Quick value add → Open door → Light ask',
      example: `{{lead.name}} - found this and thought you might like it: {{link_or_brief_value}}

Curious what you think 🤔`
    }
  },

  instagram: {
    day5: {
      tone: 'authentic, brief, visual-aware',
      structure: 'Comment or DM friendly → Share observation → Light engage',
      example: `Hey {{lead.name}}! 👀

Saw {{specific_visual_observation}} on your latest - {{genuine_comment}}.

How's {{topic}} treating you?`
    },
    day8: {
      tone: 'casual check-in, knowing might not connect',
      structure: 'Brief, low-pressure message',
      example: `{{lead.name}}, loved that {{observation}}. 

Anytime you want to chat about {{topic}}, I'm around! 🤙`
    }
  }
};

export function getMessageScript(
  channel: ChannelType,
  campaignDay: number
): MessageScript | null {
  if (channel === 'email') {
    const emailScripts = messageScripts.email;
    if (campaignDay <= 1) return emailScripts.day1;
    if (campaignDay === 2) return emailScripts.day2;
    if (campaignDay <= 6) return emailScripts.day5;
    return emailScripts.day7;
  }
  
  if (channel === 'whatsapp') {
    const whatsappScripts = messageScripts.whatsapp;
    if (campaignDay <= 3) return whatsappScripts.day3;
    return whatsappScripts.day6;
  }
  
  if (channel === 'instagram') {
    const instagramScripts = messageScripts.instagram;
    if (campaignDay <= 5) return instagramScripts.day5;
    return instagramScripts.day8;
  }

  return null;
}

export function personalizeScript(
  script: MessageScript,
  context: PersonalizeScriptContext
): string {
  let template: string = script.example || '';

  template = template.replace(/{{lead\.name}}/g, context.lead.name);
  template = template.replace(/{{lead\.firstName}}/g, context.lead.firstName || context.lead.name.split(' ')[0]);
  template = template.replace(/{{lead\.company}}/g, context.lead.company || String(context.lead.metadata?.company) || 'your work');
  template = template.replace(/{{specific_observation}}/g, context.observation || 'something interesting');
  template = template.replace(/{{genuine_question}}/g, context.question || 'how are things going?');
  template = template.replace(/{{specific_value}}/g, context.value || 'something useful');
  template = template.replace(/{{resource_or_insight}}/g, context.resource || 'a helpful perspective');
  template = template.replace(/{{sender\.name}}/g, context.sender.name);

  return template.trim();
}
