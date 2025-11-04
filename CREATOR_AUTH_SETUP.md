
# Simplified Authentication Setup

## Authentication Methods

We use **2 simple methods** that creators are familiar with:

1. **Google Sign-In** - One-click authentication (recommended)
2. **Email OTP** - Get a 6-digit code via email

## Why These Methods?

✅ **No passwords to remember**
✅ **No phone number required**
✅ **Works on all devices**
✅ **Free - uses Supabase built-in OTP**
✅ **Familiar to creators** (like Instagram/TikTok codes)

## Setup Instructions

### 1. Enable Google OAuth (Recommended)

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-repl-url.repl.co/api/auth/callback`
5. Copy the Client ID and Client Secret
6. Add to Replit Secrets:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### 2. Enable Email OTP (Built-in, No Extra Setup!)

Email OTP is **built into Supabase** - no external provider needed!

1. Go to your Supabase project
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider
4. Configure:
   - ✅ Enable Email provider
   - ✅ Confirm email: **OFF** (for faster onboarding)
   - ✅ Enable Email OTP: **ON**
5. Done! Supabase will send OTP codes automatically

### 3. Customize Email Template (Optional)

1. Go to **Authentication** → **Email Templates**
2. Select **Magic Link** template
3. Customize the message (Supabase sends this for OTP too):
   ```html
   <h2>Your Audnix Sign-In Code 🔐</h2>
   <p>Your verification code is:</p>
   <h1 style="font-size: 32px; letter-spacing: 8px;">{{ .Token }}</h1>
   <p>This code expires in 10 minutes.</p>
   ```

## How It Works for Users

### Google Sign-In:
1. Click "Continue with Google"
2. Choose Google account
3. Instantly signed in ✨

### Email OTP:
1. Enter email address
2. Click "Get 6-Digit Code"
3. Check email for code
4. Enter code
5. Signed in! 🎉

## Testing

1. Start your app: Click the Run button
2. Go to `/auth`
3. Try Google sign-in (if configured)
4. Try email OTP:
   - Enter your email
   - Check your inbox for the 6-digit code
   - Enter code to sign in

## No External Services Needed

Unlike phone/WhatsApp auth which requires Twilio:
- ✅ Email OTP uses **Supabase's built-in system** (free)
- ✅ No API keys needed (beyond Supabase)
- ✅ No monthly fees
- ✅ Unlimited emails

## Benefits for Creators

✅ **Fast onboarding** - Sign in with Google or get instant code
✅ **No phone number needed** - Works everywhere
✅ **Familiar flow** - Like Instagram/TikTok verification codes
✅ **Mobile-friendly** - Easy to copy-paste codes
✅ **Secure** - 6-digit codes expire in 10 minutes
