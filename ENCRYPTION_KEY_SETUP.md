# 🔐 ENCRYPTION_KEY Setup Guide

## What is ENCRYPTION_KEY?

Encrypts sensitive user data in your PostgreSQL database (subscriptions, payment info, etc.). Required for production security.

---

## How to Generate It

### Option 1: Generate in Terminal (Easiest)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Output:** A 64-character hex string
```
63c4fdd1caae339a4292be95e4c2724856cac5a5dd00f43cf17df58c547ab66c
```

**Copy this entire string.**

---

### Option 2: Use OpenSSL

```bash
openssl rand -hex 32
```

---

## How to Add It to Replit

1. Go to **Secrets** tab in Replit
2. Click **Add Secret**
3. **Key:** `ENCRYPTION_KEY`
4. **Value:** Paste the 64-char hex string from above
5. Click **Add Secret**

Done. System will use it automatically. ✅

---

## What It Does

When you add this secret:
- ✅ User payment data gets encrypted in database
- ✅ Subscription info protected
- ✅ All sensitive fields automatically encrypted/decrypted
- ✅ Zero code changes needed - system handles it

---

## Where It's Used

File: `server/lib/crypto/encryption.ts`

All encryption/decryption calls automatically pull from this env var:

```typescript
const key = process.env.ENCRYPTION_KEY;
// System uses this for: encrypt(data), decrypt(data)
```

---

## Important Notes

- ⚠️ **DO NOT share this key** - keep it secret
- ⚠️ **DO NOT lose it** - encrypted data becomes unreadable if key changes
- ✅ Store in Secrets, never in code
- ✅ Different key per environment (dev/prod) if needed

---

## Test It Works

After adding, check server logs:

```
✅ ENCRYPTION_KEY loaded successfully
✅ User data encrypted: [subscription_id]
```

If you see `❌ ENCRYPTION_KEY must be set` - the secret didn't load. Refresh the page.
