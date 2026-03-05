# Testing Guide for ESPN Polling Optimization

## ✅ Pre-Deployment Tests (Completed)

1. **Helper Functions Test**: ✅ Passed
   - `extractEventIdFromGameId()` correctly extracts eventIds
   - Handles league slugs with dots (e.g., `eng.1`)

2. **ESPN Summary Endpoint Test**: ✅ Passed
   - Endpoint is accessible and returns correct data structure
   - Contains all fields needed (scores, status, clock, etc.)

3. **Endpoint Response Test**: ✅ Passed
   - `/pollESPNLiveData` endpoint is accessible
   - Returns expected response format

---

## 🚀 Deployment Steps

### Step 1: Deploy Updated Code

```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX

# Deploy to Cloud Run
gcloud run deploy flashlive-scraper \
  --source . \
  --region us-central1 \
  --project flashlive-daily-scraper \
  --allow-unauthenticated
```

### Step 2: Wait for Next Polling Run

The polling runs every 2 minutes via Cloud Scheduler. Wait 2-3 minutes after deployment.

---

## 🧪 Post-Deployment Testing

### Test 1: Check Logs for Optimization Messages

```bash
# Check for optimization messages
gcloud logging read \
  "resource.type=cloud_run_revision AND \
   resource.labels.service_name=flashlive-scraper AND \
   (textPayload=~\"optimized polling\" OR \
    textPayload=~\"individual games\" OR \
    textPayload=~\"games to poll individually\" OR \
    textPayload=~\"Using optimized polling\")" \
  --limit 20 \
  --format json \
  --project=flashlive-daily-scraper | \
  jq -r '.[] | "\(.timestamp) | \(.textPayload // .jsonPayload.message)"'
```

**Expected Output:**
```
[timestamp] | [ESPN Live Data] Polling run - found X games to poll individually (instead of fetching all 70 leagues)
[timestamp] | [ESPN Live Data] Using optimized polling: fetching X individual games via summary endpoint
[timestamp] | [ESPN] Fetching summary for NBA game 401810420...
[timestamp] | [ESPN Live Data] Optimized polling complete: fetched X games via summary endpoint
```

### Test 2: Compare API Call Counts

**Before Optimization:**
- Logs show: `[ESPN] Fetching NBA for 2026-01-13...` (70 times - once per league)
- Games Fetched: ~99 games (all games from all leagues)

**After Optimization:**
- Logs show: `[ESPN] Fetching summary for NBA game 401810420...` (only for live games)
- Games Fetched: ~5-10 games (only games that are live)

### Test 3: Manual Endpoint Test

```bash
# Run the test script
node test-polling-detailed.js
```

**Expected Results:**
- If optimization is active: "Using optimized polling: fetching X individual games"
- If no games to poll: "No live games and no upcoming games within 2 hours; skipped fetch"
- If morning run: "Morning run detected" (uses fallback - this is expected)

### Test 4: Verify Firestore Data

1. Go to Firebase Console
2. Navigate to: `artifacts/flashlive-daily-scraper/public/data/sportsGames`
3. Filter by:
   - `gameDate == today` (e.g., `2026-01-13`)
   - `Start Time <= now`
   - `Match Status != FINAL`
4. Count how many games match
5. Compare with log message: "found X games to poll individually"

**Expected:** The count should match the log message.

---

## 🔍 Debugging

### If Optimization Isn't Working

1. **Check if code is deployed:**
   ```bash
   gcloud run services describe flashlive-scraper \
     --region us-central1 \
     --project flashlive-daily-scraper \
     --format="value(status.latestReadyRevisionName)"
   ```
   Note the revision name, then check logs for that revision.

2. **Check for errors:**
   ```bash
   gcloud logging read \
     "resource.type=cloud_run_revision AND \
      resource.labels.service_name=flashlive-scraper AND \
      severity>=ERROR" \
     --limit 20 \
     --format json \
     --project=flashlive-daily-scraper
   ```

3. **Verify Firestore query works:**
   - Check if games exist with `source == 'ESPN_LIVE'`
   - Check if games have `Start Time` field populated
   - Check if games have correct `gameDate`

### Common Issues

**Issue:** Still fetching all leagues
- **Cause:** Morning run (first run of the day)
- **Solution:** Wait for next polling run (2 minutes)

**Issue:** "Could not extract eventId from Game ID"
- **Cause:** Game ID format doesn't match expected pattern
- **Solution:** Check Game ID format in Firestore, verify it's `espn-{league}-{eventId}`

**Issue:** "Could not extract sport/league from Game ID"
- **Cause:** League slug not found in `ESPN_LEAGUES` array
- **Solution:** Check if league exists in `ESPN_LEAGUES` configuration

---

## 📊 Success Criteria

### ✅ Optimization is Working If:

1. **Logs show:**
   - "Using optimized polling: fetching X individual games"
   - "Optimized polling complete: fetched X games via summary endpoint"
   - Individual game fetches: `[ESPN] Fetching summary for {league} game {eventId}...`

2. **API Call Count:**
   - Before: ~70 API calls per poll (all leagues)
   - After: ~5-10 API calls per poll (only live games)
   - **89% reduction**

3. **Response Time:**
   - Before: ~60-65 seconds (fetching all leagues)
   - After: ~5-15 seconds (fetching only live games)
   - **75-85% faster**

4. **Games Fetched:**
   - Matches number of live games (not all games from all leagues)

---

## 🎯 Test Scenarios

### Scenario 1: No Live Games
**Expected:** 
- Log: "No live games and no upcoming games within 2 hours; skipped fetch"
- API Calls: 0
- Duration: < 1 second

### Scenario 2: 3 Live Games Across 2 Leagues
**Expected:**
- Log: "found 3 games to poll individually"
- Log: "Using optimized polling: fetching 3 individual games"
- API Calls: 3 (one per game)
- Duration: ~3-5 seconds

### Scenario 3: Morning Run
**Expected:**
- Log: "Morning run detected"
- Uses fallback: fetches all leagues (expected behavior)
- This is normal - optimization activates on subsequent polling runs

---

## 📝 Monitoring Commands

### Real-time Log Monitoring

```bash
# Watch logs in real-time
gcloud logging tail \
  "resource.type=cloud_run_revision AND \
   resource.labels.service_name=flashlive-scraper" \
  --project=flashlive-daily-scraper \
  --format="value(textPayload,jsonPayload.message)"
```

### Check API Call Pattern

```bash
# Count ESPN API calls in logs
gcloud logging read \
  "resource.type=cloud_run_revision AND \
   resource.labels.service_name=flashlive-scraper AND \
   textPayload=~\"Fetching.*ESPN\"" \
  --limit 100 \
  --format json \
  --project=flashlive-daily-scraper | \
  jq -r '.[] | .textPayload' | \
  grep -c "Fetching"
```

**Expected:** Should see ~5-10 "Fetching summary" messages instead of ~70 "Fetching {league}" messages.

---

## ✅ Verification Checklist

- [ ] Code deployed to Cloud Run
- [ ] Logs show "Using optimized polling" message
- [ ] API call count reduced (check logs)
- [ ] Response time improved (check duration)
- [ ] Games still update correctly (check Firestore)
- [ ] Front-end still displays games correctly
- [ ] No errors in logs

---

## 🆘 If Something Goes Wrong

1. **Rollback:**
   ```bash
   # List revisions
   gcloud run revisions list \
     --service flashlive-scraper \
     --region us-central1 \
     --project flashlive-daily-scraper
   
   # Rollback to previous revision
   gcloud run services update-traffic flashlive-scraper \
     --to-revisions PREVIOUS_REVISION=100 \
     --region us-central1 \
     --project flashlive-daily-scraper
   ```

2. **Check for syntax errors:**
   ```bash
   node -c index.js
   ```

3. **Test locally (if possible):**
   - Set up Firebase emulator
   - Test the function locally

---

## 📞 Next Steps After Testing

1. Monitor for 24 hours
2. Compare API call counts (before vs. after)
3. Verify cost reduction in GCP billing
4. Check for any edge cases or errors
5. Document any issues found
