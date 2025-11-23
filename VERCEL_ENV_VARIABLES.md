# 📋 VERCEL ENVIRONMENT VARIABLES - COPY & PASTE

Add these to Vercel project settings:

## Email OTP (TWILIO)
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_EMAIL_FROM=noreply@audnixai.com
TWILIO_SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

## Stripe (Payment Verification)
```
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Database
```
DATABASE_URL=postgresql://user:pass@host/db
```

## OpenAI
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

## Gmail OAuth (Optional)
```
GMAIL_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxxxxxxxxxxxx
```

## Instagram OAuth (Optional)
```
INSTAGRAM_APP_ID=xxxxxxxxxxxxx
INSTAGRAM_APP_SECRET=xxxxxxxxxxxxx
```

## Calendly OAuth (Optional)
```
CALENDLY_CLIENT_ID=xxxxxxxxxxxxx
CALENDLY_CLIENT_SECRET=xxxxxxxxxxxxx
```

## Session Secret (Generate random string)
```
SESSION_SECRET=generate_random_string_here_min_32_chars
ENCRYPTION_KEY=generate_random_string_here_min_32_chars
```

---

## HOW TO GET EACH

### Twilio SendGrid Email
1. Go to Twilio console
2. Settings → API Keys
3. Get Account SID + Auth Token
4. Enable SendGrid integration
5. Get SendGrid API Key

### Stripe
1. Stripe Dashboard → API Keys
2. Copy Public Key + Secret Key
3. Webhooks → Create endpoint for `https://yourdomain.com/api/webhooks/stripe`
4. Get webhook signing secret

### Everything else
Already documented in repo

