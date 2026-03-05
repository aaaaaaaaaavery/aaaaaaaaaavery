# Deployment Checklist for ESPN Polling Optimization

## ✅ Pre-Deployment Checklist

- [x] Code changes complete
- [x] Syntax check passed (`node -c index.js`)
- [x] Helper functions tested
- [x] ESPN summary endpoint verified
- [x] No linting errors

---

## 🚀 Deployment Steps

### Option 1: Use Deployment Script (Recommended)

```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX
./deploy-flashlive-scraper.sh
```

### Option 2: Manual Deployment

```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX

gcloud run deploy flashlive-scraper \
  --source=. \
  --allow-unauthenticated \
  --region=us-central1 \
  --project=flashlive-daily-scraper \
  --set-env-vars=SPREADSHEET_ID=1vSHd7VQzFjTeZhIbWGJHsU_Mbz5OOYvkPHyVU0auzWw,\
SHEET_NAME=Sheet1,\
FIREBASE_PROJECT_ID=flashlive-daily-scraper,\
RAPIDAPI_KEY=1c6421f9acmshe820d0c9faf1cf5p165f88jsnc42711af762d,\
RAPIDAPI_HOST=flashlive-sports.p.rapidapi.com
```

**Expected Output:**
```
Service [flashlive-scraper] revision [flashlive-scraper-000XX-xxx] has been deployed
Service URL: https://flashlive-scraper-124291936014.us-central1.run.app
```

---

## ⏱️ After Deployment

### Wait 2-3 Minutes

The Cloud Scheduler runs polling every 2 minutes. Wait for the next scheduled run, or trigger manually:

```bash
# Manual trigger
curl -X GET https://flashlive-scraper-124291936014.us-central1.run.app/pollESPNLiveData
```

---

## ✅ Verification Steps

### Step 1: Check Logs for Optimization Messages

```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND \
   resource.labels.service_name=flashlive-scraper AND \
   (textPayload=~\"optimized polling\" OR \
    textPayload=~\"individual games\" OR \
    textPayload=~\"games to poll individually\")" \
  --limit 20 \
  --format json \
  --project=flashlive-daily-scraper | \
  jq -r '.[] | "\(.timestamp) | \(.textPayload // .jsonPayload.message)"'
```

**Expected Messages:**
- ✅ `"Polling run - found X games to poll individually (instead of fetching all 70 leagues)"`
- ✅ `"Using optimized polling: fetching X individual games via summary endpoint"`
- ✅ `"Optimized polling complete: fetched X games via summary endpoint"`

### Step 2: Run Verification Script

```bash
node verify-optimization.js
```

**Expected Output:**
- ✅ "OPTIMIZATION IS ACTIVE!"
- ✅ Shows reduced API call count

### Step 3: Compare API Call Patterns

**Before (Old Code):**
```
[ESPN] Fetching NFL for 2026-01-13...
[ESPN] Fetching NBA for 2026-01-13...
[ESPN] Fetching MLB for 2026-01-13...
... (70 times, once per league)
```

**After (Optimized Code):**
```
[ESPN] Fetching summary for NBA game 401810420...
[ESPN] Fetching summary for NFL game 401123456...
... (only 5-10 times, one per live game)
```

### Step 4: Monitor Response Times

**Before:** ~60-65 seconds (fetching all leagues)  
**After:** ~5-15 seconds (fetching only live games)

---

## 🎯 Success Indicators

### ✅ Optimization is Working If:

1. **Logs show:**
   - "Using optimized polling: fetching X individual games"
   - Individual game fetches instead of league fetches
   - API call count matches number of live games (not 70)

2. **Response shows:**
   - `gamesFetched` is low (5-10 instead of 99)
   - Response time is faster (~10-15s instead of ~60s)

3. **No errors:**
   - No "Could not extract eventId" errors
   - No "Could not extract sport/league" errors
   - Games still update correctly

---

## ⚠️ Troubleshooting

### If Still Fetching All Leagues

**Possible Causes:**
1. **Morning Run:** First run of the day uses fallback (expected)
2. **No Games Match Criteria:** All games are FINAL or haven't started
3. **Code Not Deployed:** Check deployment status

**Check:**
```bash
# Verify deployment
gcloud run services describe flashlive-scraper \
  --region us-central1 \
  --project flashlive-daily-scraper \
  --format="value(status.latestReadyRevisionName)"
```

### If Getting Errors

**Check logs for:**
- "Could not extract eventId" → Check Game ID format in Firestore
- "Could not extract sport/league" → Check if league exists in ESPN_LEAGUES
- "HTTP 404" → Summary endpoint might not exist for that game

---

## 📊 Expected Results

### Scenario 1: 5 Live Games
- **API Calls:** 5 (one per game)
- **Duration:** ~5-8 seconds
- **Logs:** "Using optimized polling: fetching 5 individual games"

### Scenario 2: No Live Games
- **API Calls:** 0
- **Duration:** < 1 second
- **Logs:** "No live games and no upcoming games within 2 hours; skipped fetch"

### Scenario 3: Morning Run
- **API Calls:** ~70 (uses fallback - expected)
- **Duration:** ~60 seconds
- **Logs:** "Morning run detected"
- **Note:** Optimization activates on subsequent polling runs

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong:

```bash
# List recent revisions
gcloud run revisions list \
  --service flashlive-scraper \
  --region us-central1 \
  --project flashlive-daily-scraper

# Rollback to previous revision
gcloud run services update-traffic flashlive-scraper \
  --to-revisions PREVIOUS_REVISION_NAME=100 \
  --region us-central1 \
  --project flashlive-daily-scraper
```

---

## 📝 Post-Deployment Monitoring

Monitor for 24 hours and check:
- [ ] Optimization messages appear in logs
- [ ] API call counts reduced
- [ ] Response times improved
- [ ] Games still update correctly
- [ ] Front-end displays correctly
- [ ] No increase in errors

---

## ✅ Ready to Deploy?

Run:
```bash
./deploy-flashlive-scraper.sh
```

Or manually:
```bash
gcloud run deploy flashlive-scraper --source=. --allow-unauthenticated --region=us-central1 --project=flashlive-daily-scraper --set-env-vars=SPREADSHEET_ID=1vSHd7VQzFjTeZhIbWGJHsU_Mbz5OOYvkPHyVU0auzWw,SHEET_NAME=Sheet1,FIREBASE_PROJECT_ID=flashlive-daily-scraper,RAPIDAPI_KEY=1c6421f9acmshe820d0c9faf1cf5p165f88jsnc42711af762d,RAPIDAPI_HOST=flashlive-sports.p.rapidapi.com
```
