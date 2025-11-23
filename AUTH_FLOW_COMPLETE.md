# 🚀 COMPLETE AUTH FLOWS - USERS & ADMINS

## 📋 USER SIGNUP/LOGIN FLOW

```
Landing Page (/)
  ↓
Click "Sign Up"
  ↓
Enter email (ANY email, no restrictions)
  ↓
POST /api/user/auth/signup/request-otp
  ↓
✉️ Twilio SendGrid sends 6-digit OTP
  ↓
User checks email, enters OTP code
  ↓
POST /api/user/auth/signup/verify-otp
Include: { email, otp, password, username }
  ↓
✅ Account created
  ↓
Set 7-day session (HTTP-only cookie)
  ↓
🏠 Redirect to ONBOARDING
  ↓
Onboarding screens (2-3 slides)
  - Welcome screen
  - Business info setup
  - WhatsApp connection option
  ↓
📊 DASHBOARD (/dashboard)
```

---

## 🔐 ADMIN LOGIN FLOW (WHITELISTED ONLY)

```
Landing Page (/)
  ↓
Click "Admin Login"
  ↓
Enter email (MUST be in whitelist)
  ↓
POST /api/admin/auth/check-email
  ↓
Check: Is email in whitelist?
  ├─ YES → Continue to OTP
  └─ NO → Record failed attempt (1/2)
           If 2 attempts → PERMANENTLY BLOCKED for 1 WEEK
           Show: "Not authorized for admin access"
  ↓
✉️ Twilio SendGrid sends 6-digit OTP
  ↓
POST /api/admin/auth/request-otp
  ↓
User checks email, enters OTP code
  ↓
POST /api/admin/auth/verify-otp
Include: { email, otp }
  ↓
✅ Admin logged in (OTP verified, NO PASSWORD NEEDED)
  ↓
Set 30-day session (HTTP-only cookie)
  ↓
🔒 ADMIN DASHBOARD (/admin)
   - Overview stats
   - User management
   - Payment approvals
   - Analytics
```

---

## 🔑 WHITELIST EMAILS (EXACT)

```
canarylumen@gmail.com
treasure@audnixai.com
team@audnixai.com
```

---

## 🚨 SECURITY - DEVICE BAN

### Failed Attempt 1: Non-Whitelisted Email
```
POST /api/admin/auth/check-email
Body: { email: "hacker@example.com" }

Response:
{
  error: "Not authorized for admin access",
  isWhitelisted: false,
  attempts: 1,
  attemptsRemaining: 1
}
```

### Failed Attempt 2: Same Email/IP
```
POST /api/admin/auth/check-email
Body: { email: "hacker@example.com" }

Response:
{
  error: "Not authorized for admin access",
  isWhitelisted: false,
  attempts: 2,
  attemptsRemaining: 0
}
↓
DEVICE BANNED for 1 WEEK
```

### Attempt 3+: Device Permanently Blocked
```
Response:
{
  error: "Access permanently denied",
  reason: "Access permanently blocked. Device banned after 2 failed attempts. Contact support.",
  blocked: true,
  permanent: true
}
↓
Cannot access for 1 WEEK (prevents daily hacker attempts)
```

---

## 📊 SESSION DURATION

| Type | Duration | Refresh |
|------|----------|---------|
| User | 7 days | Can use password to re-login |
| Admin | 30 days | OTP-only login |

---

## 🎯 API ENDPOINTS QUICK REFERENCE

### USER AUTH (Anyone)
```
POST /api/user/auth/signup/request-otp
  { email }
  
POST /api/user/auth/signup/verify-otp
  { email, otp, password, username }
  
POST /api/user/auth/login
  { email, password }
```

### ADMIN AUTH (Whitelisted Only)
```
POST /api/admin/auth/check-email
  { email }
  
POST /api/admin/auth/request-otp
  { email }
  
POST /api/admin/auth/verify-otp
  { email, otp }
  
GET /api/admin/auth/status
  (returns admin status)
```

---

## 🚀 FRONTEND COMPONENTS (To Build)

### User Signup
- Email input
- OTP input (auto 6-digit code)
- Password input (min 8 chars, show strength meter)
- Username input (min 3 chars)
- Verify button
- Countdown: 60 second resend timer

### User Dashboard
- After signup → Show ONBOARDING
- Onboarding → DASHBOARD (/dashboard)

### Admin Login
- Email input (labeled: "Admin Email Only")
- Check button
- If not whitelisted → Show: "Not authorized"
- If whitelisted → Send OTP
- OTP input
- NO password field
- Verify button

### Security Messages
- Attempt 1 failed: "Email not authorized. 1 attempt remaining."
- Attempt 2 failed: "Email not authorized. Device banned for 1 week. Contact support."
- Blocked: "Access permanently denied. Please contact support."

---

## ✅ READY TO IMPLEMENT

All backend routes are working. Frontend components need to be built using these flows.

---

**Complete system. All security in place. No daily hack attempts possible.** ✨

