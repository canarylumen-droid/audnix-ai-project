# 🛡️ Admin Dashboard - Complete Documentation

## Overview

Audnix AI now includes a comprehensive admin dashboard for managing the entire platform. The admin panel provides full visibility into users, revenue, analytics, and system health with read-only access to prevent accidental data tampering.

## Features

### 1. Admin Whitelist System
**Location:** `migrations/014_admin_whitelist.sql`

- **Whitelisted Emails**: Only specific emails can access the admin panel
- **Default Admins**: Configure 3 default admin emails during setup
- **Invite System**: Admins can invite new admins via email
- **Status Management**: Active/Revoked status for each admin
- **Security**: Email-based authentication with OTP or Google OAuth

**Default Admin Emails (Update these in the migration):**
```sql
INSERT INTO admin_whitelist (email, status) VALUES 
  ('admin@audnix.ai', 'active'),
  ('founder@audnix.ai', 'active'),
  ('ceo@audnix.ai', 'active');
```

### 2. Analytics Dashboard
**Location:** `client/src/pages/admin/analytics.tsx`

**Real-Time Metrics:**
- Total Users (with new user count)
- Active Users (last 30 days)
- Monthly Recurring Revenue (MRR)
- Total Leads across all users
- Total Messages sent/received

**Visualizations:**
- User Growth Chart (daily new users + cumulative total)
- Revenue Tracking (daily/monthly revenue)
- Channel Performance (Instagram, WhatsApp, Email)
- Conversion Rates by Channel

**Time Filters:**
- Last 7 days
- Last 30 days
- Last 90 days

### 3. User Management
**Location:** `client/src/pages/admin/users.tsx`

**Features:**
- Search users by email, name, or username
- View all user accounts with pagination
- User details modal showing:
  - Account information
  - Lead statistics (total, converted, new, open)
  - Message statistics (sent, received)
  - Connected integrations
  - Recent leads
  - Activity timeline

**User Information Displayed:**
- Email, Name, Username
- Plan (Trial, Starter, Pro, Enterprise)
- Role (Admin, Member)
- Join date
- Last login
- Stripe Customer ID

### 4. Lead Monitoring
**Location:** `client/src/pages/admin/leads.tsx`

**Features:**
- View all leads across the platform
- Filter by status (New, Open, Replied, Converted, Not Interested, Cold)
- Filter by channel (Instagram, WhatsApp, Email)
- Pagination for large datasets
- Read-only access (no editing/deletion)

**Lead Information:**
- Lead name and contact info
- Associated user
- Channel source
- Status and score
- Creation date
- Last message date

### 5. Admin Settings
**Location:** `client/src/pages/admin/settings.tsx`

**Whitelist Management:**
- Add new admin emails
- Revoke admin access
- View admin invitation history
- System configuration

**Planned Features Documentation:**
- Send notifications to all users
- Broadcast system announcements
- Update terms of service
- Feature flags & A/B testing
- Analytics export
- User impersonation for support

## Backend API Endpoints

### Analytics
- `GET /api/admin/overview` - Dashboard overview with key metrics
- `GET /api/admin/analytics/user-growth?days=30` - User growth data
- `GET /api/admin/analytics/revenue?days=30` - Revenue tracking
- `GET /api/admin/analytics/channels` - Channel performance stats

### User Management
- `GET /api/admin/users?search=&page=1&limit=20` - List/search users
- `GET /api/admin/users/:userId` - Get specific user details
- `GET /api/admin/users/:userId/activity?limit=50` - User activity timeline

### Lead Management
- `GET /api/admin/leads?page=1&limit=20&status=&channel=` - Browse all leads

### Whitelist Management
- `GET /api/admin/whitelist` - Get admin whitelist
- `POST /api/admin/whitelist` - Add email to whitelist
- `DELETE /api/admin/whitelist/:email` - Revoke admin access

## Database Tables

### admin_whitelist
```sql
CREATE TABLE admin_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### revenue_events
```sql
CREATE TABLE revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  plan TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### user_activity_log
```sql
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### system_metrics
```sql
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  mrr DECIMAL(10,2) DEFAULT 0,
  leads_created INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security Features

1. **Whitelist-Based Access**: Only pre-approved emails can access admin panel
2. **Role Verification**: Middleware checks both user role AND whitelist status
3. **Read-Only Mode**: Most admin views are read-only to prevent data tampering
4. **Audit Trail**: All admin actions are logged (future feature)
5. **Session-Based Auth**: Uses same secure session system as user dashboard

## Access Control

### For Regular Users:
- Admin Panel link is hidden
- Admin routes return 403 Forbidden
- No visibility into admin features

### For Admins:
- "Admin Panel" link appears in dashboard sidebar
- Full access to admin dashboard
- Can view all users and data
- Can invite new admins
- Can revoke admin access

## Setup Instructions

1. **Update Default Admin Emails**:
   Edit `migrations/014_admin_whitelist.sql` and replace the default emails with your actual admin emails.

2. **Run Migrations**:
   ```bash
   npm run db:push
   ```

3. **Create Admin User**:
   - Sign up with one of the whitelisted emails
   - User account will automatically get admin role
   - Access admin panel via sidebar link

4. **Invite Additional Admins**:
   - Go to Admin Panel → Settings
   - Add admin emails
   - They'll receive access upon signup

## Routing

- `/admin` - Main admin dashboard
- `/admin/users` - User management
- `/admin/analytics` - Analytics & charts
- `/admin/leads` - Lead monitoring
- `/admin/settings` - Admin settings & whitelist

## UI Components

- **AdminLayout** - Sidebar navigation + main content area
- **Admin Dashboard** - Overview cards with key metrics
- **Admin Users** - User list with search and details modal
- **Admin Analytics** - Charts and graphs (Recharts)
- **Admin Leads** - Filterable lead table
- **Admin Settings** - Whitelist management

## Future Features (Documented for Implementation)

### Phase 1 - Communication
- [ ] Send notifications to all users
- [ ] Broadcast system announcements
- [ ] In-app messaging to specific users

### Phase 2 - Content Management
- [ ] Update terms of service
- [ ] Update privacy policy
- [ ] Manage landing page content

### Phase 3 - Advanced Features
- [ ] Feature flags per user/plan
- [ ] A/B testing framework
- [ ] User impersonation for support
- [ ] Advanced analytics export (CSV, PDF)
- [ ] Custom reports builder

### Phase 4 - Automation
- [ ] Automated user segmentation
- [ ] Churn prediction
- [ ] Revenue forecasting
- [ ] Anomaly detection

## Tech Stack

**Backend:**
- Express.js routes
- PostgreSQL (Neon)
- Drizzle ORM
- Admin middleware with whitelist checking

**Frontend:**
- React + TypeScript
- Wouter (routing)
- Recharts (analytics)
- Tailwind CSS + shadcn/ui
- Real-time updates (React Query)

## Best Practices

1. **Never expose sensitive data**: Payment details, API keys, passwords
2. **Read-only by default**: Most views should be read-only
3. **Confirm destructive actions**: Always prompt before revoke/delete
4. **Audit everything**: Log all admin actions (implement in Phase 2)
5. **Regular backups**: Ensure database backups before bulk operations

## Support & Troubleshooting

**Common Issues:**

1. **Can't access admin panel**:
   - Verify email is in admin_whitelist table
   - Check user.role is set to 'admin'
   - Clear session and re-login

2. **Data not updating**:
   - Check React Query cache
   - Refresh page
   - Check console for API errors

3. **Charts not showing**:
   - Verify date range has data
   - Check browser console for errors
   - Ensure Recharts is properly installed

## Conclusion

The Audnix AI Admin Dashboard provides comprehensive platform management with:
- ✅ Real-time analytics and metrics
- ✅ User and lead management
- ✅ Revenue tracking
- ✅ Secure whitelist-based access
- ✅ Read-only safety features
- ✅ Beautiful, responsive UI
- ✅ Easy to extend with new features

This admin system gives you complete visibility and control over your SaaS platform while maintaining data integrity and security.
