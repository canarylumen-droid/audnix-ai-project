# Voice Minute Pricing Analysis (Updated October 2025)

## Cost Basis & Margin Requirements

**Voice Cost:** $0.01/minute (ElevenLabs standard pricing)  
**Target Margin:** ≥90% gross margin  
**Formula:** Margin = (Price - Cost) / Price

## Updated Plan Inclusions (90%+ Profit Margin)

| Plan | Price/mo | Voice Minutes | Cost | Margin | Profit |
|------|----------|---------------|------|--------|--------|
| **Starter** | $49.99 | 100 mins | $1.00 | **98%** | $48.99 |
| **Pro** | $99.99 | 400 mins | $4.00 | **96%** | $95.99 |
| **Enterprise** | $199.99 | 1,000 mins | $10.00 | **95%** | $189.99 |

**Rationale:**
- Users get voice messages only for **warm/hot leads** (15 seconds each = 0.25 mins)
- 100 minutes = 400 warm lead voice messages
- Conservative allocation ensures high margins while providing real value

## Top-Up Pricing (85%+ Margin)

| Tier | Minutes | Cost | Price | Margin | Best For |
|------|---------|------|-------|--------|----------|
| Small | 100 | $1.00 | $7 | **85.7%** | Quick boost |
| Medium | 300 | $3.00 | $20 | **85.0%** | Best value ⭐ |
| Large | 600 | $6.00 | $40 | **85.0%** | Popular choice |
| XL | 1,200 | $12.00 | $80 | **85.0%** | Power users |

## Business Model: WhatsApp via Twilio

### Pay-Per-Message Model
- **Users connect their own Twilio accounts**
- **Zero cost to platform** for WhatsApp messages
- **Users pay Twilio directly** (~$0.005 per message)
- **Instagram remains free** (Graph API included)
- **Platform profit:** 100% margin on subscriptions (no message costs)

### Benefits
1. **Unlimited scalability** - No messaging costs for platform
2. **No abuse risk** - Users pay their own Twilio bills
3. **Better UX** - Messages come from user's own number
4. **Compliance** - Users handle their own Twilio ToS

## Revenue Projections (Conservative)

### Monthly Recurring Revenue (MRR)
Assuming 100 paying users (very conservative):
- 50 Starter ($49.99 × 50) = $2,499.50
- 35 Pro ($99.99 × 35) = $3,499.65  
- 15 Enterprise ($199.99 × 15) = $2,999.85

**Total MRR:** $8,999.00

### Costs
- Voice API (100 users avg 200 mins/mo): $200/mo
- Infrastructure (hosting, DB): $50/mo
- **Total Costs:** $250/mo

**Net Profit:** $8,749/mo (**97% margin**)

## Stripe Configuration

Update your Stripe product catalog:
- `price_starter_monthly`: $49.99 (100 voice mins)
- `price_pro_monthly`: $99.99 (400 voice mins)
- `price_enterprise_monthly`: $199.99 (1,000 voice mins)

Voice top-ups:
- `price_voice_100`: $7.00
- `price_voice_300`: $20.00
- `price_voice_600`: $40.00
- `price_voice_1200`: $80.00

## Recommendations

1. ✅ **Use updated pricing** - 90%+ margins on plans
2. ✅ **Promote Twilio integration** - Zero platform costs
3. ✅ **Monitor ElevenLabs usage** - Set alerts at $0.012/min
4. ✅ **Upsell top-ups** - High margin add-ons
5. ✅ **Track conversion rates** - Optimize for paid plans

**Last Updated:** October 30, 2025
