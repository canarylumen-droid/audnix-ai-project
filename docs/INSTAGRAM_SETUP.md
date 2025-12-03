# Instagram Integration Setup Guide

## Overview
This guide covers the complete setup for Instagram DM automation in Audnix AI, including Meta API integration, webhooks, and deployment configurations.

## Environment Variables Required

### Facebook/Instagram API (Required)
```bash
# Facebook Developer App credentials
INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret

# Webhook verification token (create your own secure token)
INSTAGRAM_WEBHOOK_TOKEN=your_webhook_verify_token
```

### How to Get These Values

1. **Create a Facebook Developer App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app (Business type)
   - Add Instagram Graph API and Messenger products

2. **Get App ID and Secret**
   - Navigate to App Settings > Basic
   - Copy App ID and App Secret

3. **Configure Instagram Login**
   - Add Instagram Basic Display product
   - Set Valid OAuth Redirect URIs:
     - Development: `https://your-replit-domain.replit.dev/api/oauth/instagram/callback`
     - Production: `https://your-domain.com/api/oauth/instagram/callback`

## Webhook Configuration

### Setting Up Webhooks in Facebook Developer Console

1. **Navigate to Webhooks**
   - In your Facebook App, go to Instagram > Webhooks

2. **Add Callback URL**
   - Development: `https://your-replit-domain.replit.dev/api/webhooks/instagram`
   - Production: `https://your-domain.com/api/webhooks/instagram`

3. **Verify Token**
   - Enter the same token you set as `INSTAGRAM_WEBHOOK_TOKEN`

4. **Subscribe to Events**
   - `messages` - For DM automation
   - `comments` - For comment detection
   - `messaging_postbacks` - For button responses
   - `message_reactions` - For engagement tracking

### Webhook Fields to Subscribe
- `messages`
- `messaging_postbacks`
- `messaging_referral`
- `comments`
- `live_comments`
- `mentions`

## Permissions Required

Your Facebook App needs these permissions approved:
- `instagram_basic` - Basic profile access
- `instagram_manage_messages` - Read and send DMs
- `instagram_manage_comments` - Read and reply to comments
- `pages_show_list` - List connected pages
- `pages_messaging` - Send messages via pages

## Vercel Deployment Configuration

Add these environment variables in Vercel:

```bash
# Instagram Integration
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_WEBHOOK_TOKEN=your_verify_token

# Database
DATABASE_URL=your_neon_postgres_url

# Session
SESSION_SECRET=your_secure_session_secret
ENCRYPTION_KEY=your_32_char_encryption_key

# Email (Optional - for email automation)
TWILIO_SENDGRID_API_KEY=your_sendgrid_key
TWILIO_EMAIL_FROM=your_verified_email

# OpenAI (Optional - for AI features)
OPENAI_API_KEY=your_openai_key
```

## Rate Limiting

The system implements Instagram's rate limits:
- **750 DMs per day** per Instagram Business account
- **Human-like timing**: 30-45 second "reading" delay, 60-150 second reply gaps
- **No bursts**: Queue-based processing prevents spam detection

## DM Automation Flow

1. **Comment Detection**: AI monitors video comments for buying intent
2. **Lead Creation**: New leads are auto-created in the database
3. **Human-like Delay**: 2-8 minute delay before sending DM
4. **Personalized Message**: DM references the comment and user
5. **Objection Handling**: AI handles responses automatically
6. **Meeting Booking**: Auto-books calls when ready

## Voice Notes (Paid Plans Only)

Voice notes on Instagram DMs require:
- Paid subscription (Starter, Pro, or Enterprise)
- Voice sample upload (30-second recording)
- Voice minutes balance

Free trial users see:
- Disabled voice toggle
- "Upgrade to enable voice" prompt
- Text-only DM automation

## Testing Your Integration

1. **Verify Webhook**
   ```bash
   curl "https://your-domain.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
   # Should return: test
   ```

2. **Check OAuth Flow**
   - Go to Dashboard > Integrations
   - Click "Connect Instagram"
   - Complete OAuth flow
   - Verify "Connected" badge appears

3. **Test DM Automation**
   - Comment on a monitored video
   - Wait 2-8 minutes
   - Check if DM was sent

## Troubleshooting

### "Invalid Token" Error
- Verify `INSTAGRAM_APP_SECRET` matches your Facebook App
- Check webhook verify token matches exactly

### "Webhook Not Receiving Events"
- Confirm app is in Live mode (not Development)
- Verify webhook subscriptions are active
- Check server logs for incoming requests

### "OAuth Redirect Mismatch"
- Ensure redirect URI in Facebook App matches exactly
- Check for trailing slashes

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate tokens** - Long-lived tokens auto-refresh
3. **Verify signatures** - All webhook requests are signature-verified
4. **Encrypt credentials** - Stored tokens are AES-256-GCM encrypted

## Revenue Potential

With 5,000 leads and proper automation:
- **Average deal value**: $500-$2,000
- **Conversion rate**: 2-5%
- **Week 1 potential**: $50,000 - $500,000

The key is:
1. Quality lead import (CSV or direct OAuth)
2. Proper voice sample for personalization
3. PDF upload for brand context
4. Consistent comment monitoring