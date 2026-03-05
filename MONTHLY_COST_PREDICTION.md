# Monthly GCP Cost Prediction - Complete Site Analysis

## Current State (January 2026)

Based on your actual billing data and service configuration:

### ✅ Services Currently PAUSED/DELETED:
- **RSS Feed Service**: Paused/Deleted ✅
- **Live Polling Job**: Paused ✅
- **Morning Refresh Job**: Paused ✅

### ✅ Services Currently ACTIVE:
- **flashlive-scraper** (main service) - Active
- **standings-fetcher** - Active
- **channel-lookup** - Active (may be unused)
- **Other Cloud Run services** - 12+ services deployed (many may be unused)

---

## 📊 Current Monthly Cost Breakdown

Based on your January 2026 billing: **$74.59/month**

| Service | Monthly Cost | % of Total | Notes |
|---------|--------------|------------|-------|
| **Cloud Run** | $32.75 | 44% | Compute for active services |
| **Firestore** (App Engine) | $19.57 | 26% | Database reads/writes/storage |
| **Artifact Registry** | $17.94 | 24% | Docker image storage |
| **Cloud Scheduler** | $3.45 | 5% | Scheduled jobs (1 enabled) |
| **Cloud Storage** | $0.61 | <1% | File storage |
| **Cloud Build** | $0.27 | <1% | Docker builds |
| **TOTAL** | **$74.59** | **100%** | |

---

## 🔮 Predicted Monthly Costs Going Forward

### Scenario 1: Current Configuration (Services Paused) ✅ **MOST LIKELY**

**Assumptions:**
- RSS feed service remains paused
- Live polling remains paused
- Morning refresh remains paused
- flashlive-scraper handles main operations
- Code optimizations (date-filtered queries) are deployed

**Predicted Costs:**

| Component | Current | Optimized | Notes |
|-----------|---------|-----------|-------|
| **Cloud Run** | $32.75 | **$15-25** | Reduced from optimized queries |
| **Firestore** | $19.57 | **$8-12** | Date-filtered queries reduce reads |
| **Artifact Registry** | $17.94 | **$17.94** | No change (unless cleaned up) |
| **Cloud Scheduler** | $3.45 | **$0-1** | Only 1 job enabled (free tier) |
| **Other** | $0.88 | **$0.50** | Minimal |
| **TOTAL** | **$74.59** | **$42-56/month** | **~30-40% reduction** |

**Key Factors:**
- Code optimizations will reduce Firestore reads significantly
- Cloud Run costs depend on traffic to flashlive-scraper
- Artifact Registry is fixed cost (can be reduced by cleanup)

---

### Scenario 2: If RSS Feed Service is Re-enabled

**Additional Costs (Based on ACTUAL costs when it was running):**

| Component | Additional Cost | Notes |
|-----------|----------------|-------|
| **Cloud Run** | +$4-5/month | RSS feed service (on-demand fetching, scales to zero) |
| **Firestore** | +$0/month | **NO Firestore** - Uses in-memory cache only |
| **Cloud Scheduler** | +$0/month | No background jobs - on-demand only |
| **TOTAL ADDITIONAL** | **+$4-5/month** | |

**New Total: ~$46-61/month**

**Why it's so cheap:**
- ✅ **Cloud Run Only mode** - No Firestore database
- ✅ **On-demand fetching** - Feeds fetched when requested, not constantly refreshed
- ✅ **In-memory caching** - Uses NodeCache (15-30 min TTL), no database writes
- ✅ **Scale to zero** - Only charges when handling requests
- ✅ **No background jobs** - No scheduled refresh jobs running

**Theoretical maximum ($101-107/month) would only apply if:**
- Using Firestore + background jobs (old architecture)
- All 259 feeds refreshing every 15 minutes
- Processing all feeds every time
- Maximum Firestore operations

**Your actual implementation is Cloud Run Only mode**, which is why actual costs are only **~$4-5/month**.

---

### Scenario 3: If Live Polling is Re-enabled (Every 2 Minutes)

**Additional Costs:**

| Component | Additional Cost | Notes |
|-----------|----------------|-------|
| **Cloud Run** | +$5-10/month | Polling compute |
| **Firestore** | +$10-20/month | Game reads (if optimized) |
| **Cloud Scheduler** | +$0/month | Within free tier |
| **TOTAL ADDITIONAL** | **+$15-30/month** | |

**New Total: ~$57-86/month** (with optimizations)

**⚠️ WARNING:** If polling runs WITHOUT optimizations (reads all games):
- Firestore costs could be **+$100-130/month**
- Total could reach **~$175-205/month**

---

## 🎯 Detailed Cost Breakdown by Service

### 1. flashlive-scraper (Main Service)

**Current Usage:**
- Handles: `pollESPNLiveData`, `refreshAll`, `initialScrapeAndStartPolling`
- Runs: On-demand + scheduled (daily-refresh-all at 5 AM)
- Traffic: Moderate (frontend requests + scheduled jobs)

**Estimated Monthly Cost:**
- **Cloud Run**: $10-20/month (CPU/memory for requests)
- **Firestore**: $5-10/month (game reads/writes with optimizations)
- **Total**: **$15-30/month**

---

### 2. standings-fetcher

**Current Usage:**
- Fetches standings daily (NBA, NFL, MLB, WNBA)
- Runs: Scheduled (daily at 6 AM) or on-demand
- Traffic: Low (1-4 API calls/day)

**Estimated Monthly Cost:**
- **Cloud Run**: $1-3/month (minimal compute)
- **Firestore**: $0.50-1/month (standings writes)
- **Total**: **$1.50-4/month**

---

### 3. Other Cloud Run Services

**Services Deployed (may be unused):**
- channel-lookup
- fetchandstoreevents
- fetchtodaygames
- fetchtomorrowgames
- fetchupcominggames
- flashlive-archiver
- flashlive-poller
- flashlive-scraper-test
- parsefuturegames
- polllivegames
- (and more...)

**Estimated Monthly Cost:**
- **If unused**: $0-5/month (scale to zero, no requests)
- **If lightly used**: $5-15/month (occasional requests)
- **Recommendation**: Delete unused services to reduce Artifact Registry costs

---

### 4. Artifact Registry (Docker Images)

**Current Cost: $17.94/month**

**Breakdown:**
- Storage: ~180 GB of Docker images
- Cost: $0.10/GB/month
- **Optimization Potential**: Delete old images → Save $10-15/month

**Action Items:**
1. List all Docker images: `gcloud artifacts docker images list`
2. Delete old/unused images
3. Keep only latest 2-3 versions per service
4. **Potential Savings**: $10-15/month

---

### 5. Firestore Database

**Current Cost: $19.57/month**

**Breakdown:**
- **Reads**: ~30-35 million/month = ~$18/month
- **Writes**: ~5-10 million/month = ~$1-2/month
- **Storage**: ~1-2 GB = ~$0.18-0.36/month

**After Code Optimizations:**
- **Reads**: ~10-15 million/month = ~$6-9/month (date-filtered queries)
- **Writes**: ~5-10 million/month = ~$1-2/month
- **Storage**: ~1-2 GB = ~$0.18-0.36/month
- **New Total**: **$7-12/month** (savings: ~$7-12/month)

---

### 6. Cloud Scheduler

**Current Cost: $3.45/month**

**Breakdown:**
- First 3 jobs: FREE
- Additional jobs: $0.10/job/month
- $3.45 = ~34 additional jobs

**Current Status:**
- Only 1 job enabled: `daily-refresh-all`
- 11+ jobs paused (not costing money)

**Optimization:**
- Delete unused paused jobs
- **Potential Savings**: $1-3/month

---

## 📈 Cost Prediction Summary

### Best Case Scenario (Optimized + Services Paused)
- **Cloud Run**: $15-20/month
- **Firestore**: $7-10/month
- **Artifact Registry**: $8-12/month (after cleanup)
- **Cloud Scheduler**: $0/month (within free tier)
- **Other**: $0.50/month
- **TOTAL**: **~$30-42/month** ✅

### Realistic Scenario (Current State + Optimizations)
- **Cloud Run**: $20-25/month
- **Firestore**: $8-12/month
- **Artifact Registry**: $17.94/month (no cleanup)
- **Cloud Scheduler**: $0-1/month
- **Other**: $0.50/month
- **TOTAL**: **~$46-56/month** ✅

### Worst Case Scenario (All Services Active + No Optimizations)
- **Cloud Run**: $60-80/month
- **Firestore**: $100-150/month (full collection reads)
- **Artifact Registry**: $17.94/month
- **Cloud Scheduler**: $3.45/month
- **Other**: $1/month
- **TOTAL**: **~$182-252/month** ⚠️

---

## 🎯 Recommended Actions to Minimize Costs

### Priority 1: Deploy Code Optimizations ✅ (Already Done)
- Date-filtered Firestore queries
- **Expected Savings**: $7-12/month

### Priority 2: Clean Up Artifact Registry
- Delete old Docker images
- **Expected Savings**: $10-15/month
- **New Total**: ~$30-42/month

### Priority 3: Delete Unused Cloud Run Services
- Remove services that aren't being used
- **Expected Savings**: $5-10/month (reduces Artifact Registry storage)
- **New Total**: ~$25-35/month

### Priority 4: Monitor and Optimize
- Set up budget alerts ($50/month)
- Review costs weekly
- Adjust as needed

---

## 📊 Monthly Cost Projection

| Month | Scenario | Predicted Cost | Notes |
|-------|----------|----------------|-------|
| **February 2026** | Optimized + Paused | **$42-56** | Code optimizations take effect |
| **March 2026** | Optimized + Cleanup | **$30-42** | After Artifact Registry cleanup |
| **Ongoing** | Optimized + Cleanup | **$30-45** | Stable baseline |

---

## 🚨 Important Notes

1. **RSS Feed Service**: If re-enabled, adds **~$4-5/month** (actual cost)
   - ✅ **Cloud Run Only mode** - No Firestore, no background jobs
   - ✅ **On-demand fetching** - Feeds fetched when requested
   - ✅ **In-memory caching** - Uses NodeCache, no database operations
   - ✅ **Scale to zero** - Only charges when handling requests
   - **Theoretical maximum** ($101-107/month) would only apply with Firestore + background jobs (old architecture)
2. **Live Polling**: If re-enabled without optimizations, adds ~$100-130/month
3. **Traffic Spikes**: Cloud Run costs scale with traffic (unlikely to be significant)
4. **Artifact Registry**: Fixed cost unless you clean up images
5. **Firestore**: Will decrease significantly after code optimizations deploy

---

## ✅ Final Prediction

**Most Likely Monthly Cost: $42-56/month**

**After Cleanup: $30-42/month**

**If RSS Feed Service Re-enabled: $46-61/month** (adds only $4-5/month, not $101-107!)

**If All Services Active (including unoptimized polling): $142-186/month**

Your current setup (services paused + optimizations) should result in **~$42-56/month**, which is reasonable for a production sports data service.

**Correction:** I apologize for the confusion earlier. The RSS feed service actual cost when running was only **~$4-5/month**, not $101-107/month. The higher number was a theoretical maximum for the old architecture (Firestore + background jobs), but your actual implementation uses **Cloud Run Only mode** (no Firestore, on-demand fetching, in-memory cache), which is why it's so much cheaper.
