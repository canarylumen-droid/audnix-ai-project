# ✅ COMPLETE TESTING GUIDE

## 1️⃣ WhatsApp Import Test

**Endpoint:** `POST /api/whatsapp/connect`
```bash
# User connects WhatsApp (QR code scan)
curl -X POST http://localhost:5000/api/whatsapp/connect \
  -H "Authorization: Bearer USER_TOKEN"

# Check status
curl http://localhost:5000/api/whatsapp/status \
  -H "Authorization: Bearer USER_TOKEN"

# Import leads
curl -X POST http://localhost:5000/api/whatsapp/import \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "leadsImported": 42,
  "messagesImported": 156,
  "errors": []
}
```

---

## 2️⃣ OTP/Email Authentication Test

**Full Flow:**
1. **Signup**: `POST /api/auth/signup`
2. **OTP Sent**: Email sent via Resend (or failover: Mailgun, SMTP, Gmail, Outlook)
3. **Verify OTP**: `POST /api/auth/verify-otp`
4. **Login**: `POST /api/auth/login`

**Test Steps:**
```bash
# 1. Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@company.com","password":"Test@1234","company":"My Company"}'

# Response: OTP sent to email (check inbox)

# 2. Verify OTP (from email)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SESSION_TOKEN" \
  -d '{"code":"123456","email":"test@company.com"}'

# 3. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@company.com","password":"Test@1234"}'
```

**Email Flow:**
- OTP Generated: 6-digit code, 10-minute expiration
- Email Subject: "🔐 Your Audnix AI Verification Code"
- Template: Dark-themed, branded with company logo & color
- Providers (fallback order):
  1. Resend (primary)
  2. Mailgun (backup)
  3. Custom SMTP (user's email)
  4. Gmail API
  5. Outlook API

---

## 3️⃣ Email Import Test

**Endpoint:** `POST /api/custom-email/connect`

**Flow:**
1. User pastes SMTP details
2. System validates credentials
3. Auto-imports contacts from their inbox
4. Filters out transactional/OTP emails (AI-powered)
5. Shows real-time progress: "0% → 50% → 100%"

**Test:**
```bash
curl -X POST http://localhost:5000/api/custom-email/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "email": "your-email@gmail.com",
    "password": "your-app-password"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Custom email connected successfully",
  "leadsImported": 427,
  "leadsSkipped": 45,
  "errors": []
}
```

**Filtered (Skipped) Emails Include:**
- ✅ OTP/verification codes (2FA, "verify your account")
- ✅ Transactional (receipts, confirmations, invoices, password resets)
- ✅ Newsletters (marketing, promotions, deals, unsubscribe)
- ✅ System alerts (notification@app.com, alert@service.com)
- ✅ Duplicates (already in system)

**Imported Emails:**
- ✅ Real leads from prospects/customers
- ✅ Business conversations
- ✅ Cold outreach responses

---

## 4️⃣ CSV Lead Upload Test

**Endpoint:** `POST /api/leads/import-csv`

**Format:**
```csv
name,email,phone,company
John Doe,john@company.com,+1234567890,Acme Corp
Jane Smith,jane@startup.io,+0987654321,StartupXYZ
```

**Test:**
```bash
curl -X POST http://localhost:5000/api/leads/import-csv \
  -H "Authorization: Bearer USER_TOKEN" \
  -F "file=@leads.csv"
```

**Response:**
```json
{
  "success": true,
  "imported": 98,
  "skipped": 2,
  "errors": ["jane@startup.io - already exists"]
}
```

**Validation:**
- ✅ Email format validation
- ✅ Duplicate detection (prevents re-importing)
- ✅ Phone number normalization
- ✅ Empty field handling
- ✅ Real-time progress shown in UI

---

## 5️⃣ Campaign Automation Test

**Email Campaign Flow:**
```
Day 1 (8am): Initial contact → 30 emails/day
Day 2 (9am): Follow-up 1 → 50 emails/day  
Day 5 (10am): Follow-up 2 → 100 emails/day
Day 7 (11am): Follow-up 3 → 150 emails/day
```

**Test:**
1. Connect business email (SMTP)
2. Import leads
3. Create campaign with template
4. Schedule send
5. Track opens/clicks/replies

**Expected Behavior:**
- ✅ Sends auto-follow-ups at scheduled times
- ✅ Respects warm-up schedule (gradual increase)
- ✅ Tracks opens, clicks, replies
- ✅ Auto-removes bounced emails
- ✅ Shows real-time delivery metrics

---

## 6️⃣ WhatsApp Messaging Test

**Endpoint:** `POST /api/whatsapp/send`

```bash
curl -X POST http://localhost:5000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Hi! We have a special offer for you.",
    "leadId": "lead-id-123"
  }'
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg-456",
  "sentAt": "2025-11-22T13:50:00Z"
}
```

---

## 7️⃣ Calendly Booking Test

**Endpoint:** `POST /api/calendar/connect-calendly`

```bash
# User pastes their Calendly API token
curl -X POST http://localhost:5000/api/calendar/connect-calendly \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{"apiToken":"calendly_xxxxxxxxxxxxx"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Calendly connected! Ready to book meetings.",
  "userName": "John Doe"
}
```

**Auto-booking Flow:**
1. Lead receives email with booking link
2. Lead clicks "Book Meeting"
3. Calendly booking page opens
4. Lead selects time slot
5. Meeting created in user's Calendly
6. Confirmation sent to both

---

## 8️⃣ Stripe Billing Test

**Endpoint:** `POST /api/billing/create-checkout`

```bash
curl -X POST http://localhost:5000/api/billing/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{"planId":"pro","priceId":"price_xxxx"}'
```

**Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_live_xxx",
  "sessionId": "cs_test_xxx"
}
```

**Webhook Verification:**
- ✅ Payment received → Plan upgrades
- ✅ Webhook signature verified (security)
- ✅ Backup poller checks every 5 minutes
- ✅ Features unlock immediately

---

## Testing Checklist

✅ Signup → OTP → Auth → Onboarding
✅ WhatsApp import (scan QR, fetch contacts)
✅ Email import (SMTP connect, auto-filter, real-time progress)
✅ CSV upload (validation, duplicate check)
✅ Campaign send (Day 1, 2, 5, 7 automation)
✅ Email opens/clicks tracking
✅ Calendly booking (lead selects time, meeting created)
✅ Payment (Stripe checkout, webhook, immediate unlock)
✅ Admin dashboard (user list, analytics)
✅ Settings (Email + Calendar management)

---

## What Actually Works

✅ **OTP Email:** Resend + 4 fallback providers
✅ **WhatsApp:** QR code → auto-import contacts + messages
✅ **Email Import:** AI filters OTP/transactional, shows progress
✅ **Campaigns:** Day-aware automation (24h → 48h → Day 5 → 7)
✅ **Calendly:** User's own account (privacy)
✅ **Stripe:** Payment links + webhook + poller backup
✅ **Admin:** Whitelist (3 admins), user management
✅ **All Free Trial:** Full feature access, no limits until upgrade

