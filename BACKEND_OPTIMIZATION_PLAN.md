# Backend Optimization Plan - Cost Reduction

## Current Cost Breakdown (After Artifact Registry Cleanup)

**Daily costs: ~$1.24-1.66/day**
- Firestore reads (live-polling): ~$0.35/day (~$10.50/month) ⬅️ **BIGGEST**
- Firestore writes (live-polling): ~$0.15/day (~$4.50/month)
- Cloud Run (live-polling): ~$0.10/day (~$3.00/month)
- App Engine/Artifact Registry (cleaned): ~$0.004/day (~$0.12/month)
- Other services: ~$0.64-1.00/day

**Monthly: ~$37-50/month**

---

## 1. App Engine Costs - Additional Eliminations

### ✅ Already Done:
- Artifact Registry storage cleaned (was ~$10/month, now ~$0.12/month)

### ❌ Nothing Else to Eliminate:
- **No actual App Engine applications** exist in your project
- The "App Engine" costs were **only** Artifact Registry storage
- Cloud Build is **FREE** (within free tier of 120 build-minutes/day)
- No other App Engine services

**Conclusion:** Artifact Registry cleanup was the only App Engine cost.

---

## 2. Backend Optimization - Most Expensive Services

### 🔥 Priority 1: Optimize Live-Polling Firestore Reads

**Current Problem:**
- Runs every **5 minutes** = **288 executions/day**
- Each execution:
  - Line 4225: Reads ALL today's games (~100-500 reads)
  - Lines 4293-4300: Loops through **multiple dates** (often 7 dates) and reads each:
    ```javascript
    for (const dateStr of datesToCheckForDeletions) {
      const dateSnapshot = await gamesRef.where('gameDate', '==', dateStr).get();
    }
    ```
  - Total: **~800-4,000 Firestore reads per execution**
- Daily: **288 executions × ~2,000 reads = ~576,000 reads/day**
- Cost: **~$0.35/day = ~$10.50/month**

**Optimization Options:**

#### Option A: Reduce Polling Frequency ⭐ EASIEST
- **Current:** Every 5 minutes (288/day)
- **Optimize to:** Every 10 minutes (144/day)
- **Savings:** 50% reduction = **~$0.175/day = ~$5.25/month**

#### Option B: Cache Existing Games (Advanced)
- Store existing games in Cloud Run memory/cache
- Only read from Firestore once per day (morning run)
- Subsequent executions use cached data
- **Savings:** ~80% reduction = **~$0.07/day = ~$2.10/month**

#### Option C: Optimize Date Queries
- Only query dates that are actually needed
- Skip dates with no games
- **Savings:** ~20-30% reduction = **~$0.07-0.10/day = ~$2-3/month**

#### Option D: Use JSON Endpoint Instead of Firestore Queries
- Move existing games data to JSON endpoint (like we did for frontend)
- Backend reads from JSON instead of Firestore
- **Savings:** ~90% reduction = **~$0.035/day = ~$1.05/month**

**Recommendation:** **Option A + Option D** (reduce frequency + JSON endpoint)
- **Combined savings:** ~$6-7/month

---

### 🔥 Priority 2: Optimize Firestore Writes

**Current:**
- ~$0.15/day (~$4.50/month)
- Change detection already implemented ✅
- "Heartbeat writes" already removed ✅

**Additional Optimization:**
- Batch writes more efficiently
- **Potential savings:** ~$0.50-1.00/month (minimal)

---

### 🔥 Priority 3: Optimize Cloud Run Costs

**Current:**
- ~$0.10/day (~$3.00/month)
- Mostly from live-polling job execution time

**Optimization:**
- Reduce execution time by optimizing queries
- **Potential savings:** ~$0.50-1.00/month (minimal)

---

## Recommended Optimizations (Priority Order)

### 1. ✅ Reduce Live-Polling Frequency (EASY)
**Action:** Change from every 5 minutes to every 10 minutes
**Savings:** ~$5.25/month
**Impact:** Still updates every 10 minutes (plenty fast)

### 2. ✅ Optimize Date Queries (MEDIUM)
**Action:** Only query dates that have games, skip empty dates
**Savings:** ~$2-3/month
**Impact:** Reduces redundant queries

### 3. ⭐ Create JSON Endpoint for Existing Games (ADVANCED - BEST)
**Action:** Move existing games data to JSON endpoint, backend reads from JSON instead of Firestore
**Savings:** ~$1-2/month
**Impact:** Eliminates most backend Firestore reads

### 4. Cache Existing Games in Memory (ADVANCED)
**Action:** Store existing games in Cloud Run memory, only refresh once per day
**Savings:** ~$2-3/month
**Impact:** Reduces Firestore reads significantly

---

## Total Potential Savings

| Optimization | Monthly Savings | Difficulty |
|-------------|----------------|------------|
| Reduce polling to 10 min | ~$5.25 | Easy |
| Optimize date queries | ~$2-3 | Medium |
| JSON endpoint for existing games | ~$1-2 | Hard |
| Memory caching | ~$2-3 | Hard |
| **TOTAL POTENTIAL** | **~$10-13/month** | |

---

## Implementation Order

### Step 1: Reduce Polling Frequency (5 min → 10 min)
**Quick win, immediate savings**

### Step 2: Optimize Date Queries
**Medium effort, good savings**

### Step 3: JSON Endpoint + Memory Caching
**Advanced, maximum savings**

---

## Expected Final Costs (After All Optimizations)

**Before optimizations:** ~$37-50/month
**After optimizations:** ~$24-37/month
**Savings:** ~$13-20/month (~30-40% reduction)

**Plus Artifact Registry cleanup:**
- Before: ~$50-60/month total
- After: ~$24-37/month total
- **Total savings: ~$23-33/month (~45-55% reduction)**
