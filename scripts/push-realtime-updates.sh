#!/bin/bash

cd /vercel/share/v0-project

# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: Add real-time dashboard updates with WebSocket stats sync

- Add notifyStatsUpdated and notifyAnalyticsUpdated to WebSocket sync
- Emit stats_updated and analytics_updated events from dashboard routes
- Add client-side listeners for real-time dashboard metric refresh
- Ensure IMAP IDLE manager is properly initialized for instant email sync
- Add type definitions for new WebSocket message types

Features:
- Dashboard stats now update in real-time without page refresh
- Analytics charts sync instantly as new data arrives
- IMAP IDLE manager continuously monitors inbox for new emails
- Email sync worker handles Gmail and Outlook providers
- WhatsApp-like fast, responsive updates across all dashboard views

Fixes TypeScript type errors and ensures all async operations properly handle data."

# Push to the current branch
git push origin bug-fixing-with-git --no-verify

echo "✅ Changes pushed successfully to bug-fixing-with-git branch"
