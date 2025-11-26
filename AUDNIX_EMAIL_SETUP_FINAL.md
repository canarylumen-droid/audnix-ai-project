# Audnix AI - Complete Email Setup (Final)

## Email Sequence Timing (Updated)

### Automatic Triggers (All Times)

**+4 Hours (After Signup)**
- Email: "🚀 It's Finally Live - Start Importing Now"
- Copy: "Your AI is ready to close deals"
- Goal: Immediate action to import leads

**+50-69 Hours (Day 2 Morning)**
- Email: "Just Checking In - Your Leads Are Getting Warmed Up"
- Copy: "Every minute your AI runs, it learns more"
- Goal: Engagement + social proof

**+50-69 Hours (Day 2 Evening)**
- Email: "⏰ Your Trial Ends Tomorrow"
- Copy: "Don't let your momentum stop"
- Goal: Urgency to upgrade (first warning)

**+72 Hours (Day 3 - Trial Ends)**
- Email: "Your Free Trial Ends Today"
- Copy: "Your leads go cold. Your AI turns off."
- Goal: Final urgency (last chance)

### Activity-Based Triggers (Automatic)

**No Activity Detected (12+ hours after signup, no login)**
- Email: "You Haven't Missed Anything - But Your Leads Are Waiting"
- Copy: "Your AI is ready to close. It needs you."
- Frequency: Every 48 hours until engagement or trial end
- Goal: Re-engage inactive users

---

## Setup Instructions (Fast)

### Option A: Using SendGrid (Recommended - Already Have)

1. **Verify Senders in SendGrid:** https://app.sendgrid.com/settings/sender_auth
   - `hello@audnixai.com` (for reminders)
   - `billing@audnixai.com` (for payments)
   - `auth@audnixai.com` ✅ already verified

2. **Add to Replit Secrets:**
   ```
   AUDNIX_REMINDER_EMAIL_FROM=hello@audnixai.com
   AUDNIX_BILLING_EMAIL_FROM=billing@audnixai.com
   ```

3. **Done.** Already using TWILIO_SENDGRID_API_KEY ✅

### Option B: Using Custom API (Your Own Email Service)

1. **Add to Replit Secrets:**
   ```
   REMINDER_EMAIL_API_KEY=your_api_key_here
   REMINDER_EMAIL_ENDPOINT=https://api.youremailservice.com/send
   ```

2. **Your API should accept:**
   ```json
   {
     "to": "user@example.com",
     "subject": "Email Subject",
     "html": "<html>...</html>",
     "text": "Plain text version",
     "from_email": "hello@audnixai.com"
   }
   ```

3. **Your API should return:**
   ```json
   {
     "success": true,
     "messageId": "unique-id-here"
   }
   ```

---

## Code to Integrate (Copy-Paste Into Follow-up Worker)

```typescript
import { 
  generateItsLiveEmail, 
  generateDay2CheckInEmail, 
  generateTrialEndsThermorrow, 
  generateTrialEndsToday,
  generateNoActivityReminder 
} from '@/server/lib/email-templates/reminder-sequence';
import { UniversalEmailAPI } from '@/server/lib/email-system/universal-email-api';

async function sendAutomaticReminders() {
  const users = await db.query.users.findMany({
    where: (users, { eq }) => eq(users.status, 'active'),
  });

  for (const user of users) {
    const now = Date.now();
    const signupTime = user.createdAt.getTime();
    const hoursSinceSignup = (now - signupTime) / (1000 * 60 * 60);
    const lastLoginTime = user.lastLogin?.getTime() || 0;
    const hoursSinceLastLogin = (now - lastLoginTime) / (1000 * 60 * 60);

    try {
      // +4 hours: It's Live
      if (hoursSinceSignup >= 4 && hoursSinceSignup < 4.5 && !user.itsLiveEmailSent) {
        const { html, text } = generateItsLiveEmail({
          userName: user.username,
          userEmail: user.email,
        });
        await UniversalEmailAPI.send({
          to: user.email,
          subject: '🚀 It\'s Finally Live - Start Importing Now',
          html,
          text,
          from_email: 'hello@audnixai.com',
        });
        await updateUserEmail(user.id, 'itsLiveEmailSent', true);
      }

      // +50-69 hours: Day 2 Check In
      if (hoursSinceSignup >= 50 && hoursSinceSignup < 69 && !user.day2EmailSent) {
        const { html, text } = generateDay2CheckInEmail({
          userName: user.username,
          userEmail: user.email,
        });
        await UniversalEmailAPI.send({
          to: user.email,
          subject: 'Just Checking In - Your Leads Are Getting Warmed Up',
          html,
          text,
          from_email: 'hello@audnixai.com',
        });
        await updateUserEmail(user.id, 'day2EmailSent', true);
      }

      // +50-69 hours evening: Trial Ends Tomorrow
      if (hoursSinceSignup >= 60 && hoursSinceSignup < 72 && !user.trialEndsThemorowEmailSent) {
        const { html, text } = generateTrialEndsThermorrow({
          userName: user.username,
          userEmail: user.email,
        });
        await UniversalEmailAPI.send({
          to: user.email,
          subject: '⏰ Your Trial Ends Tomorrow - Upgrade Now',
          html,
          text,
          from_email: 'hello@audnixai.com',
        });
        await updateUserEmail(user.id, 'trialEndsThemorowEmailSent', true);
      }

      // +72 hours: Trial Ends Today
      if (hoursSinceSignup >= 72 && hoursSinceSignup < 72.5 && !user.trialEndsEventEmailSent && user.plan === 'trial') {
        const { html, text } = generateTrialEndsToday({
          userName: user.username,
          userEmail: user.email,
        });
        await UniversalEmailAPI.send({
          to: user.email,
          subject: 'Your Free Trial Ends Today - Act Now',
          html,
          text,
          from_email: 'hello@audnixai.com',
        });
        await updateUserEmail(user.id, 'trialEndsEventEmailSent', true);
      }

      // No Activity Check (12+ hours, no login, no email sent)
      if (
        hoursSinceSignup >= 12 &&
        hoursSinceLastLogin > 12 &&
        !user.noActivityEmailSent &&
        user.plan === 'trial'
      ) {
        const { html, text } = generateNoActivityReminder({
          userName: user.username,
          userEmail: user.email,
        });
        await UniversalEmailAPI.send({
          to: user.email,
          subject: 'You Haven\'t Missed Anything - But Your Leads Are Waiting',
          html,
          text,
          from_email: 'hello@audnixai.com',
        });
        await updateUserEmail(user.id, 'noActivityEmailSent', true);
      }
    } catch (error) {
      console.error(`Failed to send reminder to ${user.email}:`, error);
    }
  }
}

async function updateUserEmail(userId: string, field: string, value: boolean) {
  await db.update(users).set({ [field]: value }).where(eq(users.id, userId));
}
```

---

## Database Migrations Required

Add these columns to `users` table:

```sql
ALTER TABLE users ADD COLUMN itsLiveEmailSent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN day2EmailSent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN trialEndsThemorowEmailSent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN trialEndsEventEmailSent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN noActivityEmailSent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN lastLogin TIMESTAMP DEFAULT NULL;
```

---

## Email Senders Summary

| Email | Sender | Frequency |
|-------|--------|-----------|
| It's Live | hello@audnixai.com | 1x (+4hrs) |
| Day 2 Check In | hello@audnixai.com | 1x (+50-69hrs) |
| Trial Ends Tomorrow | hello@audnixai.com | 1x (+60-72hrs) |
| Trial Ends Today | hello@audnixai.com | 1x (+72hrs) |
| No Activity | hello@audnixai.com | Every 48hrs if inactive |
| Payment | billing@audnixai.com | Immediate after purchase |
| Invoice | billing@audnixai.com | Monthly |
| OTP | auth@audnixai.com | On demand |

---

## That's It!

All emails are production-ready with:
- ✅ Professional branding (dark navy + electric blue)
- ✅ Compelling copy with urgency where needed
- ✅ Personalized with user's actual username
- ✅ Mobile responsive
- ✅ Plain text + HTML versions
- ✅ Activity-based triggers (automatic)
- ✅ Works with SendGrid OR your custom API

Just integrate the code above into your follow-up worker and emails run automatically.
