# Audnix AI - Email Sender Configuration Guide

## Email Senders Setup

You now have 3 email senders for different purposes:

### 1. **hello@audnixai.com** - Reminders & Welcome Emails
- Day 1 Welcome email
- Day 2 Action reminder  
- Day 3 Trial expiring urgency
- Winback / Cold lead recovery emails
- All nurture & engagement emails

### 2. **billing@audnixai.com** - Transactional Emails
- Payment confirmations
- Invoice receipts
- Subscription updates
- Billing-related communications

### 3. **auth@audnixai.com** - Authentication Only
- OTP verification codes
- Login security codes
- Already configured ✅

---

## How to Setup Senders in SendGrid

**Each sender needs to be verified in SendGrid:**

1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Click **Create New Sender** (or **Add Sender**)
3. Fill in:
   - **From Email Address**: `hello@audnixai.com` (or `billing@audnixai.com`)
   - **From Name**: `Audnix AI` 
   - **Reply-To Address**: Same as From Email
   - **Company Address**: Your business address
   - **City, State, Zip**: Your location
4. Click **Create**
5. **Verify the sender** via link sent to your email inbox

**Repeat for both `hello@audnixai.com` and `billing@audnixai.com`**

---

## Environment Variables to Add

Add these to your Replit Secrets:

```
# Already Set ✅
TWILIO_SENDGRID_API_KEY=SG.xxxx...
TWILIO_EMAIL_FROM=auth@audnixai.com

# Add These New:
AUDNIX_REMINDER_EMAIL_FROM=hello@audnixai.com
AUDNIX_BILLING_EMAIL_FROM=billing@audnixai.com
```

---

## Email Sequence Timing (When to Trigger)

### Day 1 (Immediate after signup)
- **Email:** Welcome email with username
- **Trigger:** User completes signup & OTP verification
- **Send From:** `hello@audnixai.com`

### Day 2 (24 hours after signup)
- **Email:** "Let's get your first win" action reminder
- **Trigger:** Scheduled job runs at user's timezone, Day 2 at 9 AM
- **Send From:** `hello@audnixai.com`

### Day 3 (Trial expiring - 72 hours)
- **Email:** "Your free trial ends today" FOMO upgrade
- **Trigger:** Scheduled job runs Day 3 at 9 AM
- **Send From:** `hello@audnixai.com`

### Day 4+ (Post-trial winback)
- **Email:** "Your leads are getting cold"
- **Trigger:** If user didn't upgrade after 24 hours post-trial
- **Send From:** `hello@audnixai.com`
- **Frequency:** Every 3 days if still not upgraded (max 3 emails)

### Payment (Immediate)
- **Email:** Payment confirmation with invoice
- **Trigger:** User upgrades/payment processed
- **Send From:** `billing@audnixai.com`

### Monthly (Recurring)
- **Email:** Invoice receipt for monthly renewal
- **Trigger:** Subscription renewal date
- **Send From:** `billing@audnixai.com`

---

## Implementation Code (Overview)

### Step 1: Use the Email Templates
```typescript
import { generateWelcomeEmail, generateDay2ReminderEmail, generateTrialExpiringEmail, generateWinbackEmail } from '@/server/lib/email-templates/reminder-sequence';
import { generatePaymentConfirmationEmail } from '@/server/lib/email-templates/billing-transactional';
```

### Step 2: Send via SendGrid
```typescript
const { html, text } = generateWelcomeEmail({
  userName: 'Treasure', // from user signup
  userEmail: 'canarylumen1@gmail.com'
});

// Send email
await sendGridAPI.send({
  to: userEmail,
  from: {
    email: process.env.AUDNIX_REMINDER_EMAIL_FROM,
    name: 'Audnix AI'
  },
  subject: 'Welcome to Audnix AI, Treasure! 🚀',
  html: html,
  text: text
});
```

### Step 3: Schedule with Your Job Queue
Use your existing worker (follow-up-worker) to:
- Store user signup date
- Calculate days passed
- Send appropriate email on Day 1, 2, 3
- Check if upgraded, send winback if not

---

## Quick Checklist

- [ ] Verify `hello@audnixai.com` in SendGrid
- [ ] Verify `billing@audnixai.com` in SendGrid
- [ ] Add `AUDNIX_REMINDER_EMAIL_FROM` to Replit Secrets
- [ ] Add `AUDNIX_BILLING_EMAIL_FROM` to Replit Secrets
- [ ] Import email templates into your server code
- [ ] Create scheduled jobs for Day 1, 2, 3 emails
- [ ] Create payment confirmation email trigger
- [ ] Test with real email before launching

---

## Email Preview Text (First Line Users See)

| Email | Preview |
|-------|---------|
| Welcome | "Your AI sales rep is now live and closing deals while you sleep" |
| Day 2 | "First lead contacted in 2-8 minutes, 40%+ reply rate" |
| Day 3 | "Your AI goes quiet and your leads start getting cold" |
| Winback | "Your leads are getting cold. Wake up your sales engine" |
| Payment | "Your AI is closing deals right now 24/7" |

---

That's it! Once senders are verified in SendGrid, emails will send instantly from the correct addresses.
