# COMPLETE TESTING CHECKLIST - NO MOCK DATA

## ✅ Files Created/Updated:

### Backend:
1. ✅ `server/lib/scraping/crawler-service.ts` - 40 workers, real scraping
2. ✅ `server/lib/scraping/audnix-ingestor.ts` - Real pipeline
3. ✅ `server/lib/scraping/email-verifier.ts` - Real SMTP
4. ✅ `server/routes/prospecting.ts` - NO MOCK DATA
5. ✅ `server/routes/index.ts` - Routes registered
6. ✅ `server/routes/expert-chat.ts` - Uses Gemini (not OpenAI)

### Frontend:
- Prospecting UI already exists (needs verification)

## 🧪 TESTING REQUIRED:

### 1. Backend API Tests:

**Test 1: Start Neural Scan**
```bash
POST /api/prospecting/scan
Body: { "query": "Find me 500 real estate founders in Miami" }
Expected: 
- Returns { success: true }
- WebSocket starts sending PROSPECTING_LOG messages
- NO mock data
```

**Test 2: Get Leads**
```bash
GET /api/prospecting/leads
Expected:
- Returns array of REAL prospects from database
- NO mock/demo leads
- Empty array if no scans run yet
```

**Test 3: Verify Lead**
```bash
POST /api/prospecting/verify/:id
Expected:
- Runs REAL SMTP verification
- Updates database
- Sends PROSPECT_UPDATED via WebSocket
```

### 2. Scraping Engine Tests:

**Test 1: Google Search**
- Should scrape HTML (no API)
- Should extract business names + URLs
- Should filter blacklisted domains

**Test 2: Bing Search**
- Should work as fallback
- Should extract results

**Test 3: Google Maps**
- Should scrape Maps search results
- Should extract business names + addresses

**Test 4: Instagram Bio Scraping**
- Should find profiles from hashtags
- Should scrape individual bios
- Should extract emails from bios
- Should detect roles (CEO, Founder, etc.)
- Should return EXACT Instagram URLs

**Test 5: YouTube Scraping**
- Should search YouTube channels
- Should extract channel URLs
- Should get channel names
- Should return EXACT YouTube URLs

**Test 6: Social URL Extraction**
- Should extract FULL URLs (not just detect)
- Should return:
  - `instagram: "https://instagram.com/username"`
  - `linkedin: "https://linkedin.com/in/username"`
  - `youtube: "https://youtube.com/channel/..."`
  - etc.

### 3. Email Verification Tests:

**Test 1: SMTP MX Check**
- Should check DNS MX records
- Should detect disposable emails
- Should identify role-based emails

**Test 2: Generic Email Filtering**
- Should reject: info@, support@, noreply@, hr@, sales@, team@, office@, contact@, hello@, admin@
- Should accept: personal Gmail, founder emails

### 4. Lead Scoring Tests (NO AI HALLUCINATION):

**Test 1: Real Indicators Only**
- Gmail/Outlook = +15 points
- Founder email = +20 points
- "Enterprise" keyword = +15 points
- "Pricing" page = +10 points
- Content length > 5000 chars = +10 points

**Test 2: Revenue Estimation**
- "Fortune 500" or "Enterprise" = $100k+
- "Agency" or "Consulting" = $50k-$100k
- "Startup" = $10k-$50k
- Otherwise = Unknown
- **NO AI GUESSING**

### 5. Performance Tests:

**Test 1: 40 Workers**
- Should run 40 concurrent requests
- Should complete 500 leads in ~60-90 seconds
- Should complete 2000 leads in ~2-3 minutes

**Test 2: User Agent Rotation**
- Should rotate through 20 different user agents
- Should not use same agent consecutively

### 6. WebSocket Tests:

**Test 1: Real-Time Logs**
- Should send PROSPECTING_LOG events
- Should send PROSPECT_FOUND events
- Should send PROSPECT_UPDATED events
- Should be user-specific (not broadcast to all)

**Test 2: Progress Updates**
- Should show discovery progress
- Should show enrichment progress
- Should show verification progress

### 7. Database Tests:

**Test 1: Prospect Insertion**
- Should insert REAL data only
- Should include all fields:
  - entity, email, phone, location
  - website, platforms, socialProfiles
  - leadScore, wealthSignal, estimatedRevenue
  - role, verified, verifiedAt
  - metadata (with intent, verification, etc.)

**Test 2: Duplicate Detection**
- Should check existing emails
- Should not insert duplicates

### 8. Frontend Tests:

**Test 1: Prospecting UI**
- Should connect to WebSocket
- Should display real-time logs
- Should show leads as they're found
- Should display EXACT social URLs
- Should show revenue estimates
- Should show lead scores

**Test 2: CSV Export**
- Should export all lead data
- Should include social URLs
- Should include revenue estimates

## ❌ WHAT TO CHECK FOR (MOCK DATA):

### Files to Verify NO Mock Data:
1. ✅ `server/routes/prospecting.ts` - Checked, no mock
2. ✅ `server/lib/scraping/audnix-ingestor.ts` - Checked, no mock
3. ✅ `server/lib/scraping/crawler-service.ts` - Checked, no mock
4. ✅ `server/lib/scraping/email-verifier.ts` - Checked, no mock
5. ⚠️ Frontend prospecting page - NEEDS VERIFICATION

### Common Mock Patterns to Search For:
- `mock_`
- `demo`
- `fake`
- `sample`
- `test@example.com`
- Hardcoded arrays of data
- `if (isDemoMode)`

## 🔍 VERIFICATION STEPS:

1. **Start Server**:
   ```bash
   npm run dev
   ```

2. **Check Console for Errors**:
   - No "mock-key" warnings
   - No "demo mode" messages
   - GEMINI_API_KEY should be set

3. **Test API Endpoints**:
   - Use Postman/curl to test /api/prospecting/scan
   - Verify WebSocket connection
   - Check database for real data

4. **Monitor Logs**:
   - Should see real scraping activity
   - Should see actual URLs being crawled
   - Should see SMTP verification attempts

5. **Check Database**:
   ```sql
   SELECT * FROM prospects ORDER BY created_at DESC LIMIT 10;
   ```
   - Should have REAL emails
   - Should have REAL social URLs
   - Should have metadata with scores

## 🚨 CRITICAL CHECKS:

- [ ] NO "mock" strings in prospecting routes
- [ ] NO demo/sample data in responses
- [ ] WebSocket sends REAL-TIME data
- [ ] Database stores REAL scraped data
- [ ] Social URLs are FULL URLs (not just platform names)
- [ ] YouTube scraping is IMPLEMENTED (not commented out)
- [ ] Revenue estimation uses REAL keywords (not AI guessing)
- [ ] 40 workers are ACTUALLY running
- [ ] SMTP verification is REAL (not simulated)

## 📝 EXPECTED BEHAVIOR:

**When user types**: "Find me 1000 real estate founders in Miami"

**Should happen**:
1. Gemini 2.0 extracts: { niche: "real estate", location: "Miami", volume: 1000 }
2. 40 workers launch in parallel
3. Workers scrape: Google, Bing, Maps, Instagram, YouTube
4. Real-time logs appear in modal
5. Leads appear as they're found
6. Each lead has EXACT social URLs
7. SMTP verification runs on emails
8. Database stores REAL data
9. CSV export works with all data

**Total time**: ~2-3 minutes for 1000 leads

---

**STATUS**: Ready for testing
**Next Step**: Run server and test each endpoint
**Critical**: Verify NO mock data in any response
