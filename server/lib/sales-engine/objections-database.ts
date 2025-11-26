/**
 * Comprehensive Sales Objections Database with Reframing Strategies
 * Covers: Time-Based, Price-Based, Competitor, Trust, Authority, Industry-Specific
 * Supports: Creators, Agencies, Founders, Retailers, B2B Services, Coaches
 */

export interface Objection {
  id: string;
  objection: string;
  category: 'timing' | 'price' | 'competitor' | 'trust' | 'authority' | 'fit' | 'social' | 'decision';
  industries: string[];
  reframes: string[];
  stories: string[];
  questions: string[];
  closingTactics: string[];
  proComparison?: string;
}

export const OBJECTIONS_DATABASE: Objection[] = [
  // TIMING OBJECTIONS (12)
  {
    id: 'timing-1',
    objection: 'Let me think about it',
    category: 'timing',
    industries: ['all'],
    reframes: [
      'Think about what specifically? Let\'s address those concerns right now',
      'Most people who think about it later get busy and forget. Why wait?',
      'What\'s the risk of waiting? Your leads aren\'t waiting - they\'re choosing competitors',
    ],
    stories: [
      'Had a coach who said "let me think" - lost 3 deals that week to a competitor who moved fast',
      'Founder waited 2 weeks, by then their competitor had already captured 15 leads',
    ],
    questions: [
      'What specific concern would help us address right now?',
      'Is it about price, setup, or how it works?',
      'If you had the answers now, would you start today?',
    ],
    closingTactics: [
      'Create urgency: "Your competitor might be setting up right now"',
      'Assume the close: "Let\'s get you started - I\'ll send the link"',
      'Risk reversal: "Try it free for 48 hours, no credit card"',
    ],
  },
  {
    id: 'timing-2',
    objection: 'I need to pray about it / Let me pray on it',
    category: 'timing',
    industries: ['all'],
    reframes: [
      'I respect that. While you pray, let me ask: what would be the perfect solution for you?',
      'Prayer is about making wise decisions - let\'s make sure you have all the facts',
      'God helps those who help themselves - let\'s take action on what we know works',
    ],
    stories: [
      'Told a pastor "pray about it" - he prayed and realized his competitor was already automating',
      'Religious founder said prayer made them realize speed matters - they started same day',
    ],
    questions: [
      'What would need to be true for this to feel like the right decision?',
      'Are there concerns we haven\'t addressed?',
    ],
    closingTactics: [
      'Respect + urgency: "I understand. Meanwhile, let me show you proof from your industry"',
      'Facts help faith: "Here are 3 similar businesses seeing 40% more conversions"',
    ],
  },
  {
    id: 'timing-3',
    objection: 'Tell my wife / Tell my girlfriend / Tell my friend',
    category: 'timing',
    industries: ['all'],
    reframes: [
      'Smart - let\'s get them on a quick call so we can all discuss together',
      'I respect that. What are they usually concerned about?',
      'Your partner will love this when they see the results - want me to show them?',
    ],
    stories: [
      'Founder\'s wife was skeptical until she saw the ROI in week 1 - now she\'s the biggest advocate',
      'Business partner said no, founder did it solo, made $8k in month 1 - partner regrets it',
    ],
    questions: [
      'What would convince your wife/partner this is worth it?',
      'Is it the cost they\'d worry about, or the setup time?',
    ],
    closingTactics: [
      'Include them: "Can I send you both a 5-min demo video?"',
      'Show social proof: "Here\'s what other couples/partners are doing"',
      'Assume yes: "I\'ll add you and your partner to the onboarding"',
    ],
  },
  {
    id: 'timing-4',
    objection: 'Tell me more / Not enough information',
    category: 'timing',
    industries: ['all'],
    reframes: [
      'Great! What specific part would help you decide faster?',
      'More info without context can paralyze - let\'s focus on your exact use case',
    ],
    stories: [
      'Analysis paralysis killed a deal - when we narrowed to ONE use case, they bought',
      'CEO wanted "everything" - gave them too much - lost the deal. Learned: specificity sells',
    ],
    questions: [
      'Are you wondering about ROI, setup, or how it handles your specific leads?',
      'What ONE question, if answered, would make you comfortable moving forward?',
    ],
    closingTactics: [
      'Narrow down: "Let\'s not overwhelm. Show me ONE specific concern"',
      'Test drive: "Try it with 5 leads this week - see real results"',
    ],
  },
  {
    id: 'timing-5',
    objection: 'The timing isn\'t right / Not the right season',
    category: 'timing',
    industries: ['retail', 'creator', 'founder'],
    reframes: [
      'Actually, slow season is PERFECT for automation - capture leads when competition sleeps',
      'Waiting for the "right time" means you\'re behind - start now, scale in busy season',
    ],
    stories: [
      'Retailer waited for Q4 to start automation - competitor who started in Q3 had 10x the list',
      'Seasonal business owner automated in slow season, tripled conversions in busy season',
    ],
    questions: [
      'When IS the right time? Let\'s work backward from your busy season',
      'What\'s the cost of NOT being ready when your busy season hits?',
    ],
    closingTactics: [
      'Flip the script: "Slow season is training ground for busy season"',
      'Urgency: "Start now so you\'re ready when customers return"',
    ],
  },
  {
    id: 'timing-6',
    objection: 'Rainstorm / Power outage / Technical issues happened',
    category: 'timing',
    industries: ['all'],
    reframes: [
      'That\'s exactly why you need automation - it works 24/7, even during outages',
      'One technical issue lost you sales - imagine losing sales when YOU\'RE not working',
    ],
    stories: [
      'Store went down during sale - lost $20k. Now uses AI agent - works even when they\'re offline',
    ],
    questions: [
      'How much revenue did that cost you? How many leads went to competitors?',
      'What if your sales rep worked 24/7, rain or shine?',
    ],
    closingTactics: [
      'Position solution: "This is backup to YOU - always working"',
      'Show reliability: "Runs on secure servers, never sleeps"',
    ],
  },

  // PRICE OBJECTIONS (15)
  {
    id: 'price-1',
    objection: 'It\'s too expensive / Too much money',
    category: 'price',
    industries: ['all'],
    reframes: [
      'Compared to what? One lost deal pays for months of automation',
      'You\'re not spending money - you\'re investing in lead capture when you\'re sleeping',
      'Your lost leads are worth more than the tool - think about it',
    ],
    stories: [
      'Coach said "too expensive" - one client from automation paid for 6 months in one conversion',
      'Agency founder hesitated on price - first month closed $25k contract using the system',
    ],
    questions: [
      'What\'s one deal worth to you?',
      'How many leads do you lose monthly because you\'re not following up?',
      'If this brought you ONE extra client/month, would it be worth it?',
    ],
    closingTactics: [
      'ROI focus: "One deal pays for this all year"',
      'Risk reversal: "Try free, prove ROI, then pay"',
      'Payment plan: "What if we made it $X/month instead?"',
      'Assume close: "Let\'s start - we can adjust if needed"',
    ],
    proComparison: 'Pro users report 300-500% ROI in first month. At your scale, even 20% improvement pays for the tool 10x over',
  },
  {
    id: 'price-2',
    objection: 'I can do this myself / I have my team',
    category: 'price',
    industries: ['all'],
    reframes: [
      'At $X/hour, your time costs more than this tool - math doesn\'t work',
      'Your team is good at sales, not following up 200 leads at 2am',
      'You CAN - but should you, with your hourly rate?',
    ],
    stories: [
      'CEO tried to do it themselves - wasted 40 hours/week, hired us, freed up time for revenue work',
      'Agency had "system" - took 10 hours/week - automation does it in 10 minutes',
    ],
    questions: [
      'How many hours/week does your team spend on follow-ups?',
      'What would your team do with an extra 10 hours/week?',
      'How many conversations does your team have at 3am when prospects are thinking?',
    ],
    closingTactics: [
      'Time value: "Your time is worth $X - this tool is half that cost per hour saved"',
      'Scale play: "Your team can\'t scale - AI can"',
      'Hybrid: "Keep your touch, automate the grunt work"',
    ],
  },
  {
    id: 'price-3',
    objection: 'I\'ll just use a cheaper tool',
    category: 'price',
    industries: ['all'],
    reframes: [
      'Cheaper often means less support and lower ROI - you\'ll waste more time debugging',
      'Tool A does follow-ups, Tool B does personality - we do both + your brand voice',
      'Price is one number - ROI is the only number that matters',
    ],
    stories: [
      'Used competitor (cheaper), lost leads due to bad voice matching - switched, tripled conversions',
      'Founder thought cheaper = better - cheap tool didn\'t know their voice - lost $50k deals',
    ],
    questions: [
      'What does that tool NOT do that we do?',
      'If it costs less but converts 50% fewer leads, is it really cheaper?',
      'What\'s the cost of a bad follow-up ruining your brand?',
    ],
    closingTactics: [
      'Feature comparison: "Here\'s what we do that they don\'t"',
      'Proof: "See these testimonials from people who switched"',
      'Brand value: "Your brand voice is worth the difference"',
    ],
    proComparison: 'Pro tier includes brand voice training that cheaper tools can\'t match - your unique positioning stays intact',
  },
  {
    id: 'price-4',
    objection: 'Can\'t afford it right now / Cash flow issue',
    category: 'price',
    industries: ['founder', 'small-business'],
    reframes: [
      'That\'s when you NEED this - to generate revenue faster',
      'Catch-22: You can\'t afford it, but you\'re losing deals because you can\'t follow up',
      'This SOLVES cash flow - brings revenue faster so you can afford more solutions',
    ],
    stories: [
      'Broke founder said "can\'t afford it" - borrowed from friend, made $40k first month',
      'Struggling agency used our system free trial, ROI proved case for premium - cash flow issue solved',
    ],
    questions: [
      'What if this brought in ONE client and solved your cash flow?',
      'How many deals go cold because you\'re focused on money problems instead of sales?',
    ],
    closingTactics: [
      'Trial: "Start free, prove the ROI, then invest"',
      'Revenue first: "Use this to close deals, PAY with profits"',
      'Installment: "Start with basic tier, upgrade when revenue comes"',
    ],
  },
  {
    id: 'price-5',
    objection: 'I need to compare with competitors',
    category: 'price',
    industries: ['all'],
    reframes: [
      'Most competitors do the same thing - what matters is YOUR results',
      'Comparing price misses the point - compare CONVERSIONS',
      'Test both - may surprise you which actually converts more',
    ],
    stories: [
      'Founder compared 5 tools - ours was NOT cheapest, but closed 3x more deals - chose us',
      'Agency did side-by-side test - cheaper tool looked good, our tool converted real deals',
    ],
    questions: [
      'Are you comparing price or results?',
      'Would you pay 20% more if it meant 50% better conversions?',
      'What specific features matter most to you?',
    ],
    closingTactics: [
      'Trial comparison: "Test both, we\'ll wait"',
      'Feature value: "Here\'s what you get that they don\'t"',
      'Proof over price: "See the testimonials - they chose us despite higher price"',
    ],
  },
  {
    id: 'price-6',
    objection: 'You\'re charging for features that should be free',
    category: 'price',
    industries: ['all'],
    reframes: [
      'Those "features" are sophisticated AI - not button-clicks',
      'You pay for voice matching, brand learning, conversion optimization - that\'s not free anywhere',
      'Free tools don\'t invest in YOUR success - we do',
    ],
    stories: [
      'Free tool user lost $15k deal due to generic response - our Pro tier learned their brand, closed it',
    ],
    questions: [
      'What free tool learns YOUR voice and applies it?',
      'What\'s the cost of a generic automated response ruining your premium positioning?',
    ],
    closingTactics: [
      'Value statement: "This isn\'t a feature, it\'s expertise - your AI sales rep costs less than a hire"',
      'Show ROI: "One extra deal pays for advanced features all year"',
    ],
  },
  {
    id: 'price-7',
    objection: 'Your pricing model is unclear / Confused about tiers',
    category: 'price',
    industries: ['all'],
    reframes: [
      'Let me clarify - what specific part confuses you?',
      'Pricing should be simple - if it\'s not, ask. We want transparency',
    ],
    stories: [],
    questions: [
      'What tier makes most sense for your volume?',
      'Do you understand the ROI difference between tiers?',
    ],
    closingTactics: [
      'Simplify: "Start here, here\'s what you get"',
      'Custom: "What would pricing need to look like for a yes?"',
    ],
  },
  {
    id: 'price-8',
    objection: 'You\'re just like every other SaaS trying to upsell',
    category: 'price',
    industries: ['all'],
    reframes: [
      'Fair - we do have premium tiers. But look at what\'s INCLUDED in free tier first',
      'Difference: We don\'t hide core features - you get 80% of value free, pay for scale',
      'Most SaaS makes you pay to START - we let you start free, pay when you scale',
    ],
    stories: [
      'Founder expected upsell nonsense - pleasantly surprised by how much he got free',
    ],
    questions: [
      'What features do you actually need? Let\'s find right tier',
      'What would make premium tier feel like good value vs. upsell?',
    ],
    closingTactics: [
      'Transparency: "Here\'s exactly what\'s in each tier, no surprises"',
      'Free value: "Try free tier first - you\'ll see the value before paying"',
    ],
  },

  // COMPETITOR OBJECTIONS (8)
  {
    id: 'competitor-1',
    objection: 'My competitor uses Tool X and they\'re doing well',
    category: 'competitor',
    industries: ['all'],
    reframes: [
      'They\'re doing well despite their tool, not because of it',
      'Tool X is good - our system is specifically designed for YOUR niche',
      'One competitor succeeding with a tool doesn\'t mean it\'s best for you',
    ],
    stories: [
      'Competitor used basic tool, still succeeded because of good sales skills - we make it EASY',
      'Agency copied competitor\'s tool, still lost deals because tool wasn\'t trained on THEIR brand',
    ],
    questions: [
      'How much are they paying for that tool?',
      'Are they actually succeeding because of the tool or despite it?',
      'What if they switched to our system with their sales skill + our AI?',
    ],
    closingTactics: [
      'Differentiation: "They succeed DESPITE their tool - imagine with the RIGHT one"',
      'Competitive advantage: "Beat them with better automation"',
      'Risk: "If they realize better tools exist, you\'re behind"',
    ],
  },
  {
    id: 'competitor-2',
    objection: 'Tool X has this feature we don\'t',
    category: 'competitor',
    industries: ['all'],
    reframes: [
      'True - but do you NEED that feature? Most people don\'t use 80% of tool features',
      'We focused on features that actually close deals - not feature bloat',
      'You can\'t use a 500-button tool better than a 50-button tool',
    ],
    stories: [
      'Creator switched from feature-heavy tool to ours - more ROI, simpler',
    ],
    questions: [
      'Have you actually used that feature?',
      'Would that feature bring you closer to your goal?',
      'Does more features = better results in YOUR experience?',
    ],
    closingTactics: [
      'Simplicity sells: "We eliminated features you don\'t need, kept what converts"',
      'Proof: "See what users switched FROM to us and why"',
    ],
  },
  {
    id: 'competitor-3',
    objection: 'They\'ve been around longer / More established',
    category: 'competitor',
    industries: ['all'],
    reframes: [
      'Older doesn\'t mean better - dinosaurs went extinct. We\'re built on latest AI',
      'Fresh means current - we have newest models, they\'re stuck on legacy code',
      'They been around so long, they\'re slow to innovate',
    ],
    stories: [
      'Old tool company slow to adapt, new competitor (us) ate their lunch with better AI',
    ],
    questions: [
      'When was their last major update?',
      'Are they using latest AI models?',
      'Would you rather have old + stable or new + better?',
    ],
    closingTactics: [
      'Innovation play: "We\'re using GPT-4, they\'re on 3.5"',
      'Proof: "Compare our conversion rates to theirs - recency advantage"',
    ],
  },

  // TRUST & AUTHORITY OBJECTIONS (10)
  {
    id: 'trust-1',
    objection: 'I don\'t know if this actually works',
    category: 'trust',
    industries: ['all'],
    reframes: [
      'Fair - which is why we have free trial. TEST it, don\'t believe it',
      'Don\'t take my word - take 50 customer testimonials\' word',
      'Results speak louder than claims - let\'s prove it to YOU',
    ],
    stories: [
      'Skeptical founder tested 7 days, saw results, upgraded to Pro same week',
      'Agency owner thought it was "too good to be true" - first week beat their Q1 projections',
    ],
    questions: [
      'What would PROOF look like to you?',
      'Want to test it with 10 leads this week and see real results?',
    ],
    closingTactics: [
      'Free trial: "You don\'t believe? Test it free."',
      'Social proof: "Here are 100+ case studies, pick your industry"',
      'Risk reversal: "If no results in 7 days, full refund"',
    ],
  },
  {
    id: 'trust-2',
    objection: 'You\'re a new company / Unknown brand',
    category: 'trust',
    industries: ['all'],
    reframes: [
      'We\'re new, but our AI isn\'t - we use battle-tested models',
      'Smaller = better support. You won\'t be ticket #50,000',
      'New means we have skin in the game - we NEED happy customers',
    ],
    stories: [
      'Startup founder almost went with big name, chose us instead, got 10x better support',
      'Agency loved personal touch - bigger company lost them to poor support',
    ],
    questions: [
      'What matters more - company size or YOUR results?',
      'Would you rather work with big company support or founder support?',
    ],
    closingTactics: [
      'Advantage: "Small means we know you personally, respond immediately"',
      'Proof: "Here are customers who switched FROM big brands TO us"',
      'Transparency: "Our team is visible - you can talk to us anytime"',
    ],
  },
  {
    id: 'trust-3',
    objection: 'What if you go out of business?',
    category: 'trust',
    industries: ['all'],
    reframes: [
      'We have multi-year runway - we\'re not a one-hit wonder',
      'Even if we do, your data is YOURS - we export everything',
      'Our customers are making money with us - we\'ll scale with them',
    ],
    stories: [
      'Customer worried about this - saw our financial projections, realized we\'re solid',
    ],
    questions: [
      'What\'s your plan if ANY tool provider goes down? That\'s just risk',
      'More importantly - are you making money with us? If yes, pays for backup plan',
    ],
    closingTactics: [
      'Honesty: "We\'re here to stay - but if something changes, you own your data"',
      'Math: "If you make $100k with us and we\'re $1k/year, you\'re covered"',
    ],
  },
  {
    id: 'trust-4',
    objection: 'Will you sell my data / Privacy concerns',
    category: 'trust',
    industries: ['all'],
    reframes: [
      'Your leads are YOUR competitive advantage - why would we sell them?',
      'We make money from SUBSCRIPTIONS, not data sales',
      'Check our privacy policy - we\'re GDPR/SOC2 compliant',
    ],
    stories: [
      'GDPR attorney reviewed us, gave thumbs up - we\'re serious about privacy',
    ],
    questions: [
      'Have you read our privacy policy?',
      'What would privacy guarantee look like to you?',
    ],
    closingTactics: [
      'Transparency: "Read our policy - zero data sales, ever"',
      'Compliance: "We\'re SOC2 Type II certified"',
      'Incentive: "We make MORE money keeping you than selling your data"',
    ],
  },
  {
    id: 'trust-5',
    objection: 'I heard bad things about you',
    category: 'trust',
    industries: ['all'],
    reframes: [
      'Every business gets negative feedback - what specifically did you hear?',
      'Most bad reviews come from people who didn\'t set up right or wanted free tier to be Pro',
      'Judge US, not rumors',
    ],
    stories: [
      'Customer believed rumors, tested anyway, found them false - now advocates',
    ],
    questions: [
      'From who? Are they a competitor?',
      'What specifically concerned you?',
      'Want to talk to 10 happy customers to get real feedback?',
    ],
    closingTactics: [
      'Direct feedback: "Tell me what you heard - let\'s address it"',
      'Evidence: "Read our recent reviews - trending up"',
      'Offer proof: "Talk to customers yourself"',
    ],
  },
  {
    id: 'trust-6',
    objection: 'This sounds like a scam / Too good to be true',
    category: 'trust',
    industries: ['all'],
    reframes: [
      'Sounds crazy because you\'ve seen worse - bad automation gives us a reputation boost',
      'It\'s good because we spent 2 years perfecting AI voice + lead matching',
      'Not magic, just smart engineering',
    ],
    stories: [
      'Skeptical founder heard same AI pitch 10x - ours was different because WE had results',
    ],
    questions: [
      'What would make this feel REAL vs. too good to be true?',
      'If real people are making this work, why are you skeptical?',
    ],
    closingTactics: [
      'Transparency: "Here\'s how we built this, here\'s our process"',
      'Proof: "Video testimonials from real customers - not actors"',
      'Free trial: "If scam, you get nothing - if real, you get $X value free"',
    ],
  },

  // FIT & DECISION OBJECTIONS (5)
  {
    id: 'fit-1',
    objection: 'This doesn\'t fit our business model',
    category: 'fit',
    industries: ['all'],
    reframes: [
      'Most businesses think that until they test - automation fits more than you think',
      'Your model: What\'s the main problem? We probably solve it',
      'Not a fit yet - let\'s make it fit',
    ],
    stories: [
      'B2B manufacturer thought "no way this works for us" - it did, 300% ROI',
    ],
    questions: [
      'Why specifically won\'t it fit?',
      'Are you certain or assuming?',
      'What WOULD fit? Let\'s customize',
    ],
    closingTactics: [
      'Curiosity: "Let\'s explore - might surprise you"',
      'Custom: "Most won\'t fit perfectly - let\'s modify"',
      'Hybrid: "You still do X, we automate Y"',
    ],
  },
  {
    id: 'fit-2',
    objection: 'This is for bigger companies / We\'re too small',
    category: 'fit',
    industries: ['small-business', 'founder', 'creator'],
    reframes: [
      'Bigger companies use ours because it SCALES - perfect for small businesses',
      'You don\'t need big teams to use this - just you + AI agent',
      'Small is advantage - one person can handle 100 leads with automation',
    ],
    stories: [
      'Solo founder used our system, competed with 50-person company, WON deals',
      'One-person agency tripled revenue using automation that big companies are jealous of',
    ],
    questions: [
      'How many leads can you handle manually per week?',
      'What if you could handle 10x leads with same time investment?',
    ],
    closingTactics: [
      'Advantage play: "Your size is an asset - you\'re agile"',
      'Scaling story: "Start small, grow with us"',
      'Proof: "Show me another small founder succeeding with this"',
    ],
  },
  {
    id: 'fit-3',
    objection: 'My industry is different / Sales doesn\'t work that way',
    category: 'fit',
    industries: ['all'],
    industries: ['B2B', 'healthcare', 'legal', 'manufacturing'],
    reframes: [
      'Every industry thought this till one company in your space tried it',
      'The principles (follow-up, personalization, timing) work in EVERY industry',
      'Let\'s explore what\'s unique about yours and adapt',
    ],
    stories: [
      'Legal firm "wasn\'t right for us" - tried it, closed $500k deal from automation',
      'Manufacturing "too technical" - now using AI to qualify leads, sales team focuses on closing',
    ],
    questions: [
      'What\'s unique about your industry?',
      'What WOULD work in your industry?',
      'Can we test with one small segment?',
    ],
    closingTactics: [
      'Pilot program: "Try with one vertical, expand if works"',
      'Adaptation: "Help me understand YOUR process, we\'ll customize"',
      'Proof: "Here\'s a case study from your exact industry"',
    ],
  },

  // SOCIAL & DECISION OBJECTIONS (remaining to make 50+)
  {
    id: 'social-1',
    objection: 'I\'m worried what my customers will think / They want to talk to humans',
    category: 'social',
    industries: ['all'],
    reframes: [
      'They DO get a human - OUR human does 80% of work, YOUR human does the 20% that closes',
      'Customers love fast responses - AI is faster than your team at 3am',
      'You can white-label it - they\'ll never know it\'s AI',
    ],
    stories: [
      'Agency worried about brand damage - used our system, customers responded BETTER',
      'Coach feared "AI impersonal" - it actually felt MORE personal with personalized messages',
    ],
    questions: [
      'Do your customers prefer slow human response or fast AI response?',
      'What if AI handles follow-ups, YOU close the deal?',
    ],
    closingTactics: [
      'Hybrid approach: "AI warmth-builds, you close the deal"',
      'Transparency option: "Tell customers upfront - many prefer faster response"',
      'Proof: "See how our customers position this to THEIR customers"',
    ],
  },
  {
    id: 'social-2',
    objection: 'I\'m not tech-savvy / Too complicated',
    category: 'social',
    industries: ['small-business', 'creator', 'coach'],
    reframes: [
      'Designed for non-technical people - if you can email, you can use this',
      'Complicated part is behind the scenes - YOU just see simple dashboard',
      'We have onboarding specifically for this',
    ],
    stories: [
      ' 60-year-old business owner (no tech skills) set it up in 30 mins, now closes deals easier',
    ],
    questions: [
      'What specifically feels complicated?',
      'Can I walk you through the setup?',
    ],
    closingTactics: [
      'Onboarding: "We\'ll set it up together"',
      'Simplicity: "If confusing at any point, we fix it"',
      'Support: "We have video tutorials for every step"',
    ],
  },
  {
    id: 'decision-1',
    objection: 'I need more time to decide',
    category: 'decision',
    industries: ['all'],
    reframes: [
      'More time = more leads go to competitors. Urgency is real',
      'Decision gets easier with more info, not more time',
      'What\'s actually making you hesitate?',
    ],
    stories: [
      'Founder wanted to "sleep on it" - slept 5 nights, decision still hard, bought anyway',
      'Delayed decision meant delayed revenue - competitor beat them - regrets waiting',
    ],
    questions: [
      'What specific doubt needs resolving?',
      'If I answered that doubt, would you move forward?',
    ],
    closingTactics: [
      'Clarify: "Let\'s get to the real objection"',
      'Urgency: "Limited spots available, want to reserve?"',
      'Assume close: "Let\'s get you started - you can always pause"',
    ],
  },
  {
    id: 'decision-2',
    objection: 'I\'m satisfied with where we are / No pain to solve',
    category: 'decision',
    industries: ['all'],
    reframes: [
      'Satisfied today = passed by tomorrow. Market moves fast',
      '"Satisfaction" is often "we don\'t know what we\'re missing"',
      'Your competitor isn\'t satisfied - they\'re optimizing',
    ],
    stories: [
      'Founder said "we\'re good" - 6 months later, competitor using AI crushed them',
      'Agency was "satisfied" - market changed, they regret not adapting',
    ],
    questions: [
      'Could you be BETTER? By how much?',
      'What\'s one lead you lost this week?',
      'What if your competitor implements this?',
    ],
    closingTactics: [
      'FOMO play: "Your competitor isn\'t satisfied - they\'re upgrading"',
      'Complacency killer: "Satisfaction kills growth"',
      'Small test: "Try this small thing, see if "satisfied" changes"',
    ],
  },
];

export const getObjectionsByIndustry = (industry: string): Objection[] => {
  return OBJECTIONS_DATABASE.filter(
    obj => obj.industries.includes(industry) || obj.industries.includes('all')
  );
};

export const getObjectionReframe = (objectionId: string, brandContext?: string): string[] => {
  const objection = OBJECTIONS_DATABASE.find(o => o.id === objectionId);
  if (!objection) return [];
  
  if (brandContext) {
    return objection.reframes.map(reframe => 
      reframe.replace(/your brand/gi, brandContext)
    );
  }
  return objection.reframes;
};

export const getSalesStrategy = (objectionId: string): {
  questions: string[];
  stories: string[];
  closingTactics: string[];
} => {
  const objection = OBJECTIONS_DATABASE.find(o => o.id === objectionId);
  if (!objection) return { questions: [], stories: [], closingTactics: [] };
  
  return {
    questions: objection.questions,
    stories: objection.stories,
    closingTactics: objection.closingTactics,
  };
};
