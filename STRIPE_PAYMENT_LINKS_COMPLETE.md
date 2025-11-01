
# 🔗 Complete Stripe Payment Links Setup - Audnix AI

## Overview
Create **7 payment links** in Stripe Dashboard for subscriptions and voice minute top-ups.
**NO API keys needed in code** - just paste the links into `.env`

---

## Step-by-Step: Creating Payment Links

### 📍 Access Stripe Dashboard
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Click **Payment links** in left sidebar
3. Click **+ New** button (top right)

---

## 1️⃣ Subscription Plans (3 Links)

### Starter Plan - $49.99/month
1. Click **+ New** → **Create a payment link**
2. **Product**: Click "Add new product"
   - Name: `Audnix AI - Starter Plan`
   - Description: `2,500 leads/month • 100 voice minutes • Instagram & WhatsApp automation`
3. **Pricing**:
   - Amount: `$49.99`
   - Billing: `Recurring` → `Monthly`
4. **Metadata** (scroll down, click "+ Add metadata"):
   - Key: `plan_id` → Value: `starter`
   - Key: `leads_limit` → Value: `2500`
   - Key: `voice_minutes` → Value: `100`
5. Click **Create link**
6. **Copy the link** → Paste in `.env` as:
   ```
   STRIPE_PAYMENT_LINK_STARTER=https://buy.stripe.com/xxxxx
   ```

---

### Pro Plan - $99.99/month
1. Click **+ New**
2. **Product**:
   - Name: `Audnix AI - Pro Plan`
   - Description: `7,000 leads/month • 400 voice minutes • All integrations • Priority support`
3. **Pricing**: `$99.99` → `Recurring` → `Monthly`
4. **Metadata**:
   - `plan_id`: `pro`
   - `leads_limit`: `7000`
   - `voice_minutes`: `400`
5. **Copy link** → `.env`:
   ```
   STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/yyyyy
   ```

---

### Enterprise Plan - $199.99/month
1. Click **+ New**
2. **Product**:
   - Name: `Audnix AI - Enterprise Plan`
   - Description: `20,000 leads/month • 1,000 voice minutes • API access • Dedicated support`
3. **Pricing**: `$199.99` → `Recurring` → `Monthly`
4. **Metadata**:
   - `plan_id`: `enterprise`
   - `leads_limit`: `20000`
   - `voice_minutes`: `1000`
5. **Copy link** → `.env`:
   ```
   STRIPE_PAYMENT_LINK_ENTERPRISE=https://buy.stripe.com/zzzzz
   ```

---

## 2️⃣ Voice Minute Top-Ups (4 Links)

### 100 Minutes - $7.00
1. Click **+ New**
2. **Product**:
   - Name: `Voice Minutes Top-up (100)`
   - Description: `Add 100 voice minutes (~1.5 hours of AI voice notes)`
3. **Pricing**: `$7.00` → **One-time payment** ⚠️ (NOT recurring)
4. **Metadata**:
   - `type`: `voice_topup`
   - `voice_minutes`: `100`
5. **Copy link** → `.env`:
   ```
   STRIPE_PAYMENT_LINK_VOICE_100=https://buy.stripe.com/aaaaa
   ```

---

### 300 Minutes - $20.00 (MOST POPULAR)
1. Click **+ New**
2. **Product**:
   - Name: `Voice Minutes Top-up (300) - Best Value`
   - Description: `Add 300 voice minutes (~5 hours) with 15% savings`
3. **Pricing**: `$20.00` → **One-time**
4. **Metadata**:
   - `type`: `voice_topup`
   - `voice_minutes`: `300`
5. **Copy link** → `.env`:
   ```
   STRIPE_PAYMENT_LINK_VOICE_300=https://buy.stripe.com/bbbbb
   ```

---

### 600 Minutes - $40.00
1. Click **+ New**
2. **Product**:
   - Name: `Voice Minutes Top-up (600)`
   - Description: `Add 600 voice minutes (~10 hours of voice automation)`
3. **Pricing**: `$40.00` → **One-time**
4. **Metadata**:
   - `type`: `voice_topup`
   - `voice_minutes`: `600`
5. **Copy link** → `.env`:
   ```
   STRIPE_PAYMENT_LINK_VOICE_600=https://buy.stripe.com/ccccc
   ```

---

### 1200 Minutes - $80.00 (POWER USER)
1. Click **+ New**
2. **Product**:
   - Name: `Voice Minutes Top-up (1200) - Maximum Value`
   - Description: `Add 1,200 voice minutes (~20 hours) - Best deal for agencies`
3. **Pricing**: `$80.00` → **One-time**
4. **Metadata**:
   - `type`: `voice_topup`
   - `voice_minutes`: `1200`
5. **Copy link** → `.env`:
   ```
   STRIPE_PAYMENT_LINK_VOICE_1200=https://buy.stripe.com/ddddd
   ```

---

## ✅ Final .env Configuration

```bash
# Subscription Plans
STRIPE_PAYMENT_LINK_STARTER=https://buy.stripe.com/xxxxx
STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/yyyyy
STRIPE_PAYMENT_LINK_ENTERPRISE=https://buy.stripe.com/zzzzz

# Voice Minute Top-ups
STRIPE_PAYMENT_LINK_VOICE_100=https://buy.stripe.com/aaaaa
STRIPE_PAYMENT_LINK_VOICE_300=https://buy.stripe.com/bbbbb
STRIPE_PAYMENT_LINK_VOICE_600=https://buy.stripe.com/ccccc
STRIPE_PAYMENT_LINK_VOICE_1200=https://buy.stripe.com/ddddd

# Webhook for payment confirmations
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

## 🧪 Testing in Test Mode

1. In Stripe Dashboard, toggle **Test mode** (top right)
2. Create all 7 payment links in test mode first
3. Test with card: `4242 4242 4242 4242` (any future date, any CVC)
4. Verify webhook receives `checkout.session.completed`

---

## 🚀 Going Live (Production)

1. Toggle **Live mode** in Stripe Dashboard
2. **Recreate all 7 payment links** in live mode (same settings)
3. Update `.env` with **LIVE** payment links
4. Test with a real $1 purchase
5. Verify user receives minutes/plan upgrade

---

## 💰 Profit Margins

**Subscriptions:**
- Starter: $49.99 - $7 cost = **$42.99 profit (86%)**
- Pro: $99.99 - $15.50 = **$84.49 profit (84%)**  
- Enterprise: $199.99 - $30.50 = **$169.49 profit (85%)**

**Top-ups:**
- 100min: $7 - $1 = **$6 profit (86%)**
- 300min: $20 - $3 = **$17 profit (85%)**
- 600min: $40 - $6 = **$34 profit (85%)**
- 1200min: $80 - $12 = **$68 profit (85%)**

**Average profit margin: 85%+ across all products** 🎉

---

## 📝 Checklist

- [ ] All 7 payment links created in Test Mode
- [ ] Metadata added to each link correctly
- [ ] Test purchase completed successfully
- [ ] Webhook receives events
- [ ] All 7 payment links created in Live Mode
- [ ] Live links added to production `.env`
- [ ] Real purchase tested
- [ ] User receives minutes/plan upgrade
- [ ] Email confirmation sent

---

## ⚠️ Important Notes

- **NO Stripe API keys** needed in frontend/backend code
- Payment links handle everything: checkout, webhooks, receipts
- Metadata is critical - don't skip it!
- Always test in Test Mode before going live
- Keep test and live links separate

🎊 **You're done! Users can now subscribe and top up voice minutes.**
