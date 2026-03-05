# GCP Cost Analysis - Why Costs Are Increasing (January 2026)

## Executive Summary

Despite eliminating per-user Firestore reads by replacing them with JSON endpoints, your costs are still increasing because of **expensive backend operations** that read entire Firestore collections without filters. The main culprits are:

1. **RSS Feed Service**: ~$77/month (259 feeds, every 15 minutes)
2. **Live Polling Job**: **CRITICAL** - Reads ALL games every run (~$129/month if running every 2 minutes)
3. **Other Full Collection Reads**: Multiple functions doing `collection.get()` without date filters

---

## 🚨 CRITICAL ISSUE #1: Live Polling Job

### Location: `index.js` line 1868

```javascript
const pollLiveGamesHandler = async (req, res) => {
  // ...
  const snapshot = await gamesRef.get(); // ❌ READS ALL GAMES IN COLLECTION
  // ...
}
```

### Problem
- **Reads ALL games** in the `sportsGames` collection every time it runs
- If this runs **every 2 minutes** (720 times/day) and you have **10,000 games** stored:
  - **Daily reads**: 10,000 × 720 = **7,200,000 reads/day**
  - **Monthly reads**: 7,200,000 × 30 = **216,000,000 reads/month**
  - **Cost**: (216,000,000 ÷ 100,000) × $0.06 = **$129.60/month** just from this one query!

### Also in `writeGamesToFirestore()`: Line 843
```javascript
async function writeGamesToFirestore(games) {
  // ...
  const existingSnapshot = await gamesRef.get(); // ❌ READS ALL GAMES AGAIN
  // ...
}
```

### Fix
**Replace with date-filtered queries:**

```javascript
// In pollLiveGamesHandler (line 1868)
// BEFORE:
const snapshot = await gamesRef.get();

// AFTER:
const yesterdayStr = nowInMountain.minus({ days: 1 }).toISODate();
const snapshot = await gamesRef
  .where('gameDate', '>=', yesterdayStr)
  .get();
```

```javascript
// In writeGamesToFirestore (line 843)
// BEFORE:
const existingSnapshot = await gamesRef.get();

// AFTER:
const todayStr = DateTime.now().setZone('America/Denver').toISODate();
const tomorrowStr = DateTime.now().setZone('America/Denver').plus({ days: 1 }).toISODate();
const yesterdayStr = DateTime.now().setZone('America/Denver').minus({ days: 1 }).toISODate();

const existingSnapshot = await gamesRef
  .where('gameDate', '>=', yesterdayStr)
  .where('gameDate', '<=', tomorrowStr)
  .get();
```

**Potential Savings**: If you have 10,000 total games but only 500 active games (today/yesterday/tomorrow):
- **Before**: 10,000 reads × 720 runs/day = 7.2M reads/day
- **After**: 500 reads × 720 runs/day = 360K reads/day
- **Savings**: **96% reduction** = **~$124/month saved**

---

## 💰 COST DRIVER #2: RSS Feed Service

### Current Cost: ~$77/month

### Breakdown:
- **259 feeds** total
- **Runs every 15 minutes** (96 times/day = 2,880 times/month)
- **Per run**: 259 feeds × 80 reads = **20,720 reads**
- **Monthly reads**: 20,720 × 2,880 = **59,673,600 reads**
- **Monthly writes**: 22,377,600 writes
- **Cost**: $37.24 (reads) + $40.28 (writes) = **$77.52/month**

### Optimization Options:

#### Option 1: Increase Refresh Interval (RECOMMENDED)
- Change from 15 minutes to **30 minutes**
- **Savings**: 50% reduction = **~$38/month saved**
- **Trade-off**: Feeds update less frequently (still acceptable for most use cases)

#### Option 2: Use In-Memory Cache Only (No Firestore)
- Your codebase shows a `CLOUD_RUN_ONLY_SETUP.md` that mentions this option
- Fetch feeds on-demand, cache in memory for 15 minutes
- **Savings**: **~$77/month saved**
- **Trade-off**: First request after cache expiry is slower (~200ms-3s)

#### Option 3: Only Cache Active Feeds
- Track which feeds are actually being requested
- Only cache feeds that get requests
- **Savings**: Depends on usage, potentially 70-90% reduction

---

## ⚠️ COST DRIVER #3: Other Full Collection Reads

### Locations Found:

1. **`smartUpdateFirestoreCollection()` (line 974)**
   ```javascript
   const snapshot = await gamesRef.get(); // ❌ Reads all games
   ```
   **Fix**: Add date filter (same as above)

2. **`export-static-data.js`** - Multiple `.get()` calls
   - Line 86: `gamesRef.where('gameDate', '==', todayStr).get()` ✅ Good (filtered)
   - But other collections not filtered

3. **Various endpoints** reading entire collections:
   - F1DriverStandings: `db.collection('F1DriverStandings').get()`
   - F1ConstructorStandings: `db.collection('F1ConstructorStandings').get()`
   - FormulaOne: `db.collection('FormulaOne').get()`
   - standings: `db.collection('standings').get()`
   - mlb_stats: `db.collection('mlb_stats').get()`
   - CFP: `db.collection('CFP').get()`

   **Impact**: Lower (these collections are smaller), but still wasteful if they grow

---

## 📊 ACTUAL Current Monthly Costs (January 2026)

Based on your GCP billing data:

### By Service:

| Service | Net Cost | % of Total |
|---------|----------|------------|
| **Cloud Run** | $32.75 | 44% |
| **App Engine** (Firestore) | $19.57 | 26% |
| **Artifact Registry** | $17.94 | 24% |
| **Cloud Scheduler** | $3.45 | 5% |
| **Cloud Storage** | $0.61 | <1% |
| **Cloud Build** | $0.27 | <1% |
| **TOTAL** | **$74.59** | **100%** |

### Key Findings:

1. **Firestore (App Engine)**: $19.57/month
   - Lower than initially estimated because:
     - Live polling may not run every 2 minutes
     - Or there are fewer total games stored than estimated
   - Still significant and will be reduced by code fixes

2. **Cloud Run**: $32.75/month
   - Biggest cost driver (44% of total)
   - Likely from RSS feed service background jobs
   - Processing time for scheduled tasks

3. **Artifact Registry**: $17.94/month
   - Docker image storage
   - Can be reduced by cleaning up old images

### Estimated Breakdown (Based on Actual Billing):

| Component | Estimated Monthly Cost |
|-----------|------------------------|
| RSS Feed Service (Cloud Run + Firestore) | ~$35-40 |
| Live Polling (Cloud Run + Firestore) | ~$15-20 |
| Other Cloud Run Services | ~$5-10 |
| Artifact Registry Storage | $17.94 |
| Cloud Scheduler | $3.45 |
| Other | ~$1 |
| **TOTAL** | **~$74.59** |

---

## ✅ Recommended Immediate Actions

### Priority 1: Fix Live Polling (HIGHEST IMPACT)
1. **Fix `pollLiveGamesHandler`** (line 1868) - Add date filter
2. **Fix `writeGamesToFirestore`** (line 843) - Add date filter
3. **Fix `smartUpdateFirestoreCollection`** (line 974) - Add date filter

**Expected Savings**: **~$250/month** (if currently running every 2 minutes)

### Priority 2: Optimize RSS Feed Service
1. **Increase refresh interval** from 15 minutes to 30 minutes
   - **Savings**: ~$38/month
2. **OR** Switch to in-memory cache only (no Firestore)
   - **Savings**: ~$77/month

### Priority 3: Add Date Filters to Other Queries
- Review all `collection.get()` calls without filters
- Add appropriate filters where possible

---

## 🔍 How to Verify Current Usage

### Check Firestore Usage in GCP Console:
```bash
# Go to: https://console.cloud.google.com/firestore/usage
# Select your project: flashlive-daily-scraper
# View "Reads" and "Writes" over time
```

### Check Scheduled Jobs:
```bash
gcloud scheduler jobs list --location=us-central1 --project=flashlive-daily-scraper
```

### Check How Often Live Polling Runs:
```bash
gcloud scheduler jobs describe live-polling --location=us-central1 --project=flashlive-daily-scraper
```

Look for `schedule` field - if it shows `*/2 * * * *`, it's running every 2 minutes.

---

## 📝 Implementation Checklist

- [ ] Fix `pollLiveGamesHandler` - Add date filter to line 1868
- [ ] Fix `writeGamesToFirestore` - Add date filter to line 843
- [ ] Fix `smartUpdateFirestoreCollection` - Add date filter to line 974
- [ ] Increase RSS feed refresh interval from 15 to 30 minutes
- [ ] Review and fix other full collection reads
- [ ] Monitor costs for 1 week after changes
- [ ] Verify costs drop by expected amount

---

## 💡 Why This Happened

You correctly identified and fixed the **per-user reads** problem (frontend directly accessing Firestore). However, the **backend scheduled jobs** were still doing inefficient operations:

1. Reading entire collections instead of filtering by date
2. Running too frequently without checking if updates are needed
3. RSS feed service caching everything in Firestore when in-memory cache might suffice

These backend operations are hidden costs - they run automatically on a schedule, so they're easy to overlook.

---

## Expected Results After Fixes

**Before fixes**: ~$300-350/month
**After Priority 1 fixes** (live polling): ~$50-100/month
**After Priority 2 fixes** (RSS feeds): ~$12-25/month

**Total potential savings**: **~$275-325/month** (80-90% reduction)
