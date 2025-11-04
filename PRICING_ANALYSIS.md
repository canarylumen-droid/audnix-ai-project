
# Voice Minute Pricing Analysis (Updated January 2025)

## Cost Basis & Margin Requirements

**Voice Cost:** $0.01/minute (ElevenLabs standard pricing)  
**Target Margin:** ≥90% gross margin  
**Formula:** Margin = (Price - Cost) / Price

## Updated Plan Inclusions (90%+ Profit Margin)

| Plan | Price/mo | Voice Minutes | Voice Cost | AI Cost | Infra Cost | Total Cost | Margin | Profit |
|------|----------|---------------|------------|---------|------------|------------|--------|--------|
| **Starter** | $49.99 | 100 mins | $1.00 | $2.50 | $0.50 | **$4.00** | **92%** | $45.99 |
| **Pro** | $99.99 | 400 mins | $4.00 | $7.00 | $0.50 | **$11.50** | **88%** | $88.49 |
| **Enterprise** | $199.99 | 1,000 mins | $10.00 | $20.00 | $0.50 | **$30.50** | **85%** | $169.49 |

**Rationale:**
- Users get voice messages only for **warm/hot leads** (15 seconds each = 0.25 mins)
- 100 minutes = 400 warm lead voice messages
- Conservative allocation ensures high margins while providing real value
- AI costs calculated at $0.001 per message (GPT-4o-mini)

## Top-Up Pricing (85%+ Margin)

| Tier | Minutes | Cost | Price | Margin | Best For |
|------|---------|------|-------|--------|----------|
| Small | 100 | $1.00 | $7 | **85.7%** | Quick boost |
| Medium | 300 | $3.00 | $20 | **85.0%** | Best value ⭐ |
| Large | 600 | $6.00 | $40 | **85.0%** | Popular choice |
| XL | 1,200 | $12.00 | $80 | **85.0%** | Power users |

## WhatsApp Business API Cost Analysis

### Platform Cost: $0 (Users Pay Meta Directly!)

**WhatsApp Business API Pricing (Meta):**
- **First 1,000 conversations/month**: FREE 🎉
- **User-initiated conversations**: FREE (when customer messages first)
- **Business-initiated conversations**: $0.005-$0.01 per message (varies by country)

**Our Integration Model:**
1. Users connect their **own** WhatsApp Business accounts
2. They authenticate via Meta OAuth during onboarding
3. We store encrypted credentials (phone number ID, access token)
4. All messages are sent from **their** account
5. They pay Meta directly for any overage beyond 1,000 conversations/month

**Platform Messaging Costs:**
- WhatsApp: **$0** (users pay Meta)
- Instagram: **$0** (free Graph API)
- Email: **$0** (users connect Gmail/Outlook)

**Total Messaging Cost to Platform:** **$0** 🚀

### Why This is Revolutionary

**Competitors' Model (like ManyChat):**
- They charge $15-50/mo for WhatsApp integration
- They use Twilio/third-party gateways ($0.005-0.01 per message)
- They eat the cost or charge users per message
- Profit margins: 40-60%

**Our Model:**
- Users connect their own WhatsApp Business accounts
- First 1,000 conversations/month FREE from Meta
- After 1,000, users pay Meta directly (~$0.005-0.01/msg)
- We pay $0 for messaging
- Profit margins: **90%+** 🎉

## Revenue Projections (Conservative)

### Monthly Recurring Revenue (MRR)
Assuming 100 paying users (very conservative):
- 50 Starter ($49.99 × 50) = $2,499.50
- 35 Pro ($99.99 × 35) = $3,499.65  
- 15 Enterprise ($199.99 × 15) = $2,999.85

**Total MRR:** $8,999.00

### Costs
- Voice API (100 users avg 200 mins/mo): $200/mo
- AI Processing (100 users): ~$500/mo
- Infrastructure (Replit Hacker + Supabase Pro): $32/mo
- **Messaging: $0** (users pay Meta/Google directly)
- **Redis: $0** (not needed - using PostgreSQL for sessions/queues)
- **Total Costs:** $732/mo

**Net Profit:** $8,267/mo (**92% margin**) 🚀

### Growth Projections

**At 1,000 Users:**
- MRR: ~$75,000/mo
- Costs: ~$7,500/mo
- Profit: **$67,500/mo (90% margin)**

**At 10,000 Users:**
- MRR: ~$750,000/mo
- Costs: ~$75,000/mo
- Profit: **$675,000/mo (90% margin)**

## Messaging Volume Analysis

### Lead Message Allocation

**Starter Plan (2,500 leads):**
- Initial outreach: 2,500 messages
- Follow-ups (avg 1.5x): 3,750 messages
- **Total: ~6,250 messages/month**
- AI Cost: $6.25 (at $0.001/message)
- Messaging Cost: **$0** (users' own accounts)

**Pro Plan (7,000 leads):**
- Initial outreach: 7,000 messages
- Follow-ups (avg 1.5x): 10,500 messages
- **Total: ~17,500 messages/month**
- AI Cost: $17.50
- Messaging Cost: **$0**

**Enterprise Plan (20,000 leads):**
- Initial outreach: 20,000 messages
- Follow-ups (avg 1.5x): 30,000 messages
- **Total: ~50,000 messages/month**
- AI Cost: $50.00
- Messaging Cost: **$0**

### WhatsApp Business API Benefits

For a typical user:
- First 1,000 conversations: **FREE**
- If they send 2,500 messages (Starter plan):
  - First 1,000: $0
  - Next 1,500: ~$7.50-15 (they pay Meta directly)
  - **Platform cost: $0**

## Stripe Configuration

Update your Stripe product catalog:

**Subscriptions:**
- `price_starter_monthly`: $49.99 (100 voice mins, 2,500 leads)
- `price_pro_monthly`: $99.99 (400 voice mins, 7,000 leads)
- `price_enterprise_monthly`: $199.99 (1,000 voice mins, 20,000 leads)

**Voice Top-ups:**
- `price_voice_100`: $7.00
- `price_voice_300`: $20.00
- `price_voice_600`: $40.00
- `price_voice_1200`: $80.00

## Recommendations

1. ✅ **Use updated pricing** - 90%+ margins on plans
2. ✅ **Promote WhatsApp Business API integration** - Zero platform costs
3. ✅ **Highlight "First 1,000 messages FREE"** - Great selling point
4. ✅ **Monitor ElevenLabs usage** - Set alerts at $0.012/min
5. ✅ **Upsell top-ups** - High margin add-ons
6. ✅ **Track conversion rates** - Optimize for paid plans

## Competitive Advantage

**ManyChat:**
- Charges $15-50/mo for WhatsApp
- Uses Twilio (they eat $0.005-0.01/msg cost)
- Margins: 40-60%

**Audnix AI:**
- Users connect own WhatsApp Business accounts
- First 1,000/month FREE from Meta
- Platform pays $0 for messaging
- Margins: **90%+**

**We win on:**
- Lower pricing ($49 vs $124)
- Better AI (GPT-4o-mini vs keyword triggers)
- Zero messaging costs
- Higher profit margins

**Last Updated:** January 2025
