# Instagram Integration Security Guide

## ⚠️ CRITICAL SECURITY UPDATE

**As of this update, Instagram Private API integration has been REMOVED from this codebase for security and compliance reasons.**

---

## ✅ OFFICIAL Instagram Graph API (ONLY SUPPORTED METHOD)

**Implementation Files:**
- OAuth Flow: `server/routes/oauth.ts`
- OAuth Service: `server/lib/oauth/instagram.ts`
- Instagram Channel: `server/lib/channels/instagram.ts`

### ✅ Benefits

- **Compliant**: Follows Instagram's Terms of Service
- **Secure**: OAuth-based, no password storage
- **Stable**: Officially supported by Meta/Facebook
- **No Ban Risk**: Safe for production use
- **Enterprise-Grade**: 60-day tokens with auto-refresh

### Requirements

1. Instagram Business or Creator account
2. Facebook Developer App
3. OAuth credentials (App ID + Secret)

### Setup Instructions

#### Step 1: Create Facebook Developer App
1. Go to https://developers.facebook.com
2. Create new app → Business → Instagram API
3. Copy App ID and App Secret

#### Step 2: Add to Environment Variables
```bash
INSTAGRAM_APP_ID=your_app_id_here
INSTAGRAM_APP_SECRET=your_app_secret_here
INSTAGRAM_REDIRECT_URI=https://your-app.replit.app/api/oauth/instagram/callback
```

#### Step 3: Convert to Business/Creator Account
1. Open Instagram app
2. Settings → Account → Switch to Professional Account
3. Choose Business or Creator

#### Step 4: Connect via OAuth
1. Navigate to integrations page in your app
2. Click "Connect Instagram"
3. Authorize via Meta OAuth flow
4. Done! Token auto-refreshes before expiry

---

## 🚫 Instagram Private API - DEPRECATED AND REMOVED

### Why It Was Removed

1. **Terms of Service Violation**: Using unofficial APIs violates Instagram's TOS
2. **Account Ban Risk**: Instagram actively detects and bans accounts using unofficial APIs
3. **Security Risks**: Storing user passwords (even encrypted) is a security liability
4. **Instability**: Instagram frequently changes their private endpoints
5. **Legal Liability**: Could expose you and your users to legal action

### Migration Path

If you were using the private API:

1. **Backup your data** - Export any lead information
2. **Disconnect private API** - Remove any stored credentials
3. **Follow setup instructions above** for Official Graph API
4. **Test thoroughly** - Ensure OAuth flow works correctly

### Files Removed

- `server/routes/instagram-private-routes.ts` → Deprecated
- `server/lib/integrations/instagram-private.ts` → Deprecated
- Migration notice added: `server/routes/instagram-private-routes.ts.REMOVED`

---

## 🔒 Security Best Practices

### For Production Deployments

✅ **DO:**
- Use Instagram Business/Creator accounts only
- Store credentials in environment variables (Replit Secrets)
- Enable webhook signature verification
- Monitor API usage in Meta Developer Console
- Implement rate limiting
- Use HTTPS for all OAuth redirects

❌ **DON'T:**
- Store user passwords
- Use personal Instagram accounts for business
- Share API credentials in code or repositories
- Bypass OAuth flows
- Use unofficial/reverse-engineered APIs

### Security Measures Implemented

1. **OAuth 2.0 Flow** - Industry standard authentication
2. **AES-256-GCM Encryption** - All tokens encrypted at rest
3. **Token Auto-Refresh** - Refreshes before expiry
4. **SSRF Protection** - Validates Instagram user IDs (numeric only)
5. **Rate Limiting** - Respects Meta API limits
6. **Origin Validation** - CSRF protection via origin headers

---

## 📊 API Comparison

| Feature | Official Graph API | Private API (Removed) |
|---------|-------------------|----------------------|
| **Compliance** | ✅ TOS Compliant | ❌ Violates TOS |
| **Ban Risk** | ✅ No Risk | ❌ HIGH Risk |
| **Security** | ✅ OAuth 2.0 | ❌ Password Required |
| **Stability** | ✅ Supported | ❌ Frequently Breaks |
| **Account Type** | Business/Creator | Any |
| **Setup Complexity** | Medium | Low |
| **Production Ready** | ✅ Yes | ❌ NO |

---

## 🔍 Security Audit Checklist

- [x] Instagram Private API removed from codebase
- [x] All tokens encrypted with AES-256-GCM
- [x] No passwords stored in database
- [x] SSRF protection for Instagram user IDs
- [x] Rate limits enforced via Meta API limits
- [x] OAuth tokens auto-refresh before expiry
- [x] Webhook signatures verified
- [x] CSRF protection implemented
- [x] Origin validation for API requests
- [x] Secure session management

---

## 📞 Support & Documentation

**Official Instagram API Documentation:**
- Graph API: https://developers.facebook.com/docs/instagram-api
- OAuth Setup: https://developers.facebook.com/docs/facebook-login/web
- Webhooks: https://developers.facebook.com/docs/graph-api/webhooks

**Implementation Files:**
- OAuth Routes: `server/routes/oauth.ts`
- OAuth Service: `server/lib/oauth/instagram.ts`
- Instagram Channel: `server/lib/channels/instagram.ts`

**Related Guides:**
- `CREATOR_AUTH_SETUP.md` - Detailed OAuth setup
- `INTEGRATIONS_GUIDE.md` - Integration overview
- `SECURITY.md` - General security practices

---

## ⚡ Quick Start

```bash
# 1. Set environment variables
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=https://your-app/api/oauth/instagram/callback

# 2. User initiates connection
GET /api/connect/instagram

# 3. User authorizes on Instagram
# (redirected to Instagram OAuth page)

# 4. Callback handles token exchange
# (automatic - handled by server)

# 5. Token stored encrypted
# (AES-256-GCM encryption)

# 6. Ready to use!
POST /api/instagram/send-dm
```

---

**Remember:** Always use the Official Instagram Graph API. The private API has been permanently removed for your security and compliance.
