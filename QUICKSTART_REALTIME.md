# Quick Start: Real-Time Messaging

## 1. Database Migration

Add the `message_drafts` table to your Neon database:

```sql
CREATE TABLE IF NOT EXISTS message_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  subject TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'instagram', 'sms', 'whatsapp')),
  saved_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_message_drafts_user_lead ON message_drafts(user_id, lead_id);
```

## 2. Import Components in Your Pages

### In Lead Profile / Detail Page
```tsx
import { ConversationThread } from '@/components/conversation-thread';

export function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = useLeadQuery(params.id);

  return (
    <ConversationThread
      leadId={params.id}
      leadEmail={lead?.email}
      leadName={lead?.name}
    />
  );
}
```

### In Inbox / Messages Page
```tsx
import { useEmailTracking } from '@/hooks/use-email-tracking';
import { ConversationThread } from '@/components/conversation-thread';

export function InboxPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { requestNotificationPermission } = useEmailTracking();

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  if (selectedLeadId) {
    return (
      <ConversationThread
        leadId={selectedLeadId}
        leadEmail={selectedLead?.email}
        leadName={selectedLead?.name}
      />
    );
  }

  return <div>Select a lead to start messaging</div>;
}
```

## 3. Features Working

### Auto-Saving Drafts
- Types message
- 500ms after stopping typing, draft saves
- Leave page, return later
- Draft is still there
- Send → draft clears

### Real-Time Messages
- Send message from this tab
- Open same lead in another tab
- Message appears instantly
- No need to refresh

### Email Read Receipts
- Send email message
- Recipient opens email
- "Read at 2:30 PM" appears below message
- If they click a link, "🔗" shows too

### Live Dashboard Updates
- KPIs update without page reload
- Analytics charts refresh
- Activity feed shows new events
- All synchronized with other tabs

### Instant Notifications
- New message → toast + sound
- Email opened → notification
- Link clicked → notification
- Lead converted → alert

## 4. Testing Checklist

### Draft Persistence
```
1. Go to lead conversation
2. Type some text
3. Wait 1 second
4. Refresh page
5. Text should still be there
```

### Real-Time Delivery
```
1. Open lead in two browser tabs
2. Send message from tab 1
3. Tab 2 should show message instantly
4. No refresh needed
```

### Email Tracking
```
1. Send test email
2. Check "Read at" status appears
3. Click tracking link
4. See "🔗" indicator appear
```

### KPI Updates
```
1. Go to dashboard
2. Send a message
3. Check stats updated without refresh
4. Sent count increases in real-time
```

## 5. Configuration

### Draft Auto-Save Delay
```tsx
// Default 500ms, adjust if needed
useDraft({ 
  leadId, 
  autoSave: true,
  autoSaveDelay: 750  // Milliseconds
})
```

### Notification Sounds
Volume is controlled by browser settings. To disable notifications:

```tsx
// In your component
const { requestNotificationPermission } = useEmailTracking();

// Don't call this function to disable notifications
// requestNotificationPermission();
```

### Message Batch Size
```tsx
// In conversation-thread.tsx, adjust message limit
const { limit = "100", offset = "0" } = req.query;  // Line ~18
```

## 6. Troubleshooting

### "Draft not saving"
```
Check browser console:
- Network tab → POST /api/drafts/:leadId
- Should return 200 status
- If 401 → check authentication
- If 404 → check route is registered
```

### "Messages not appearing"
```
Check WebSocket:
- DevTools → Network → WS
- Should see 'messages_updated' event
- Check React Query cache
```

### "Read receipts not showing"
```
Check tracking:
- Message should have trackingId
- Email should contain pixel
- Check database email_tracking table
```

## 7. Environment Variables

No new env vars needed. Uses existing:
- Database credentials (for drafts storage)
- WebSocket URL (for real-time events)
- Email service (for tracking)

## 8. Performance Tips

1. **Limit message history**: Default 100 messages, adjust as needed
2. **Debounce drafts**: 500ms is sweet spot (don't go lower)
3. **Archive old conversations**: Keep database lean
4. **Monitor WebSocket**: Watch for connection issues

## 9. Security

- All draft operations verified by userId
- Messages verified by lead ownership
- Tracking tokens are cryptographically random
- No sensitive data in WebSocket broadcasts

## 10. What's Next?

Recommended enhancements:
- Typing indicators
- Message search
- Scheduled sends
- Templates
- Auto-replies
- Bulk messaging

See `REALTIME_MESSAGING_GUIDE.md` for full documentation.
