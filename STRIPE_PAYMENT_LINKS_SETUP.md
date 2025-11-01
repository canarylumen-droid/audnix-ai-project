
# 🔗 Stripe Payment Links Setup Guide

## Overview
This guide shows you how to create **7 payment links** in Stripe for Audnix AI subscriptions and voice minute top-ups.

## Required Payment Links

### 1. Subscription Plans (3 links)

#### Starter Plan - $49.99/month
1. Go to Stripe Dashboard → **Payment Links** → **New**
2. Set **Amount**: `$49.99 USD`
3. Set **Billing**: `Recurring` → `Monthly`
4. **Product Name**: `Audnix AI - Starter Plan`
5. **Description**: `2,500 leads/month • 100 voice minutes • Instagram & WhatsApp • AI automation`
6. **Metadata** (Important):
   - `plan_id`: `starter`
   - `leads_limit`: `2500`
   - `voice_minutes`: `100`
7. Copy the link → Add to `.env` as `STRIPE_PAYMENT_LINK_STARTER`

#### Pro Plan - $99.99/month
1. Create new Payment Link
2. **Amount**: `$99.99 USD` → `Monthly recurring`
3. **Product Name**: `Audnix AI - Pro Plan`
4. **Description**: `7,000 leads/month • 400 voice minutes • All integrations • Priority support`
5. **Metadata**:
   - `plan_id`: `pro`
   - `leads_limit`: `7000`
   - `voice_minutes`: `400`
6. Copy → `.env` as `STRIPE_PAYMENT_LINK_PRO`

#### Enterprise Plan - $199.99/month
1. Create new Payment Link
2. **Amount**: `$199.99 USD` → `Monthly recurring`
3. **Product Name**: `Audnix AI - Enterprise Plan`
4. **Description**: `20,000 leads/month • 1,000 voice minutes • API access • Dedicated support`
5. **Metadata**:
   - `plan_id`: `enterprise`
   - `leads_limit`: `20000`
   - `voice_minutes`: `1000`
6. Copy → `.env` as `STRIPE_PAYMENT_LINK_ENTERPRISE`

---

### 2. Voice Minute Top-Ups (4 links)

#### 100 Voice Minutes - $7.00
1. Create new Payment Link
2. **Amount**: `$7.00 USD` → `One-time payment`
3. **Product Name**: `Audnix AI - Voice Minutes (100)`
4. **Description**: `Add 100 voice minutes (~1.5 hours of AI voice notes)`
5. **Metadata**:
   - `type`: `voice_topup`
   - `voice_minutes`: `100`
6. Copy → `.env` as `STRIPE_PAYMENT_LINK_VOICE_100`

#### 300 Voice Minutes - $20.00 (Most Popular)
1. **Amount**: `$20.00 USD` → `One-time`
2. **Product Name**: `Audnix AI - Voice Minutes (300)`
3. **Description**: `Add 300 voice minutes (~5 hours) - Best Value!`
4. **Metadata**:
   - `type`: `voice_topup`
   - `voice_minutes`: `300`
5. Copy → `.env` as `STRIPE_PAYMENT_LINK_VOICE_300`

#### 600 Voice Minutes - $40.00
1. **Amount**: `$40.00 USD` → `One-time`
2. **Product Name**: `Audnix AI - Voice Minutes (600)`
3. **Description**: `Add 600 voice minutes (~10 hours of voice automation)`
4. **Metadata**:
   - `type`: `voice_topup`
   - `voice_minutes`: `600`
5. Copy → `.env` as `STRIPE_PAYMENT_LINK_VOICE_600`

#### 1200 Voice Minutes - $80.00 (Power User)
1. **Amount**: `$80.00 USD` → `One-time`
2. **Product Name**: `Audnix AI - Voice Minutes (1200)`
3. **Description**: `Add 1,200 voice minutes (~20 hours) - Maximum value`
4. **Metadata**:
   - `type`: `voice_topup`
   - `voice_minutes`: `1200`
5. Copy → `.env` as `STRIPE_PAYMENT_LINK_VOICE_1200`

---

## Example .env Configuration

```bash
# Subscription Plans
STRIPE_PAYMENT_LINK_STARTER=https://buy.stripe.com/test_xxxxxxxxxxxxxx
STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/test_yyyyyyyyyyyyyy
STRIPE_PAYMENT_LINK_ENTERPRISE=https://buy.stripe.com/test_zzzzzzzzzzzzzz

# Voice Minute Top-ups
STRIPE_PAYMENT_LINK_VOICE_100=https://buy.stripe.com/test_aaaaaaaaaaaa
STRIPE_PAYMENT_LINK_VOICE_300=https://buy.stripe.com/test_bbbbbbbbbbbb
STRIPE_PAYMENT_LINK_VOICE_600=https://buy.stripe.com/test_cccccccccccc
STRIPE_PAYMENT_LINK_VOICE_1200=https://buy.stripe.com/test_dddddddddddd

# Webhook (for payment confirmations)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Testing

1. Use **Test Mode** in Stripe Dashboard first
2. Test card: `4242 4242 4242 4242` (any future date, any CVC)
3. Verify metadata is attached to successful payments
4. Check webhook receives `checkout.session.completed` events

## Production Checklist

- [ ] All 7 payment links created in **Live Mode**
- [ ] Metadata added to each link
- [ ] Links copied to production `.env`
- [ ] Webhook endpoint configured and verified
- [ ] Test purchase completed successfully
- [ ] User receives voice minutes/plan upgrade

## Profit Margins

**Subscriptions:**
- Starter: $49.99 revenue - $7 cost = **$42.99 profit (86%)**
- Pro: $99.99 - $15.50 = **$84.49 profit (84%)**
- Enterprise: $199.99 - $30.50 = **$169.49 profit (85%)**

**Top-ups:**
- 100min: $7 - $1 = **$6 profit (86%)**
- 300min: $20 - $3 = **$17 profit (85%)**
- 600min: $40 - $6 = **$34 profit (85%)**
- 1200min: $80 - $12 = **$68 profit (85%)**

🎉 **Average margin: 85%+ across all products**
