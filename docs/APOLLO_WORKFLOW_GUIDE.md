
# Apollo.io → Audnix Automation Workflow

## Goal
Import influencer/creator leads from Apollo.io, then automate outreach via Email + WhatsApp (Instagram coming Week 2+)

---

## Step 1: Export from Apollo.io

1. Search for influencers/creators in your niche
2. Export as CSV with these columns:
   - **Name** (required)
   - **Email** (for automation)
   - **Company** (their brand/channel name)
   - **Instagram Handle** (for manual DM tracking)
   - **Phone/WhatsApp** (optional)

Example CSV:
```csv
Name,Email,Company,Instagram,Phone
Sarah Johnson,sarah@example.com,Beauty By Sarah,@beautybysarah,+1234567890
Mike Chen,mike@example.com,Tech Reviews,@techreviewsmike,+1987654321
```

---

## Step 2: Import to Audnix

1. Go to `/dashboard/lead-import`
2. Upload your Apollo CSV
3. AI auto-maps columns (Name → name, Email → email, etc.)
4. Click "Import Leads"
5. ✅ All leads now in Audnix database

---

## Step 3: Connect Email for Automation

### Option A: Gmail (Recommended)
1. Go to `/dashboard/integrations`
2. Click "Connect Gmail"
3. Authorize with Google OAuth
4. ✅ AI can now send emails on your behalf

### Option B: Custom Domain Email
1. Go to `/dashboard/integrations` → "Custom Domain Email"
2. Enter SMTP details:
   - Server: `smtp.yourdomain.com`
   - Port: `587`
   - Email: `you@yourbusiness.com`
   - Password/App Password
3. ✅ Professional branded emails

---

## Step 4: AI Email Outreach (Automated)

Once Gmail/SMTP connected, AI automatically:

1. **Sends personalized intro** based on their niche
   - Example: "Hey Sarah! Saw your beauty content on Instagram (500k followers!). We built an AI tool specifically for creators like you..."

2. **Follows up if no reply**
   - Day 3: "Quick bump - did you get a chance to check out Audnix?"
   - Day 7: "Last one! We're offering early access to 50 creators this month"

3. **Books demo calls** when interested
   - AI detects "interested" or "tell me more"
   - Sends Google Calendar link
   - Confirms meeting automatically

---

## Step 5: Manual Instagram DMs (For Now)

**Why manual?** Instagram integration launches Week 2+ to ensure safe setup

### Daily Workflow (50-70 DMs/day):
1. Filter leads by "not contacted" status in Audnix
2. Copy AI-generated personalized message from Audnix
3. Manually send on Instagram
4. When they reply, paste conversation into Audnix
5. AI takes over via email follow-ups

### AI-Generated DM Template:
Go to `/dashboard/conversations` → Select lead → "Generate Smart Reply"

Example output:
```
Hey Sarah! 👋 Came across your beauty content - absolutely love the aesthetic!

Quick Q: Do you manually reply to every DM from potential brand collabs? Or are you drowning in messages like most creators?

We built Audnix AI specifically for creators - it's like having a VA who responds to DMs, books calls, and closes deals while you focus on content.

Interested? I can send you a demo link 🚀
```

---

## Step 6: WhatsApp Outreach (Optional)

If you have WhatsApp numbers:

1. Connect WhatsApp at `/dashboard/integrations`
2. AI sends messages via Twilio WhatsApp Business
3. Auto-follows up based on replies
4. Books meetings when interested

---

## ✅ Expected Results

Based on your 50-70 DMs/day workflow:

- **Week 1**: Import 350-490 leads from Apollo
- **Manual Instagram**: 50-70 DMs/day (you do this)
- **AI Email Follow-ups**: 150-200 emails/day (automated)
- **WhatsApp**: 30-50 messages/day (if numbers available)
- **Meetings Booked**: 5-10/week (AI handles scheduling)

### Conversion Funnel:
```
500 leads imported
↓
350 reached via email (70%)
↓
175 opened email (50% open rate)
↓
52 clicked link (30% click rate)
↓
15 booked demo (29% booking rate)
↓
5-7 signed up for Audnix (33-47% close rate)
```

---

## 🚀 Once Instagram Integration Goes Live

Everything becomes fully automated:

1. **Import Apollo leads** → Same as now
2. **AI sends Instagram DMs** → No more manual work!
3. **AI monitors replies** → Real-time engagement
4. **AI books meetings** → Calendar integration
5. **AI follows up via email** → Multi-channel nurture

---

## 🔥 Pro Tips

1. **Segment by niche**: Tag Apollo leads as "Beauty Creators", "Tech Reviewers", etc.
2. **Personalize first message**: Reference their content/follower count (use AI)
3. **Time DMs strategically**: Send when creators are most active (evenings)
4. **Use voice notes**: AI clones your voice for warm leads
5. **Track everything**: Audnix shows who opened, clicked, replied

---

## ⚠️ Current Limitations

- **Instagram DMs**: Manual until Week 2+ (safety reasons)
- **Rate Limits**: Gmail = 500 emails/day, WhatsApp = 1000/day
- **Voice Minutes**: Free trial = 100 mins, upgrade for more

---

## 📊 Tracking Results

Dashboard shows:
- Total leads imported
- Emails sent/opened
- DMs sent (manual tracking)
- Meetings booked
- Conversions

Go to `/dashboard/ai-analytics` for full breakdown.

---

## Need Help?

1. Check `/dashboard/integrations` for connection status
2. Test with 10 leads first before bulk import
3. Review AI-generated messages before automating

**Goal**: Use Audnix AI to sell Audnix AI to other creators! 🎯
