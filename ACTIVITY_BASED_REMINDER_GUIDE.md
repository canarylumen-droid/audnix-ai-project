# Activity-Based Reminder System

## Triggers & Timing

### Email Sequence (Time-based)
- **+4 hours:** "It's Live" - push to import
- **+50-69 hours:** Day 2 "Just checking in" reminder
- **+50-69 hours (evening):** "Trial ends tomorrow" warning
- **+72 hours:** "Trial ends today" final urgency
- **POST-TRIAL:** Only if no activity + not upgraded

### Activity Checks (Automatic)
The follow-up worker checks:
1. Has user logged in today?
2. Has user imported any leads?
3. Has user taken any action on dashboard?

If **NO activity detected**:
- Send "You haven't missed anything" reminder
- Repeat every 48 hours until they engage or trial ends

## Environment Variables

Add to Replit Secrets:
```
REMINDER_EMAIL_API_KEY=your_api_key_here
REMINDER_EMAIL_ENDPOINT=https://api.yourservice.com/send-email
```

Or if using SendGrid:
```
TWILIO_SENDGRID_API_KEY=SG.xxxxx
AUDNIX_REMINDER_EMAIL_FROM=hello@audnixai.com
```

## Implementation (Follow-up Worker)

The worker runs every 10 minutes and:

1. **Checks signup timestamp:**
   - If +4 hours: Send "It's Live"
   - If +50-69 hours: Send "Just checking in"
   - If +50-69 hours evening: Send "Trial ends tomorrow"
   - If +72 hours: Send "Trial ends today"

2. **Checks activity:**
   - Query user's last login timestamp
   - Query if user imported leads
   - Query if user has any dashboard activity
   - If no activity: Send no-activity reminder

3. **Checks upgrade status:**
   - If trial ended + not upgraded: No more emails (they chose not to use)
   - If upgraded: Stop reminder emails, only billing emails

## Code Example

```typescript
import { generateItsLiveEmail, generateDay2CheckInEmail, generateTrialEndsThermorrow, generateTrialEndsToday, generateNoActivityReminder } from '@/server/lib/email-templates/reminder-sequence';
import { AudnixEmailSender, EmailSenderType } from '@/server/lib/email-system/email-sender';

async function sendActivityBasedReminders() {
  const users = await db.query.users.findMany();

  for (const user of users) {
    const hoursSinceSignup = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60);
    const hasActivity = user.lastLogin > new Date(Date.now() - 24 * 60 * 60 * 1000);

    // +4 hours
    if (hoursSinceSignup >= 4 && hoursSinceSignup < 5 && !user.itsLiveEmailSent) {
      const { html, text } = generateItsLiveEmail({ userName: user.username, userEmail: user.email });
      await AudnixEmailSender.send({
        to: user.email,
        subject: '🚀 It\'s Finally Live - Start Importing Now',
        html, text,
        senderType: EmailSenderType.REMINDERS,
      });
      await db.update(users).set({ itsLiveEmailSent: true });
    }

    // No activity check
    if (!hasActivity && hoursSinceSignup > 12 && !user.noActivityEmailSent) {
      const { html, text } = generateNoActivityReminder({ userName: user.username, userEmail: user.email });
      await AudnixEmailSender.send({
        to: user.email,
        subject: 'You Haven\'t Missed Anything - But Your Leads Are Waiting',
        html, text,
        senderType: EmailSenderType.REMINDERS,
      });
      await db.update(users).set({ noActivityEmailSent: true });
    }
  }
}
```

## Database Fields Needed

Add to users table:
```sql
ALTER TABLE users ADD COLUMN lastLogin TIMESTAMP;
ALTER TABLE users ADD COLUMN itsLiveEmailSent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN day2EmailSent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN trialEndingEmailSent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN trialEndedEmailSent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN noActivityEmailSent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN activityLastSeen TIMESTAMP;
```

## API Key Setup

If using a custom email service API (not SendGrid):

**Request format:**
```json
{
  "to": "user@example.com",
  "subject": "Your Subject",
  "html": "<html>...</html>",
  "text": "Plain text version",
  "from_email": "hello@audnixai.com"
}
```

**Your API should return:**
```json
{
  "success": true,
  "messageId": "xxxxx"
}
```

## Testing

To test emails locally:
```bash
curl -X POST http://localhost:5000/api/test-reminder-email \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "emailType": "its-live"
  }'
```
