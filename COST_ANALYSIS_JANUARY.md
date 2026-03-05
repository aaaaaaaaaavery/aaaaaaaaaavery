# GCP Cost Analysis: Actual Billing Data (January 2026)

## ✅ ACTUAL BILLING DATA (Jan 1-2, 2026)
- **Total cost**: $1.01 for 2 days (~$0.50/day)
- **App Engine**: $0.70 (Firestore Read Ops in Iowa)
- **Artifact Registry**: $0.31 (storage)
- **Cloud Run**: $0.00 (scaling to zero properly ✅)

**Projected monthly cost**: ~$15/month (not $38!)

## ❌ PREVIOUS ANALYSIS WAS WRONG

## 🔍 ACTUAL Cost Breakdown

### 1. **Firestore Reads** (App Engine billing): $0.70 for 2 days
- **Per day**: $0.35/day
- **Per month**: ~$10.50/month
- This is much lower than theoretical estimates
- Likely from: Live game polling, standings scrapers, RSS feed reads

**Why it shows as "App Engine"?**
- Firestore operations initiated from App Engine services show up under App Engine billing
- This is normal GCP billing attribution

### 2. **Artifact Registry**: $0.31 for 2 days
- **Per day**: $0.15/day  
- **Per month**: ~$4.50/month
- Docker image storage for Cloud Run services

### 3. **Cloud Run**: $0.00 ✅
- Services are scaling to zero properly
- No charges when idle

---

## 💰 Why Cost Might Have Increased Dec → Jan

**Possible reasons:**
1. **More Firestore reads** - More games, more polling, more users
2. **Artifact Registry growth** - More Docker images stored
3. **But your current rate ($0.50/day) projects to ~$15/month, not $38**

**Question**: Was December $19 for the whole month, or just a few days?
- If $19/month → January at $15/month is actually **lower**
- If $19 for a few days → That would project much higher

---

## 🔧 How to Check What's Actually Costing Money

### Step 1: Check GCP Billing Dashboard
```bash
# Go to: https://console.cloud.google.com/billing
# Select your billing account
# Click "Reports" → Group by "Service"
```

Look for:
- **Firestore:** Should show reads/writes/storage costs
- **Cloud Run:** Should show CPU/memory/request costs
- **Cloud Scheduler:** Should be $0 (first 3 jobs free)

### Step 2: Check Firestore Usage
```bash
# Check Firestore operations
gcloud firestore operations list --project=flashlive-daily-scraper
```

### Step 3: Check Cloud Scheduler Jobs
```bash
# See what's actually running
gcloud scheduler jobs list --location=us-central1 --project=flashlive-daily-scraper
```

Look for:
- `live-polling` job (every 2 minutes) - **THIS IS EXPENSIVE**
- RSS feed refresh jobs

---

## 🎯 Cost Optimization Recommendations (Based on Actual Data)

### Current Situation: ~$15/month is actually quite reasonable!

### Option 1: Optimize Firestore Reads in Live Polling (IF costs grow)
**Current issue**: `pollLiveGamesHandler` does `await gamesRef.get()` which reads ALL games
**Optimization**: Only read today's games

```javascript
// In pollLiveGamesHandler, replace:
const snapshot = await gamesRef.get();

// With:
const snapshot = await gamesRef
  .where('gameDate', '>=', todayStr)
  .where('gameDate', '<=', tomorrowStr)
  .get();
```

**Potential savings**: 50-80% reduction in reads (if you have many old games stored)

### Option 2: Reduce Live Polling Frequency (IF needed)
**Current:** Every 2 minutes
**Change to:** Every 5 minutes

**Savings:** 60% reduction in polling reads
**Trade-off:** Slightly less real-time updates

### Option 3: Clean Up Artifact Registry
**Check old/unused Docker images:**
```bash
gcloud artifacts docker images list \
  --repository=YOUR_REPO \
  --location=us-central1 \
  --project=flashlive-daily-scraper
```

Delete unused images to reduce storage costs.

---

## 📊 Actual vs Projected Costs

### Current Rate (Jan 1-2):
- **$0.50/day** = **~$15/month**
- Firestore reads: $0.35/day = ~$10.50/month
- Artifact Registry: $0.15/day = ~$4.50/month

### If December was $19/month:
- **January is actually LOWER** at ~$15/month ✅

### If December was $19 for a few days:
- That would project to much higher monthly costs
- Need to check what period December $19 covered

---

## 🚨 Immediate Action Items

1. ✅ **Done**: Checked actual billing - costs are reasonable (~$15/month)
2. **Verify**: What period did December $19 cover? (whole month vs few days)
3. **Monitor**: Watch if Firestore reads increase over time
4. **Optional**: Optimize live polling queries if costs grow

---

## 📝 Notes

- **Cloud Run is working perfectly** - scaling to zero, $0 costs ✅
- **Firestore reads** are the main cost driver (~$10.50/month)
- **Artifact Registry** storage is minimal (~$4.50/month)
- Your costs are actually quite reasonable for a production service

**The $19 → $38 concern may be based on:**
- Comparing different time periods (e.g., $19 for 5 days vs $38 for 30 days)
- Temporary spike during December (holiday season = more games?)
- Or I was completely wrong in my initial analysis (which I was - sorry!)

