# Real-Time Messaging System Implementation Guide

## Overview

This implementation provides a complete real-time messaging system with draft persistence, email tracking, and instant synchronization across all dashboard views.

## Features Implemented

### 1. Draft Persistence (Auto-Save)
- **Location**: `/server/routes/drafts-routes.ts`
- **Hook**: `useD raft()` in `/client/src/hooks/use-draft.tsx`
- **Database**: `message_drafts` table in PostgreSQL
- **Behavior**:
  - Auto-saves message drafts with 500ms debouncing
  - Persists across page reloads and browser restarts
  - Shows "Draft saved" indicator
  - Clears draft after successful send
  - Preserves draft content when switching leads

**Usage**:
```tsx
const draft = useDraft({ leadId, autoSave: true, autoSaveDelay: 500 });

<textarea
  value={draft.content}
  onChange={(e) => draft.setContent(e.target.value)}
  placeholder={draft.isDraft ? 'Continue draft...' : 'Type message...'}
/>
```

### 2. Real-Time Thread UI
- **Component**: `ConversationThread` in `/client/src/components/conversation-thread.tsx`
- **Features**:
  - Messages appear <500ms via WebSocket
  - Auto-scroll to new messages
  - Date grouping with separators
  - Subject line support for email
  - Channel selector (Email/Instagram)
  - Read status indicators

**Key Features**:
- Messages show read status: "Read at HH:MM" (only for outbound messages)
- Link click tracking shows "🔗" indicator
- Messages auto-sync when received/opened by recipient
- Smooth animations and mobile-responsive

### 3. Email Tracking Integration
- **Files**: 
  - `/server/lib/email/email-tracking.ts` (existing)
  - `/client/src/hooks/use-email-tracking.tsx` (new)
- **Tracking Data**:
  - `openedAt`: When recipient opened the email
  - `clickedAt`: When recipient clicked a link
  - `trackingId`: Unique tracking token per message
- **Display**:
  - Read receipts show in messages thread
  - Notifications trigger when email is opened
  - Notifications trigger when links are clicked

**What Gets Tracked**:
- Email opens (via tracking pixel)
- Link clicks (via wrapped URLs)
- Exact timestamps for all events
- IP address and user agent (stored in database)

### 4. Real-Time KPI Updates
- **Broadcast**: `/server/lib/websocket-sync.ts`
- **Events**:
  - `stats_updated`: Dashboard metrics refresh
  - `analytics_updated`: Chart data synchronization
  - `messages_updated`: New messages and status changes
- **Payload**: Full stats object with timestamp
- **Client Sync**: React Query automatic invalidation

**KPIs Updated in Real-Time**:
- Conversion rates
- Response times
- Open rates
- Click rates
- Activity counts
- Pipeline value

### 5. Instant Notifications
- **System**: Browser notifications with sound
- **Triggers**:
  - New message received
  - Email opened
  - Link clicked
  - Lead converted
  - Meeting booked
- **Permissions**: Requests on first load
- **Display**: Toast + push notification + sound

### 6. Activity Stream Synchronization
- **Source**: `/api/dashboard/activity`
- **Real-Time**: Via `activity_updated` WebSocket event
- **Content**:
  - All lead interactions
  - All message events
  - All conversion events
  - Timestamps and actor info

## Database Schema

### Messages Table (Enhanced)
```sql
-- Existing columns
- id: UUID (primary key)
- leadId: UUID (foreign key)
- userId: UUID (foreign key)
- body: text
- subject: text
- provider: enum (email, instagram, etc.)
- direction: enum (inbound, outbound)
- trackingId: text (unique tracking token)

-- Tracking columns
- openedAt: timestamp (when email was opened)
- clickedAt: timestamp (when link was clicked)
- isRead: boolean (message read status)
- metadata: jsonb (custom tracking data)
```

### Message Drafts Table (New)
```sql
CREATE TABLE message_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leadId UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  subject TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'instagram', 'sms', 'whatsapp')),
  savedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## API Endpoints

### Drafts API
```
GET    /api/drafts/:leadId          - Get draft for lead
POST   /api/drafts/:leadId          - Save/update draft
DELETE /api/drafts/:leadId          - Delete draft
```

### Messages API (Enhanced)
```
GET    /api/messages/:leadId        - Get thread messages (includes tracking status)
POST   /api/messages/:leadId        - Send message (auto-deletes draft)
```

## WebSocket Events

### Client → Server
- None required (client listens only for this feature)

### Server → Client
```javascript
// Real-time message updates
socket.on('messages_updated', (payload) => {
  // { action: 'INSERT'|'UPDATE', message: {...} }
  // Shows new messages, read receipts, link clicks
});

// Stats synchronization
socket.on('stats_updated', (payload) => {
  // { stats: {...}, timestamp: '...' }
  // Refreshes all dashboard KPIs
});

// Analytics charts
socket.on('analytics_updated', (payload) => {
  // { data: [...], summary: {...} }
  // Updates charts without page reload
});

// Activity feed
socket.on('activity_updated', (payload) => {
  // { event: 'message', data: {...} }
  // Shows all activities in real-time
});
```

## Integration Points

### 1. Lead Profile Page
```tsx
import { ConversationThread } from '@/components/conversation-thread';

export function LeadDetail({ leadId }) {
  return (
    <ConversationThread 
      leadId={leadId}
      leadEmail="lead@example.com"
      leadName="John Doe"
    />
  );
}
```

### 2. Dashboard Activity Feed
```tsx
import { useRealtime } from '@/hooks/use-realtime';

export function ActivityFeed() {
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsub = subscribe('messages_updated', (msg) => {
      // Update activity display
    });
    return unsub;
  }, [subscribe]);
}
```

### 3. Inbox/Messages View
```tsx
import { useEmailTracking } from '@/hooks/use-email-tracking';

export function InboxView() {
  const { requestNotificationPermission } = useEmailTracking();

  // Request permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);
}
```

## Performance Considerations

### Debouncing
- Draft auto-save: 500ms debounce (configurable)
- Prevents excessive database writes
- User sees immediate visual feedback

### WebSocket Optimization
- Uses existing Socket.IO connection
- Filters messages by leadId to reduce bandwidth
- Query client invalidation is efficient (React Query)
- No polling, pure push-based architecture

### Database
- Indexes on (userId, leadId) for draft queries
- Indexes on trackingId for tracking lookups
- Message history kept for audit trail

## Troubleshooting

### Drafts Not Saving
1. Check `/api/drafts/:leadId` returns 200
2. Verify `message_drafts` table exists
3. Check browser console for errors
4. Verify auto-save delay isn't too high

### Messages Not Appearing in Real-Time
1. Verify WebSocket connection (check browser DevTools)
2. Confirm `messages_updated` event is being emitted
3. Check React Query cache invalidation
4. Verify leadId matches in both sender and receiver

### Read Receipts Not Showing
1. Ensure email was sent with tracking pixel
2. Verify `trackingId` is in message record
3. Check email open tracking endpoint is working
4. Verify `openedAt` timestamp is being set

### Stats Not Updating
1. Check `stats_updated` WebSocket event is emitted
2. Verify stats object has all required fields
3. Confirm React Query invalidation triggers
4. Check dashboard component subscribes to events

## Security Notes

- Draft content is user-specific (verified via userId)
- Messages are lead-owned (verified via lead.userId)
- Tracking tokens are cryptographically random
- All API endpoints require authentication
- WebSocket connection validates userId on connect

## Future Enhancements

1. **Typing Indicators**: Show "User is typing..." in real-time
2. **Read Confirmations**: Show when recipient read our message (not just opened)
3. **Encryption**: End-to-end encryption for sensitive messages
4. **Drafts Backup**: Backup drafts to cloud for multi-device access
5. **Message Reactions**: Add emoji reactions to messages
6. **Message Search**: Full-text search across all messages
7. **Auto-Replies**: Intelligent auto-reply system
8. **Message Scheduling**: Schedule messages for later send

## Testing

### Manual Testing Checklist
- [ ] Create draft, close browser, reopen - draft persists
- [ ] Type in one lead, switch to another, switch back - text remains
- [ ] Send message - draft clears automatically
- [ ] Open message thread - messages appear within 500ms
- [ ] Another user sends message - appears instantly
- [ ] Email is opened - read receipt shows with timestamp
- [ ] Link is clicked - click indicator appears
- [ ] Dashboard stats update - KPIs refresh without page reload
- [ ] Notifications - sound plays and toast shows
- [ ] Mobile view - thread scrolls smoothly, compose area accessible

## Files Created/Modified

### New Files
- `/server/routes/drafts-routes.ts` - Draft API endpoints
- `/client/src/hooks/use-draft.tsx` - Draft management hook
- `/client/src/hooks/use-email-tracking.tsx` - Email tracking listener
- `/client/src/components/conversation-thread.tsx` - Thread UI component
- `/shared/schema.ts` - Added messageDrafts table + types

### Modified Files
- `/server/storage.ts` - Added draft methods to interface
- `/server/drizzle-storage.ts` - Implemented draft methods
- `/server/routes/index.ts` - Registered drafts route
- `/server/lib/websocket-sync.ts` - Added stats/analytics events
- `/server/routes/dashboard-routes.ts` - Emit real-time updates
- `/server/routes/messages-routes.ts` - Fixed trackingId scope
- `/client/src/hooks/use-realtime.tsx` - Enhanced event handlers

## Deployment Checklist

- [ ] Run database migration for `message_drafts` table
- [ ] Verify WebSocket connection in production
- [ ] Test email tracking with real Gmail/Outlook accounts
- [ ] Configure notification permissions flow
- [ ] Monitor database for draft table growth
- [ ] Set up alerts for WebSocket connection issues
- [ ] Test cross-device draft synchronization
- [ ] Verify all KPI updates in production
