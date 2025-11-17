
# Database Backup Guide

## Automated Backups

Your database automatically backs up daily at 3 AM server time.

Backups are stored in the `/backups` directory and kept for 10 days.

## Manual Backup

To create a manual backup anytime:

```bash
npm run backup
```

This creates a SQL dump of your entire database in `/backups/backup-YYYY-MM-DD.sql`

## Restore from Backup

To restore from a backup file:

```bash
# Option 1: Using psql (if available)
psql $DATABASE_URL < backups/backup-2025-01-13.sql

# Option 2: Via Neon dashboard
# 1. Go to your Neon project
# 2. Navigate to "Restore"
# 3. Upload the backup SQL file
```

## Backup Storage

- Local backups: `/backups` directory
- Retention: Last 10 backups (auto-cleanup)
- File format: SQL dump

## Neon's Built-in Backups

Neon also provides:
- **Point-in-Time Recovery**: Restore to any point in the last 7 days (Pro plan)
- **Branch backups**: Create database branches for testing

Access these in your [Neon dashboard](https://console.neon.tech).

## Best Practices

1. **Download backups weekly** to your local machine
2. **Test restores** periodically to verify backup integrity
3. **Before major updates**: Run `npm run backup` manually
4. **Monitor backup logs** in server console

## Emergency Recovery

If database is corrupted:

1. Stop the server
2. Identify latest good backup in `/backups`
3. Restore using psql or Neon dashboard
4. Restart server
5. Verify data integrity

## Backup Size Optimization

To reduce backup sizes:

```sql
-- Archive old data before backing up
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';
VACUUM FULL;
```
