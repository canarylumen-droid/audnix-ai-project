
# 🚀 Audnix AI - Automated Setup Guide

This guide shows you how to get **everything working automatically** by just adding your API keys.

## ✅ What Happens Automatically

Once you add your Supabase credentials, the system will:

1. **Create all database tables** (18 tables auto-migrate on startup)
2. **Set up Row Level Security policies** (users can only see their own data)
3. **Enable AI workers** (follow-ups, comment monitoring, insights)
4. **Start voice cloning system** (if ElevenLabs key provided)
5. **Activate payment processing** (if Stripe keys provided)

**You don't need to run ANY manual SQL commands!**

---

## 📝 Step 1: Get Supabase Credentials (Required)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Wait 2 minutes for it to initialize
3. Go to **Settings** → **API**
4. Copy these three values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

5. Add them to **Replit Secrets** (🔒 icon in sidebar)

---

## 🔑 Step 2: Add API Keys (Choose What You Need)

### Required for AI Features
```
OPENAI_API_KEY=sk-proj-xxxxx
```
Get from: https://platform.openai.com/api-keys

### Required for Voice Cloning
```
ELEVENLABS_API_KEY=sk_xxxxx
```
Get from: https://elevenlabs.io/api

### Required for Payments
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```
Get from: https://dashboard.stripe.com/apikeys

### Required for Instagram Comment Automation
```
INSTAGRAM_APP_ID=your-app-id
INSTAGRAM_APP_SECRET=your-app-secret
```
Get from: https://developers.facebook.com/apps

### Optional but Recommended
```
ENCRYPTION_KEY=<generate-with-command-below>
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎯 Step 3: Click Run - That's It!

1. Add your secrets
2. Click the **Run** button
3. Watch the console:

```
🚀 Running database migrations...
  ✅ 000_SETUP_SUPABASE.sql complete
  ✅ 001_create_users.sql complete
  ✅ 002_audnix_schema.sql complete
  ✅ 003_production_upgrade.sql complete
  ✅ 004_add_user_fields.sql complete
  ✅ 005_voice_minutes_migration.sql complete
  ✅ 006_comment_automation.sql complete
✅ All migrations complete!
📊 Your database is ready to use
🤖 Starting AI workers...
✅ AI workers running
Server running at http://0.0.0.0:5000
```

**Done! Your app is live.** 🎉

---

## 📊 What Tables Were Created

The auto-migration created these tables:

### Core Tables
- ✅ **users** - User accounts with plans and billing
- ✅ **leads** - Contacts from Instagram/WhatsApp/Email
- ✅ **messages** - Full conversation history
- ✅ **integrations** - Connected accounts (Instagram, Gmail, etc.)

### Automation Tables
- ✅ **video_monitors** - Videos being watched for comments
- ✅ **processed_comments** - Prevents duplicate DMs
- ✅ **follow_up_queue** - Scheduled AI follow-ups
- ✅ **automations** - Custom automation workflows

### Revenue & Analytics
- ✅ **deals** - Revenue tracking and conversions
- ✅ **payments** - Stripe payment records
- ✅ **notifications** - User alerts and updates
- ✅ **insights** - AI-generated weekly reports

### AI & Knowledge Base
- ✅ **brand_embeddings** - Your brand's voice (pgvector)
- ✅ **semantic_memory** - Conversation context (pgvector)
- ✅ **oauth_tokens** - Provider access tokens
- ✅ **calendar_events** - Meeting bookings

---

## 🎬 Features Ready to Use

### 1. Instagram Comment Automation ✅
**What it does:**
- Monitors your Instagram videos 24/7
- Detects buying intent in comments ("link", "interested", "dm me")
- Auto-DMs leads with personalized message + product link
- Handles price objections like a real salesperson
- Tracks revenue from conversions

**API Endpoints:**
- `POST /api/video-monitors` - Add video to monitor
- `GET /api/video-monitors` - List monitored videos
- `PUT /api/video-monitors/:id` - Update settings
- `DELETE /api/video-monitors/:id` - Stop monitoring

### 2. AI Follow-Up System ✅
- Sends smart follow-ups at human-like intervals
- Adapts tone based on conversation history
- Works across Instagram, WhatsApp, Email
- Stops if lead converts or shows no interest

### 3. Voice Cloning ✅
- Upload 3 voice samples
- AI uses YOUR voice for voice notes
- Tracks usage in minutes
- Auto top-up when running low

**API Endpoints:**
- `POST /api/voice/clone` - Upload voice samples
- `POST /api/voice/send/:leadId` - Send voice note
- `GET /api/voice/balance` - Check remaining minutes

### 4. Revenue Tracking ✅
- Track deals from any source
- Calculate total revenue (USD)
- Monthly breakdown
- Close rate analytics

**API Endpoints:**
- `POST /api/deals` - Create deal
- `GET /api/deals` - List all deals
- `PUT /api/deals/:id` - Update deal status
- `GET /api/revenue` - Get revenue metrics

---

## 🔒 Security Built-In

- ✅ **Row Level Security** - Users can only see their own data
- ✅ **Encrypted OAuth tokens** - All provider credentials encrypted
- ✅ **Session management** - Secure cookie-based sessions
- ✅ **CSRF protection** - Built into all forms
- ✅ **Rate limiting** - Prevents API abuse

---

## 🚨 Troubleshooting

### "relation 'users' does not exist"
**Fix:** Migration failed. Check Supabase credentials in Secrets.

### "Supabase admin not configured"
**Fix:** Add `SUPABASE_SERVICE_ROLE_KEY` to Secrets (not the anon key).

### Voice cloning not working
**Fix:** Add `ELEVENLABS_API_KEY` to Secrets.

### Comment automation not triggering
**Fix:** Add Instagram credentials and ensure video URL is correct.

---

## 📈 Pricing Plans (Auto-Gated)

The system automatically enforces limits based on Stripe subscription:

| Feature | Trial | Starter ($49) | Pro ($99) | Enterprise ($199) |
|---------|-------|---------------|-----------|-------------------|
| Leads | 100 | 2,500 | 7,000 | 20,000 |
| Voice Minutes | 0 | 300 | 800 | 1,000 |
| AI Follow-ups | ✅ | ✅ | ✅ | ✅ |
| Comment Automation | ❌ | ✅ | ✅ | ✅ |
| Revenue Tracking | ✅ | ✅ | ✅ | ✅ |

---

## 🎯 Next Steps

1. **Test the system:**
   - Create a test lead manually
   - Send a message via API
   - Check the AI follow-up queue

2. **Connect providers:**
   - Go to `/dashboard/integrations`
   - Click "Connect Instagram"
   - Follow OAuth flow

3. **Add your first video monitor:**
   ```bash
   POST /api/video-monitors
   {
     "videoId": "instagram-video-id",
     "videoUrl": "https://instagram.com/p/xxxxx",
     "productLink": "https://your-product.com",
     "ctaText": "Get it here"
   }
   ```

4. **Watch it work:**
   - Comment on your video with "link"
   - Watch AI auto-DM you
   - Check `/dashboard/conversations`

---

## 💡 Pro Tips

1. **Voice Minutes:** Start with 100-minute top-up ($7) to test voice cloning
2. **Comment Detection:** More conversational = better conversion (avoid "comment LINK")
3. **Revenue Tracking:** Mark deals as "closed_won" to see accurate revenue
4. **Follow-ups:** Let AI handle 3-5 follow-ups before manual intervention

---

## 🆘 Need Help?

Check the console logs - they'll tell you exactly what's missing:
```
⚠️  Supabase not configured - skipping migrations
📝 To enable auto-migrations, add these to Secrets:
   NEXT_PUBLIC_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   SUPABASE_ANON_KEY
```

**Everything is designed to work automatically. Just add your keys and click Run!** 🚀
