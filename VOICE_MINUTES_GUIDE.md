
# 🎤 Voice Minutes Tracking & Top-Up System

## Overview

Audnix AI features a comprehensive voice minutes tracking and top-up system that:
- Tracks real-time usage per user
- Automatically locks voice features when exhausted
- Allows instant Stripe-powered top-ups
- Maintains ≥85% profit margin on all transactions
- Syncs balance updates in real-time via webhooks

---

## 🏗️ Architecture

### Frontend Components

1. **VoiceMinutesWidget** (`client/src/components/VoiceMinutesWidget.tsx`)
   - Real-time usage display
   - Progress bar visualization
   - Lock state UI
   - Top-up CTA button

2. **Pricing Page Top-ups** (`client/src/pages/dashboard/pricing.tsx`)
   - 4 top-up tiers (100, 300, 600, 1200 minutes)
   - Stripe checkout integration
   - Best value highlighting

3. **Integrations Page** (`client/src/pages/dashboard/integrations.tsx`)
   - Sidebar voice usage widget
   - Live balance updates

### Backend API

1. **Voice Balance Endpoint** (`GET /api/voice/balance`)
   ```json
   {
     "total": 300,
     "used": 89,
     "balance": 211,
     "percentage": 29.67,
     "locked": false
   }
   ```

2. **Top-up Checkout** (`POST /api/billing/topup`)
   - Creates Stripe Checkout Session
   - Returns redirect URL
   - Tracks user metadata

3. **Webhook Handler** (`POST /api/billing/webhook`)
   - Processes `checkout.session.completed`
   - Adds minutes to user balance
   - Sends in-app notification

---

## 💰 Pricing Strategy

### Plan Inclusions
- **Starter ($49/mo)**: 300 minutes (5 hours)
- **Pro ($99/mo)**: 800 minutes (13+ hours)
- **Enterprise ($199/mo)**: 1000 minutes (16+ hours)

### Top-Up Tiers (85%+ Margin)

| Minutes | Price | Hours | Margin | Best For |
|---------|-------|-------|--------|----------|
| 100     | $7    | 1.5+  | 86%    | Quick boost |
| 300     | $20   | 5     | 85%    | Best value ⭐ |
| 600     | $40   | 10    | 85%    | Popular choice |
| 1200    | $80   | 20    | 85%    | Power users |

**Cost Basis:** $0.01/minute (ElevenLabs standard pricing)

---

## 🔒 Auto-Lock System

### When Balance Reaches 0

1. **API Check**: Every voice generation request checks balance
2. **Lock Trigger**: If `balance <= 0`, request is rejected
3. **UI Update**: Widget shows lock icon and red banner
4. **User Action**: "Top Up Now" button appears
5. **Modal Display**: Full-screen lock modal (optional)

### Code Flow

```typescript
// Backend check
const balance = await storage.getVoiceMinutesBalance(userId);
if (balance <= 0) {
  return res.status(403).json({ 
    error: "Voice minutes exhausted",
    locked: true 
  });
}
```

```tsx
// Frontend UI
{isLocked && (
  <div className="bg-red-500/10 border border-red-500/20">
    <Lock className="text-red-500" />
    <p>🔒 All voice minutes used</p>
    <Button onClick={() => navigate('/pricing#topups')}>
      Top Up Now
    </Button>
  </div>
)}
```

---

## ⚡ Real-Time Updates

### Polling Strategy
- Widget refetches every 30 seconds via React Query
- Balance updates immediately after webhook processing
- No manual refresh needed

### Webhook Sync
```javascript
// Stripe webhook handler
if (event.type === 'checkout.session.completed') {
  const { userId, topupAmount } = session.metadata;
  
  // Add minutes to balance
  await storage.addVoiceMinutes(userId, topupAmount, 'stripe_topup');
  
  // Send notification
  await storage.createNotification({
    userId,
    type: 'topup_success',
    title: '✅ Top-up successful!',
    message: `+${topupAmount} voice minutes added`
  });
}
```

---

## 📊 Usage Tracking

### Database Schema (Future Enhancement)
```sql
CREATE TABLE voice_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  minutes_used NUMERIC(10, 2),
  source TEXT, -- 'ai_voice', 'clone_generation', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE voice_topups (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  minutes_added INT,
  amount_paid NUMERIC(10, 2),
  stripe_session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Revenue Tracking

### Deal Conversion System
```typescript
// Create deal from converted lead
await storage.createDeal({
  userId,
  leadId: lead.id,
  name: lead.name,
  amount: 997, // USD
  source: lead.channel,
  status: 'closed_won',
  closedAt: new Date()
});

// Calculate revenue
const { total, thisMonth } = await storage.calculateRevenue(userId);
```

### Admin Analytics
- Total revenue (all-time)
- Monthly revenue
- Revenue per user
- Top-up vs subscription breakdown

---

## 🚀 Deployment Checklist

### Environment Variables
```bash
# Set voice minutes per plan
VOICE_MINUTES_PLAN_49=300
VOICE_MINUTES_PLAN_99=800
VOICE_MINUTES_PLAN_199=1000

# Configure Stripe price IDs
STRIPE_PRICE_TOPUP_VOICE_100=price_xxx
STRIPE_PRICE_TOPUP_VOICE_300=price_xxx
STRIPE_PRICE_TOPUP_VOICE_600=price_xxx
STRIPE_PRICE_TOPUP_VOICE_1200=price_xxx
```

### Stripe Setup
1. Create 4 one-time payment products in Stripe Dashboard
2. Copy price IDs to environment variables
3. Configure webhook endpoint: `/api/billing/webhook`
4. Test webhook signature verification

### Testing
1. Sign up for trial account
2. Verify balance shows 0 minutes (trial)
3. Upgrade to Starter plan
4. Verify balance shows 300 minutes
5. Test top-up flow (use Stripe test mode)
6. Confirm webhook updates balance
7. Verify notification appears

---

## 📈 Future Enhancements

- [ ] Usage analytics dashboard
- [ ] Predictive notifications ("You'll run out in 3 days")
- [ ] Auto-renewing top-ups
- [ ] Bulk purchase discounts
- [ ] Gifting voice minutes to team members
- [ ] Usage export (CSV/PDF)

---

## 🛠️ Troubleshooting

### Balance Not Updating
1. Check webhook delivery in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set
3. Check server logs for webhook errors
4. Confirm user metadata in Checkout Session

### Lock Not Triggering
1. Verify API endpoint returns correct balance
2. Check frontend polling interval (should be 30s)
3. Ensure widget component is mounted
4. Test with forced 0 balance

### Top-up Checkout Failing
1. Verify Stripe API keys are correct
2. Check price IDs match environment variables
3. Ensure customer ID exists for user
4. Test with Stripe test card: `4242 4242 4242 4242`

---

## 📞 Support

For issues or questions:
- GitHub Issues: [repo/issues](https://github.com/yourrepo/issues)
- Discord: [community](https://discord.gg/audnix)
- Email: support@audnix.com
