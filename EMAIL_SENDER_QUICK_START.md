# Email Sender Quick Start

## 1. Add These Env Vars (Right Now)

Go to your Replit Secrets and add:
```
AUDNIX_REMINDER_EMAIL_FROM=hello@audnixai.com
AUDNIX_BILLING_EMAIL_FROM=billing@audnixai.com
```

## 2. Verify Senders in SendGrid

Visit: https://app.sendgrid.com/settings/sender_auth

- **Add Sender 1:** `hello@audnixai.com` (Reminders)
- **Add Sender 2:** `billing@audnixai.com` (Billing)
- Verify each via email link
- `auth@audnixai.com` already verified ✅

## 3. Use in Your Code

### Send Welcome Email (Day 1)
```typescript
import { generateWelcomeEmail } from '@/server/lib/email-templates/reminder-sequence';
import { AudnixEmailSender, EmailSenderType } from '@/server/lib/email-system/email-sender';

const { html, text } = generateWelcomeEmail({
  userName: user.username, // e.g., "Treasure"
  userEmail: user.email,
});

await AudnixEmailSender.send({
  to: user.email,
  subject: `Welcome to Audnix AI, ${user.username}! 🚀`,
  html,
  text,
  senderType: EmailSenderType.REMINDERS,
});
```

### Send Payment Confirmation (Immediate)
```typescript
import { generatePaymentConfirmationEmail } from '@/server/lib/email-templates/billing-transactional';

const { html, text } = generatePaymentConfirmationEmail({
  userName: user.username,
  userEmail: user.email,
  planName: 'Pro',
  amount: 99,
  invoiceId: 'INV-12345',
  renewalDate: '2025-12-26',
});

await AudnixEmailSender.send({
  to: user.email,
  subject: 'Payment Confirmed - Your Audnix AI Subscription is Active',
  html,
  text,
  senderType: EmailSenderType.BILLING,
});
```

## 4. Schedule Reminders

In your follow-up worker:
```typescript
// Day 1: Welcome (immediate on signup)
// Day 2: Send day 2 email (24 hrs after signup)
// Day 3: Send trial expiring (72 hrs after signup, before expiry)
// Post-trial: Winback if not upgraded (24 hrs after trial end)
```

## 5. That's It!

- Emails send from the right address automatically
- Templates have professional design + copy
- All personalized with user data
- SendGrid handles delivery immediately

Questions? Check `ENV_SETUP_GUIDE.md` for full details.
