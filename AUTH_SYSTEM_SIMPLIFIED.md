# 🎯 SIMPLIFIED AUTH SYSTEM

## SIGNUP (One-time OTP)
```
User enters email
  ↓
Twilio sends OTP (10 min)
  ↓
User enters OTP
  ↓
User creates password (stored in DB)
  ↓
Account created → Dashboard
```

## LOGIN (Password for 7 days, then OTP again)
```
First login after signup:
- User enters email + password
- Session lasts 7 days
- Auto-login without OTP

After 7 days:
- Session expired
- Require OTP again
- New 7-day session
```

## WHATSAPP CONNECTION (Dashboard only)
```
In dashboard → "Connect WhatsApp"
  ↓
Scan QR or enter phone number
  ↓
Twilio sends OTP
  ↓
User enters OTP
  ↓
Access granted → Import WhatsApp leads
```

---

## ROUTES

```
SIGNUP:
POST /api/auth/signup/request-otp { email }
POST /api/auth/signup/verify-otp { email, otp, password }

LOGIN:
POST /api/auth/login { email, password }
POST /api/auth/refresh-session (extends 7-day timer)

WHATSAPP (Dashboard):
POST /api/whatsapp-connect/request-otp { phoneNumber }
POST /api/whatsapp-connect/verify-otp { phoneNumber, otp }

LOGOUT:
POST /api/auth/logout
```

---

## WHAT TO REMOVE
- ❌ Google OAuth
- ❌ All OAuth providers
- ❌ Multiple auth methods
- ✅ Keep only: Email OTP + Password

