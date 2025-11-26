# SendGrid API Keys - Separate Accounts (No Clash)

## Why Separate Keys?

- **OTP emails** (auth@audnixai.com) use one SendGrid account
- **Reminder & Billing emails** use a DIFFERENT SendGrid account
- Prevents delivery issues and rate limiting conflicts
- Keeps authentication isolated from marketing

---

## Setup (2 SendGrid Accounts)

### Account 1: OTP/Authentication
**API Key:** TWILIO_SENDGRID_API_KEY
**Senders:**
- `auth@audnixai.com` (verified ✅)

**In Replit Secrets:**
```
TWILIO_SENDGRID_API_KEY=SG.xxxxx_from_account_1
TWILIO_EMAIL_FROM=auth@audnixai.com
```

### Account 2: Reminders & Billing
**API Key:** AUDNIX_SENDGRID_API_KEY
**Senders:**
- `hello@audnixai.com` (reminders)
- `billing@audnixai.com` (transactions)

**In Replit Secrets:**
```
AUDNIX_SENDGRID_API_KEY=SG.xxxxx_from_account_2
AUDNIX_REMINDER_EMAIL_FROM=hello@audnixai.com
AUDNIX_BILLING_EMAIL_FROM=billing@audnixai.com
```

---

## Quick Setup Checklist

### For Account 1 (OTP):
- [ ] Log in to first SendGrid account
- [ ] Go to Settings → API Keys
- [ ] Create API key (or use existing)
- [ ] Copy to `TWILIO_SENDGRID_API_KEY`
- [ ] Verify `auth@audnixai.com` sender

### For Account 2 (Reminders & Billing):
- [ ] Log in to second SendGrid account (create new or use existing)
- [ ] Go to Settings → API Keys
- [ ] Create API key
- [ ] Copy to `AUDNIX_SENDGRID_API_KEY`
- [ ] Verify `hello@audnixai.com` sender
- [ ] Verify `billing@audnixai.com` sender

---

## Environment Variables (Complete List)

```
# Account 1 - OTP/Authentication
TWILIO_SENDGRID_API_KEY=SG.xxxxx
TWILIO_EMAIL_FROM=auth@audnixai.com

# Account 2 - Reminders & Billing
AUDNIX_SENDGRID_API_KEY=SG.yyyyy
AUDNIX_REMINDER_EMAIL_FROM=hello@audnixai.com
AUDNIX_BILLING_EMAIL_FROM=billing@audnixai.com
```

---

## Email Routing (Automatic)

The system routes emails based on type:

```
✅ OTP Codes → uses TWILIO_SENDGRID_API_KEY
✅ Reminders (It's Live, Day 2, Trial Ending) → uses AUDNIX_SENDGRID_API_KEY
✅ Billing (Payments, Invoices) → uses AUDNIX_SENDGRID_API_KEY
```

---

## Email Design Features

### All Emails Have:
- ✅ Branded CTA buttons (#4A5BFF Electric Blue)
- ✅ Correct URLs for each email type
- ✅ Mobile responsive
- ✅ HTML + plain text versions
- ✅ Professional design (dark navy #1B1F3A)

### CTA Button URLs:
| Email | CTA Link |
|-------|----------|
| It's Live | `/dashboard/lead-import` |
| Day 2 Check In | `/dashboard/lead-import` |
| Trial Ends Tomorrow | `/dashboard/pricing` |
| Trial Ends Today | `/dashboard/pricing` |
| No Activity | `/dashboard` |
| Payment Confirmed | `/dashboard` |
| Invoice | `/dashboard/billing` |

---

## Done!

Once API keys are set, emails send automatically from the correct address with proper branding and no conflicts.
