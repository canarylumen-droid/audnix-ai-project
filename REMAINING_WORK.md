
# 🚧 Remaining 20% - Work Breakdown

## 1. Landing Page Mobile Fixes (2% - 4 hours)

### Issues:
- Hero text too large on phones (overlaps)
- Dark mode toggle doesn't work in header
- CTA buttons need better spacing on tablets

### Files to fix:
- `client/src/pages/landing.tsx`
- `client/src/components/landing/Navigation.tsx`

### Tasks:
```
[ ] Add responsive text classes (text-4xl md:text-5xl lg:text-6xl)
[ ] Fix dark mode toggle in Navigation component
[ ] Add proper mobile padding to CTAs
[ ] Test on iPhone, Android, iPad
```

---

## 2. Lead Import Polish (3% - 6 hours)

### What's missing:
- No progress bar during CSV upload
- Error messages are technical (need user-friendly text)
- Can't undo if wrong file uploaded

### Files to update:
- `client/src/pages/dashboard/lead-import.tsx`
- `server/routes.ts` (CSV import endpoint)

### Tasks:
```
[ ] Add progress bar component
[ ] Show "X of Y rows processed"
[ ] Better error messages ("Email missing in row 5")
[ ] Add "Cancel Import" button
[ ] Show preview before confirming import
```

---

## 3. Calendar Integration Completion (5% - 10 hours)

### What exists:
- Google Calendar OAuth ✅
- Calendar read permissions ✅

### What's missing:
- Can't create meeting links
- No booking page in dashboard
- No auto-follow-up scheduling

### Files to create/update:
- `client/src/pages/dashboard/calendar.tsx` (booking page UI)
- `server/lib/calendar/google-calendar.ts` (create event function)
- `server/routes.ts` (calendar endpoints)

### Tasks:
```
[ ] Add "Create Meeting Link" button
[ ] Generate Google Meet/Calendar links
[ ] Show booking calendar widget
[ ] Auto-schedule follow-ups from conversations
[ ] Sync calendar events to dashboard
```

---

## 4. Landing Page Dark Mode (1% - 2 hours)

### Issue:
Toggle button exists but doesn't work

### Fix needed:
```typescript
// In Navigation.tsx
const { theme, setTheme } = useTheme();

<Button
  variant="ghost"
  size="icon"
  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
>
  {theme === 'dark' ? <Sun /> : <Moon />}
</Button>
```

---

## 5. Mobile Dashboard Polish (2% - 4 hours)

### Issues:
- Sidebar overlaps on tablets
- Charts don't resize on small screens
- Feature cards stack poorly

### Files:
- `client/src/components/dashboard/DashboardLayout.tsx`
- `client/src/pages/dashboard/home.tsx`

### Tasks:
```
[ ] Add responsive sidebar (drawer on mobile)
[ ] Make charts scroll horizontally on phones
[ ] Stack feature cards properly
[ ] Test on 375px, 768px, 1024px widths
```

---

## 6. Video Monitor UX Improvements (2% - 4 hours)

### Enhancements:
- Show last comment sync time
- Display next sync countdown
- Better stats visualization

### File:
- `client/src/pages/dashboard/video-automation.tsx`

### Tasks:
```
[ ] Add "Last checked: 15 seconds ago"
[ ] Show "Next sync in: 15s" countdown
[ ] Display stats with icons (📊 Comments, 💬 DMs, ✅ Conversions)
[ ] Add pause/play animation
```

---

## 7. Error Handling & User Feedback (3% - 6 hours)

### Missing:
- Generic error messages ("Something went wrong")
- No retry buttons on failures
- Loading states inconsistent

### Files to update:
- All dashboard pages
- `client/src/lib/queryClient.ts`

### Tasks:
```
[ ] Add specific error messages
[ ] "Retry" buttons on failed requests
[ ] Consistent loading spinners
[ ] Toast notifications for all actions
```

---

## 8. Documentation Updates (2% - 4 hours)

### Files to update:
- `README.md` ✅ (already updated)
- `INTEGRATIONS_GUIDE.md` ✅ (already updated)
- `SETUP_INSTRUCTIONS.md`
- `DEPLOYMENT.md`

### Tasks:
```
[✅] Update README with recent changes
[✅] Document WhatsApp Web integration
[✅] Explain reply timing logic
[ ] Update setup guide
[ ] Add troubleshooting section
```

---

## Total Remaining: ~40 hours of work

**Priority Order:**
1. Landing page mobile fixes (critical for launch)
2. Dark mode toggle fix (easy win)
3. Lead import polish (users will ask for this)
4. Calendar integration (nice-to-have)
5. Mobile dashboard polish (improves UX)
6. Error handling (prevents support tickets)
7. Video monitor UX (power user feature)
8. Documentation (ongoing)

---

## Launch Readiness Checklist

### Must-Have (Before Launch)
- [ ] Landing page mobile responsive
- [ ] Dark mode working
- [ ] Lead import with progress bar
- [ ] Error messages user-friendly

### Nice-to-Have (Can launch without)
- [ ] Calendar meeting links
- [ ] Video monitor countdown timers
- [ ] Bulk lead actions
- [ ] Team features

### Future (Post-Launch)
- [ ] Template library
- [ ] A/B testing
- [ ] Kanban board
- [ ] Advanced analytics
