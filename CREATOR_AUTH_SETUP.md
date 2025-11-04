
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

### 3. Brand Your OTP Emails

**Option A: Use Free SMTP (Recommended)**

1. Sign up for free SMTP service:
   - **Brevo (Sendinblue)**: 300 emails/day free → https://www.brevo.com
   - **SendGrid**: 100 emails/day free → https://sendgrid.com
   - **Mailgun**: 5,000 emails/month free → https://mailgun.com

2. Get SMTP credentials from your provider

3. In Supabase → **Authentication** → **Settings**:
   - Enable "Enable custom SMTP"
   - Host: `smtp-relay.brevo.com` (or your provider)
   - Port: `587`
   - Username: Your SMTP username
   - Password: Your SMTP password
   - Sender email: `noreply@audnixai.com` (use a domain you own)
   - Sender name: `Audnix AI`

**Option B: Customize Default Email (No SMTP Needed)**

1. Go to **Authentication** → **Email Templates**
2. Select **Magic Link** template
3. Customize with your branding:
   ```html
   <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1f;padding:40px 20px;">
     <tr>
       <td align="center">
         <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1f2e;border-radius:12px;padding:40px;">
           <tr>
             <td align="center">
               <h1 style="color:#fff;font-size:28px;margin:0 0 10px 0;">Audnix AI</h1>
               <p style="color:#9ca3af;font-size:16px;margin:0 0 30px 0;">Your AI Follow-Up Assistant</p>
               <p style="color:#fff;font-size:18px;margin:0 0 20px 0;">Your sign-in code is:</p>
               <h2 style="color:#10b981;font-size:48px;letter-spacing:12px;margin:0 0 20px 0;font-family:monospace;">{{ .Token }}</h2>
               <p style="color:#9ca3af;font-size:14px;margin:0;">This code expires in 10 minutes.</p>
               <p style="color:#6b7280;font-size:12px;margin:30px 0 0 0;">If you didn't request this code, please ignore this email.</p>
             </td>
           </tr>
         </table>
       </td>
     </tr>
   </table>
   ```

**Email Preview:**
- From: `noreply@mail.supabase.io` (default) or `noreply@audnixai.com` (custom SMTP)
- Subject: "Your Audnix AI Sign-In Code 🔐"
- Body: Branded with your colors and logo

**Which Should You Use?**

- **Just starting?** → Use Option B (free, works immediately)
- **Growing audience?** → Use Option A with Brevo (300 free emails/day)
- **At scale?** → Upgrade SMTP provider as needed

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
