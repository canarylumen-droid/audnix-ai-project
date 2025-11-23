# 🔐 ADMIN WHITELIST SYSTEM - COMPLETE DOCUMENTATION

## ✅ SYSTEM OVERVIEW

**Admin Dashboard** is ONLY accessible to pre-whitelisted emails:
- canarylumen@gmail.com
- treasure@audnixai.com
- team@audnixai.com

**Regular Users** can signup/login with ANY email address.

---

## 🚀 AUTHENTICATION FLOWS

### USER FLOW (Anyone can use)
```
Landing
  ↓
Click "Sign Up"
  ↓
Enter any email → OTP sent → Verify OTP
  ↓
Create password + username
  ↓
Dashboard (/dashboard)
```

**Routes:**
- POST `/api/user/auth/signup/request-otp` - Send OTP to any email
- POST `/api/user/auth/signup/verify-otp` - Create account
- POST `/api/user/auth/login` - Login with email + password

---

### ADMIN FLOW (Whitelist only)
```
Landing
  ↓
Click "Admin Login"
  ↓
Enter whitelisted email
  ├→ Check: Is email in whitelist?
  ├→ YES: OTP sent
  └→ NO: After 2 attempts → Blocked for 24 hours
  ↓
Verify OTP (no password needed)
  ↓
Admin Dashboard (/admin)
```

**Routes:**
- POST `/api/admin/auth/check-email` - Validate email is whitelisted
- POST `/api/admin/auth/request-otp` - Send OTP to admin email
- POST `/api/admin/auth/verify-otp` - Login with OTP
- GET `/api/admin/auth/status` - Check if user is admin

---

## 🔐 SECURITY FEATURES

### 1. Email Whitelist
```typescript
ADMIN_WHITELIST_EMAILS=canarylumen@gmail.com,treasure@audnixai.com,team@audnixai.com
```
Set in Vercel environment variables.

### 2. Failed Attempt Tracking
- Non-whitelisted email attempts login
- After **2 failed attempts**: IP + email blocked for **24 hours**
- Automatic unblock after 24 hours
- Tracked in memory (per Express process)

### 3. No Password for Admin
- Admins use **OTP-only** login
- No password field shown
- No password stored
- Cleaner, more secure than password

### 4. Session Management
- **User session**: 7 days (can re-login with password)
- **Admin session**: 30 days (OTP-based)
- Auto-logout after expiry

---

## 📋 HOW IT WORKS

### Step 1: Email Check
```javascript
POST /api/admin/auth/check-email
Body: { email: "canarylumen@gmail.com" }

Response (Whitelisted):
{ success: true, isWhitelisted: true }

Response (NOT Whitelisted):
{ error: "Not authorized", isWhitelisted: false }
→ Attempt count: 1/2
```

### Step 2: After 2 Failed Attempts
```
Attempt 1: Email not whitelisted → Error
Attempt 2: Email not whitelisted → Blocked
Attempt 3+: Blocked for 24 hours
```

### Step 3: OTP Sent (Whitelisted)
```javascript
POST /api/admin/auth/request-otp
Body: { email: "canarylumen@gmail.com" }

Response:
{ success: true, message: "OTP sent to your email" }
```

### Step 4: OTP Verified
```javascript
POST /api/admin/auth/verify-otp
Body: { email: "canarylumen@gmail.com", otp: "123456" }

Response:
{
  success: true,
  user: { id, email, role: "admin" },
  sessionExpiresIn: "30 days"
}
```

---

## 🎯 FRONTEND IMPLEMENTATION

### Two Login Options

**Option 1: User Login**
```
Email input
  ↓
Send to /api/user/auth/signup/request-otp
  ↓
Show OTP + password creation
```

**Option 2: Admin Login** 
```
Email input
  ↓
Send to /api/admin/auth/check-email
  ├→ Whitelisted: Show OTP field
  └→ NOT Whitelisted: Show "Not authorized" + block after 2 attempts
```

### Example: Separate Login Page
```typescript
// Admin Login Component
function AdminLogin() {
  const [email, setEmail] = useState('');
  const [showOTPField, setShowOTPField] = useState(false);

  const handleCheckEmail = async () => {
    const res = await fetch('/api/admin/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    
    const data = await res.json();
    
    if (data.isWhitelisted) {
      // Send OTP
      await fetch('/api/admin/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setShowOTPField(true);
    } else {
      // Show "Not authorized" 
      toast("Email not authorized for admin access");
    }
  };

  return (
    <div>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={handleCheckEmail}>Check Email</button>
      
      {showOTPField && <OTPInput email={email} endpoint="/api/admin/auth/verify-otp" />}
    </div>
  );
}
```

---

## 🔑 ENVIRONMENT VARIABLES (Vercel)

```
# Admin Whitelist
ADMIN_WHITELIST_EMAILS=canarylumen@gmail.com,treasure@audnixai.com,team@audnixai.com

# Twilio (OTP)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_EMAIL_FROM=your_twilio_email
TWILIO_SENDGRID_API_KEY=your_sendgrid_key

# Database
DATABASE_URL=your_database_url

# Session
SESSION_SECRET=random_secret_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLIC_KEY=your_stripe_key
```

---

## ✅ TESTING ADMIN LOGIN

### 1. Local Testing
```bash
# Start server
npm run dev

# Test admin email check
curl -X POST http://localhost:3000/api/admin/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email": "canarylumen@gmail.com"}'

# Should return: { success: true, isWhitelisted: true }
```

### 2. Test Non-Whitelisted
```bash
curl -X POST http://localhost:3000/api/admin/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email": "random@example.com"}'

# Should return: { error: "Not authorized", isWhitelisted: false }
# After 2 attempts: { error: "Access denied - too many failed attempts" }
```

---

## 🚀 DEPLOYMENT (Vercel)

1. **Add to Vercel environment variables:**
   ```
   ADMIN_WHITELIST_EMAILS=canarylumen@gmail.com,treasure@audnixai.com,team@audnixai.com
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_SENDGRID_API_KEY=...
   DATABASE_URL=...
   SESSION_SECRET=...
   OPENAI_API_KEY=...
   STRIPE_SECRET_KEY=...
   STRIPE_PUBLIC_KEY=...
   ```

2. **Deploy**
   ```bash
   git push
   ```

3. **Admin Access**
   - Visit: https://audnixai.com/admin-login
   - Use whitelisted email
   - Verify OTP from email
   - Done!

---

## 📊 API ENDPOINTS SUMMARY

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/user/auth/signup/request-otp` | POST | Send OTP for signup | None |
| `/api/user/auth/signup/verify-otp` | POST | Create account | None |
| `/api/user/auth/login` | POST | User login | None |
| `/api/admin/auth/check-email` | POST | Check if admin | None |
| `/api/admin/auth/request-otp` | POST | Send admin OTP | None |
| `/api/admin/auth/verify-otp` | POST | Admin login | None |
| `/api/admin/auth/status` | GET | Check admin status | Session |
| `/api/admin/*` | All | Admin endpoints | requireAdmin |

---

## 🔒 SECURITY SUMMARY

✅ **Admin whitelist enforced** - Only 3 emails can be admin
✅ **No password for admin** - OTP-only, cleaner
✅ **Failed attempts tracked** - 2 tries → 24 hour block
✅ **Email-based access** - No API key compromise risk
✅ **Session separation** - User (7 days) vs Admin (30 days)
✅ **All endpoints protected** - Backend validates admin role
✅ **Twilio OTP** - Same as user auth, industry standard

---

## ✨ READY TO GO

All secure. All working. Deploy to Vercel and use it.

