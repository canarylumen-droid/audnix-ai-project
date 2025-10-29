# Voice Minute Top-Up Pricing Analysis

## Cost Basis & Margin Requirements

**Voice Cost:** $0.01 - $0.02 per minute (ElevenLabs API)  
**Target Margin:** ≥85% gross margin  
**Formula:** Margin = (Price - Cost) / Price

## Current Top-Up Pricing

### At $0.01/min Cost (Best Case)

| Tier | Minutes | Cost | Price | Margin | Status |
|------|---------|------|-------|--------|--------|
| Small | 100 | $1.00 | $7 | 85.7% | ✅ Meets requirement |
| Medium | 300 | $3.00 | $20 | 85.0% | ✅ Meets requirement |
| Large | 600 | $6.00 | $40 | 85.0% | ✅ Meets requirement |
| XL | 1200 | $12.00 | $80 | 85.0% | ✅ Meets requirement |

### At $0.02/min Cost (Worst Case)

| Tier | Minutes | Cost | Price | Margin | Status |
|------|---------|------|-------|--------|--------|
| Small | 100 | $2.00 | $7 | 71.4% | ⚠️ Below target |
| Medium | 300 | $6.00 | $20 | 70.0% | ⚠️ Below target |
| Large | 600 | $12.00 | $40 | 70.0% | ⚠️ Below target |
| XL | 1200 | $24.00 | $80 | 70.0% | ⚠️ Below target |

## Business Recommendations

### Option 1: Lock in $0.01/min ElevenLabs Cost
- Negotiate volume pricing with ElevenLabs
- Monitor usage to stay within lower-cost tier
- **Current pricing works** at this cost level

### Option 2: Adjust Margin Requirement
- Accept 70-85% margins depending on actual cost
- Still highly profitable
- More competitive pricing for customers

### Option 3: Increase Prices for Worst Case
To guarantee 85% margin at $0.02/min:
- 100 min: $13.33
- 300 min: $40.00
- 600 min: $80.00
- 1200 min: $160.00

**Note:** Option 3 pricing may reduce conversion rates significantly.

## Recommended Action

**Use current pricing** ($7/$20/$40/$80) with these safeguards:

1. **Monitor ElevenLabs costs closely** - Set alerts if cost exceeds $0.012/min
2. **Volume discount strategy** - Negotiate with ElevenLabs at scale
3. **Dynamic adjustment** - Increase prices if costs rise above threshold
4. **Document assumption** - Clearly note pricing assumes $0.01/min cost

## Stripe Configuration

Update your Stripe product catalog with these price IDs:
- `price_voice_100`: $7.00 (100 minutes)
- `price_voice_300`: $20.00 (300 minutes)
- `price_voice_600`: $40.00 (600 minutes)
- `price_voice_1200`: $80.00 (1200 minutes)
