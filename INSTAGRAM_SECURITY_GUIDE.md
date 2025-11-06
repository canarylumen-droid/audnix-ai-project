
# Instagram Integration Security Guide

## ⚠️ IMPORTANT: Two Different APIs

Audnix supports **two Instagram integration methods**:

### 1. ✅ Official Facebook Graph API (RECOMMENDED)
**File:** `server/lib/channels/instagram.ts`

**Pros:**
- ✅ Officially supported by Meta
- ✅ No risk of account bans
- ✅ OAuth-based (no password storage)
- ✅ 60-day long-lived tokens with auto-refresh
- ✅ Enterprise-grade security

**Cons:**
- ❌ Requires Instagram Business or Creator account
- ❌ Requires Facebook Developer App setup
- ❌ More complex OAuth flow

**When to use:** Production environments, client-facing apps

---

### 2. ⚠️ Instagram Private API (USE WITH CAUTION)
**File:** `server/lib/integrations/instagram-private.ts`

**Pros:**
- ✅ Works with personal Instagram accounts
- ✅ No Facebook app needed
- ✅ Simple username/password login

**Cons:**
- ❌ **UNOFFICIAL** - Reverse-engineered API
- ❌ **HIGH BAN RISK** - Instagram actively detects and bans accounts
- ❌ Requires password (encrypted, but still risky)
- ❌ No 2FA support
- ❌ Against Instagram Terms of Service

**When to use:** Personal testing, internal tools (NOT recommended for production)

---

## 🔒 Security Measures Implemented

### For Official Graph API:
1. **OAuth 2.0 Flow** - No passwords stored
2. **AES-256-GCM Encryption** - All tokens encrypted at rest
3. **Token Auto-Refresh** - Refreshes 24 hours before expiry
4. **SSRF Protection** - Validates all Instagram user IDs (numeric only)
5. **Rate Limiting** - Respects Meta API limits

### For Private API:
1. **Session-Only Storage** - Password NEVER stored (only session token)
2. **AES-256-GCM Encryption** - Session tokens encrypted
3. **Conservative Rate Limits** - 50 DMs/hour (reduced from 80)
4. **Human-like Delays** - 3-8 seconds between actions
5. **Priority Queue** - Hot leads processed first
6. **Challenge Detection** - Detects 2FA/verification requests

---

## 📊 Current Default Behavior

**By default, Audnix uses the OFFICIAL Graph API.**

The Private API is **opt-in only** and requires manual connection:
```bash
POST /api/instagram-private/connect
{
  "username": "your_username",
  "password": "your_password"
}
```

---

## 🛡️ Security Best Practices

### For Production (Official API):
1. ✅ Use Instagram Business/Creator accounts only
2. ✅ Store `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET` in Replit Secrets
3. ✅ Enable webhook signature verification
4. ✅ Monitor API usage in Meta Developer Console
5. ✅ Set up token refresh monitoring

### For Testing (Private API):
1. ⚠️ Use throwaway test accounts only
2. ⚠️ Never use on production/client accounts
3. ⚠️ Monitor for Instagram rate limit warnings
4. ⚠️ Disconnect immediately if account is flagged
5. ⚠️ Keep rate limits conservative (50/hour max)

---

## 🚨 Known Risks - Private API

### Account Ban Triggers:
- ❌ Sending too many DMs in short time
- ❌ Rapid follow/unfollow actions
- ❌ Using the same IP for multiple accounts
- ❌ Automation patterns (same delay times)
- ❌ Logging in from unusual locations

### Mitigation Strategies:
✅ **Random Delays** - 3-8 second variance between actions
✅ **Priority Queue** - Processes hot leads first, pauses when rate limited
✅ **Smart Resume** - Waits 1 hour + random 5-15 min delay after rate limit
✅ **Session Persistence** - Reuses sessions to avoid repeated logins

---

## 📝 Migration Guide: Private → Official API

If you're currently using the Private API and want to migrate:

### Step 1: Create Facebook Developer App
1. Go to https://developers.facebook.com
2. Create new app → Business → Instagram API
3. Get App ID and App Secret

### Step 2: Add Credentials to Replit Secrets
```
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=https://your-repl.replit.app/api/oauth/instagram/callback
```

### Step 3: Convert Account to Business/Creator
1. Open Instagram app
2. Settings → Account → Switch to Professional Account
3. Choose Business or Creator

### Step 4: Disconnect Private API
```bash
POST /api/instagram-private/disconnect
```

### Step 5: Connect via OAuth
```bash
GET /api/oauth/instagram
# Follow OAuth flow in browser
```

---

## 🔍 Security Audit Checklist

- [ ] All Instagram tokens encrypted with AES-256-GCM
- [ ] No passwords stored in database (Private API uses session tokens only)
- [ ] SSRF protection validates Instagram user IDs
- [ ] Rate limits enforced (50 DMs/hour for Private, Meta limits for Official)
- [ ] Human-like delays implemented (3-8 seconds)
- [ ] OAuth tokens auto-refresh before expiry
- [ ] Webhook signatures verified (Official API)
- [ ] Security warnings shown to users (Private API)

---

## 📞 Support

If you're unsure which API to use or need help setting up OAuth:
1. Check `CREATOR_AUTH_SETUP.md` for official API setup
2. Review `server/lib/oauth/instagram.ts` for OAuth implementation
3. See `server/routes/oauth.ts` for OAuth endpoints

**Recommendation:** Always use the Official Graph API for production deployments.
