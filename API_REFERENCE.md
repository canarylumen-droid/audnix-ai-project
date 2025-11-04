
# Audnix AI - API Reference

## Base URL
```
https://yourdomain.com/api
```

## Authentication
All API requests require authentication via session cookies (set after login).

**Headers**:
```
Cookie: connect.sid=xxx
```

---

## Endpoints

### Authentication

#### `POST /api/auth/google`
Login or signup with Google OAuth.

**Request Body**:
```json
{
  "code": "google_oauth_authorization_code"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "plan": "trial",
    "trialExpiresAt": "2024-01-15T00:00:00Z"
  },
  "session": {
    "token": "xxx"
  }
}
```

---

#### `POST /api/auth/otp/request`
Request OTP for email-based login.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

---

#### `POST /api/auth/otp/verify`
Verify OTP and complete login.

**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response** (200):
```json
{
  "user": { ... },
  "session": { ... }
}
```

**Errors**:
- `400`: Invalid or expired OTP
- `404`: User not found

---

### Leads

#### `GET /api/leads`
Get all leads for authenticated user.

**Query Parameters**:
- `status` (optional): Filter by status (new, open, replied, converted, cold)
- `channel` (optional): Filter by channel (instagram, whatsapp, email)
- `search` (optional): Search by name, email, or phone
- `limit` (optional): Max results (default: 50)

**Response** (200):
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "John Doe",
    "channel": "instagram",
    "email": "john@example.com",
    "status": "new",
    "score": 75,
    "warm": false,
    "lastMessageAt": "2024-01-10T12:00:00Z",
    "tags": ["video-comment", "high-interest"],
    "metadata": { ... },
    "createdAt": "2024-01-10T10:00:00Z"
  }
]
```

---

#### `POST /api/leads`
Create a new lead.

**Request Body**:
```json
{
  "name": "Jane Smith",
  "channel": "instagram",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "tags": ["manual-entry"],
  "metadata": {
    "source": "website_form"
  }
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "name": "Jane Smith",
  ...
}
```

---

#### `PATCH /api/leads/:id`
Update an existing lead.

**Request Body**:
```json
{
  "status": "converted",
  "score": 95,
  "warm": true
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "status": "converted",
  ...
}
```

---

### Video Automation

#### `GET /api/video-automation/monitors`
Get all video monitors for user.

**Response** (200):
```json
[
  {
    "id": "monitor_123",
    "userId": "uuid",
    "videoId": "instagram_media_id",
    "videoUrl": "https://instagram.com/p/xxx",
    "productLink": "https://yourbrand.com/product",
    "ctaText": "Get it now",
    "isActive": true,
    "autoReplyEnabled": true,
    "stats": {
      "commentsChecked": 150,
      "dmsSent": 42,
      "conversions": 8,
      "followRequests": 15
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### `POST /api/video-automation/monitors`
Create a new video monitor.

**Request Body**:
```json
{
  "videoId": "instagram_media_id",
  "videoUrl": "https://instagram.com/p/xxx",
  "productLink": "https://yourbrand.com/product",
  "ctaText": "Check it out",
  "metadata": {
    "askFollowOnConvert": true,
    "askFollowOnDecline": false
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "monitor": { ... },
  "message": "AI is now monitoring comments on this video 24/7"
}
```

**Errors**:
- `403`: User on trial plan (premium feature)
- `400`: Invalid video URL

---

#### `PATCH /api/video-automation/monitors/:id`
Update video monitor settings.

**Request Body**:
```json
{
  "isActive": false,
  "productLink": "https://new-link.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "monitor": { ... }
}
```

---

#### `DELETE /api/video-automation/monitors/:id`
Delete a video monitor.

**Response** (200):
```json
{
  "success": true,
  "message": "Monitor deleted"
}
```

---

### AI Features

#### `POST /api/ai/reply`
Generate AI-powered reply for a lead.

**Request Body**:
```json
{
  "message": "How much does it cost?",
  "leadId": "uuid",
  "context": "Previous conversation history..."
}
```

**Response** (200):
```json
{
  "reply": "Great question! Our pricing starts at $49/month...",
  "shouldSendVoice": true,
  "confidence": 0.92
}
```

---

#### `POST /api/ai/voice-note`
Generate voice note for warm/converted leads.

**Request Body**:
```json
{
  "leadId": "uuid",
  "context": "Lead asked about pricing and features"
}
```

**Response** (200):
```json
{
  "script": "Hey John! Thanks for asking about pricing...",
  "audioUrl": "https://elevenlabs.io/audio/xxx.mp3",
  "duration": 18.5
}
```

**Errors**:
- `403`: Insufficient voice minutes
- `400`: Lead not warm/converted

---

### Notifications

#### `GET /api/notifications`
Get user notifications.

**Response** (200):
```json
[
  {
    "id": "uuid",
    "type": "conversion",
    "title": "New conversion!",
    "message": "John Doe from instagram converted to a customer",
    "timestamp": "2024-01-10T12:00:00Z",
    "read": false,
    "actionUrl": "/dashboard/deals"
  }
]
```

---

#### `POST /api/notifications/:id/read`
Mark notification as read.

**Response** (200):
```json
{
  "success": true
}
```

---

## Rate Limiting

**Limits**:
- 100 requests per 15 minutes per IP
- Authenticated requests have higher limits

**Response** (429):
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (e.g., trial plan limitation) |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## Webhooks (Coming Soon)

Users will be able to subscribe to events:
- `lead.created`
- `lead.converted`
- `message.received`
- `meeting.scheduled`
