# Neon Database Management Guide

This guide explains how to manually manage users and data in your Neon PostgreSQL database.

## Accessing Your Database

### Option 1: Neon Console (Recommended for Manual Operations)

1. Go to [Neon Console](https://console.neon.tech)
2. Sign in with your account
3. Select your project
4. Click on **Tables** in the left sidebar to view all tables
5. Use the **SQL Editor** to run queries

### Option 2: Using Replit Database Tab

1. In your Replit project, click on the **Database** tab (icon looks like a cylinder)
2. You can view tables and run SQL queries directly

---

## Common Operations

### View All Users

```sql
SELECT id, email, username, name, plan, role, "createdAt", "lastLogin"
FROM users
ORDER BY "createdAt" DESC;
```

### Delete a Specific User by Email

```sql
-- First, find the user ID
SELECT id, email FROM users WHERE email = 'user@example.com';

-- Delete related data first (foreign key constraints)
DELETE FROM leads WHERE "userId" = 'USER_ID_HERE';
DELETE FROM messages WHERE "userId" = 'USER_ID_HERE';
DELETE FROM conversations WHERE "userId" = 'USER_ID_HERE';
DELETE FROM deals WHERE "userId" = 'USER_ID_HERE';
DELETE FROM onboarding_profiles WHERE "userId" = 'USER_ID_HERE';
DELETE FROM oauth_accounts WHERE "userId" = 'USER_ID_HERE';
DELETE FROM otp_codes WHERE "userId" = 'USER_ID_HERE';

-- Finally delete the user
DELETE FROM users WHERE email = 'user@example.com';
```

### Delete Multiple Users in "Limbo" State

Users in limbo state might have incomplete data. To clean them:

```sql
-- Find users without completed onboarding
SELECT id, email, username, metadata
FROM users 
WHERE metadata->>'onboardingCompleted' IS NULL 
   OR metadata->>'onboardingCompleted' = 'false';

-- Delete users who never completed any activity
DELETE FROM users 
WHERE id IN (
  SELECT u.id 
  FROM users u
  LEFT JOIN leads l ON l."userId" = u.id
  WHERE l.id IS NULL 
  AND (u.metadata->>'onboardingCompleted' IS NULL OR u.metadata->>'onboardingCompleted' = 'false')
);
```

### Clear All User Data (Keep Table Structure)

**WARNING: This deletes ALL data. Use with extreme caution!**

```sql
-- Clear all tables (preserves table structure)
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversations CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE deals CASCADE;
TRUNCATE TABLE video_monitors CASCADE;
TRUNCATE TABLE onboarding_profiles CASCADE;
TRUNCATE TABLE oauth_accounts CASCADE;
TRUNCATE TABLE otp_codes CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE session CASCADE;
```

### Reset a User's Password Hash (if needed)

```sql
-- Set password_hash to NULL to force re-authentication
UPDATE users 
SET password_hash = NULL 
WHERE email = 'user@example.com';
```

### Update User Plan Manually

```sql
UPDATE users 
SET plan = 'starter', 
    "paymentStatus" = 'approved',
    "paymentApprovedAt" = NOW()
WHERE email = 'user@example.com';
```

---

## Table Reference

| Table | Purpose |
|-------|---------|
| `users` | User accounts and profiles |
| `leads` | Imported leads/contacts |
| `messages` | Chat messages between AI and leads |
| `conversations` | Conversation threads |
| `deals` | Sales deals/pipeline |
| `video_monitors` | Video automation monitors |
| `onboarding_profiles` | User onboarding responses |
| `oauth_accounts` | Linked OAuth accounts (Instagram, etc.) |
| `otp_codes` | One-time passwords for auth |
| `session` | User sessions |

---

## Important Notes

1. **Always back up first** - Before deleting data, consider exporting it
2. **CASCADE** - Using CASCADE will automatically delete related records
3. **Foreign keys** - Some tables have foreign key constraints, delete child records first
4. **Production vs Development** - The database you see in Replit is the development database. Production database requires separate access.

---

## Quick Commands for Common Cleanup

### Remove test users (emails containing 'test'):
```sql
DELETE FROM users WHERE email LIKE '%test%';
```

### Remove users older than 30 days with no activity:
```sql
DELETE FROM users 
WHERE "createdAt" < NOW() - INTERVAL '30 days'
AND "lastLogin" IS NULL;
```

### Check database size:
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

---

## Complete Full Reset (Database + Sessions + Cookies)

When you want to completely reset EVERYTHING and start fresh:

### Step 1: Clear All Database Tables

Run this in Neon Console or Replit Database tab:

```sql
-- FULL RESET: Clears ALL data from ALL tables
-- WARNING: This is irreversible!

TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversations CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE deals CASCADE;
TRUNCATE TABLE video_monitors CASCADE;
TRUNCATE TABLE onboarding_profiles CASCADE;
TRUNCATE TABLE oauth_accounts CASCADE;
TRUNCATE TABLE otp_codes CASCADE;
TRUNCATE TABLE session CASCADE;
TRUNCATE TABLE users CASCADE;

-- Verify tables are empty
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'leads', COUNT(*) FROM leads
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'session', COUNT(*) FROM session;
```

### Step 2: Clear Browser Cookies

After clearing the database, users need to clear their browser cookies to fully reset:

**Option A: Manual (for single user)**
1. Open browser DevTools (F12)
2. Go to Application → Cookies → audnixai.com
3. Delete all cookies (especially `audnix.sid`)

**Option B: Instruct Users**
Tell users to:
1. Clear browser cookies for audnixai.com
2. Or use an incognito/private window

### Step 3: Restart the Server

After database reset, restart the workflow to clear any cached sessions:
- In Replit: Stop and restart the "Start Game" workflow
- Or redeploy the application

---

## Can Users Re-Signup After Data Deletion?

**Yes!** After their data is deleted:
- Users can sign up again with the same email
- They get a fresh account with no previous data
- All features work normally
- They start with a new trial period (if applicable)

The email address is not blacklisted - deletion is a complete removal that allows re-registration.
