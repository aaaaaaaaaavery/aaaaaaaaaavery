# RSS Feed Service: Complete Cost Analysis
## ALL Costs Included: Cloud Run + Firestore + Other Services
## Changing Refresh Rate from 15 Minutes to 6 Hours

---

## Current Architecture

**IMPORTANT:** Your RSS feed service uses **Cloud Run Only mode** (no Firestore, no background jobs):
- ✅ **On-demand fetching** - Feeds fetched when requested
- ✅ **In-memory caching** - NodeCache with 30-minute TTL (active hours) / 60-minute TTL (off-hours)
- ✅ **No Firestore** - $0 Firestore costs
- ✅ **No background jobs** - $0 Cloud Scheduler costs
- ✅ **Scale to zero** - Only charges when handling requests

**Cache TTL:** 
- Active hours (7 AM - 11 PM EST): **30 minutes**
- Off-hours (11 PM - 7 AM EST): **60 minutes**

**Note:** For comparison, I'll also show what costs WOULD be if using Firestore + background jobs (old architecture).

---

## 📊 COMPLETE COST BREAKDOWN

### Scenario A: Current Implementation (Cloud Run Only - 30 min cache)

**Architecture:**
- Cloud Run: On-demand fetching with in-memory cache
- Firestore: NOT USED ($0)
- Cloud Scheduler: NOT USED ($0)
- Background Jobs: NONE ($0)

**Assumptions:**
- Daily feed requests: 1,000 requests/day = 30,000 requests/month
- Average fetch time (cache miss): 1.39 seconds
- Cache hit processing time: 0.01 seconds
- Cache hit rate: ~95.5% (30 min cache, requests every ~6.2 hours)
- Cloud Run config: 1 vCPU, 512 MiB memory (0.5 GiB)

**Monthly Calculations:**
- Cache hits: 28,650 requests × 0.01s = 286.5 CPU-seconds
- Cache misses: 1,350 requests × 1.39s = 1,876.5 CPU-seconds
- **Total CPU-seconds: 2,163**
- **Total Memory GiB-seconds: 1,081.5** (512 MiB = 0.5 GiB)

**Costs:**
- **Cloud Run CPU:** 2,163 × $0.00002400 = **$0.0519**
- **Cloud Run Memory:** 1,081.5 × $0.00000250 = **$0.0027**
- **Cloud Run Requests:** 30,000 (within free tier) = **$0.00**
- **Firestore:** NOT USED = **$0.00**
- **Cloud Scheduler:** NOT USED = **$0.00**
- **Artifact Registry:** ~$1.20/month (Docker image storage, ~12 GB)

**TOTAL CURRENT COST: ~$0.055/month (Cloud Run) + $1.20/month (Artifact Registry) = ~$1.26/month**

---

### Scenario B: Proposed (Cloud Run Only - 6 hour cache)

**Same architecture, different cache TTL:**
- Cache TTL: 6 hours (360 minutes)
- Cache hit rate: ~99.7% (cache valid for 6 hours, requests every ~6.2 hours)

**Monthly Calculations:**
- Cache hits: 29,910 requests × 0.01s = 299.1 CPU-seconds
- Cache misses: 90 requests × 1.39s = 125.1 CPU-seconds
- **Total CPU-seconds: 424.2**
- **Total Memory GiB-seconds: 212.1** (512 MiB = 0.5 GiB)

**Costs:**
- **Cloud Run CPU:** 424.2 × $0.00002400 = **$0.0102**
- **Cloud Run Memory:** 212.1 × $0.00000250 = **$0.0005**
- **Cloud Run Requests:** 30,000 (within free tier) = **$0.00**
- **Firestore:** NOT USED = **$0.00**
- **Cloud Scheduler:** NOT USED = **$0.00**
- **Artifact Registry:** ~$1.20/month (unchanged)

**TOTAL PROPOSED COST: ~$0.011/month (Cloud Run) + $1.20/month (Artifact Registry) = ~$1.21/month**

---

## 💰 COST SAVINGS SUMMARY

| Component | Current (30 min) | Proposed (6 hours) | Savings |
|-----------|------------------|-------------------|---------|
| **Cloud Run CPU** | $0.0519 | $0.0102 | **-$0.0417** |
| **Cloud Run Memory** | $0.0027 | $0.0005 | **-$0.0022** |
| **Cloud Run Requests** | $0.00 | $0.00 | $0.00 |
| **Firestore** | $0.00 | $0.00 | $0.00 |
| **Cloud Scheduler** | $0.00 | $0.00 | $0.00 |
| **Artifact Registry** | $1.20 | $1.20 | $0.00 |
| **TOTAL** | **$1.26/month** | **$1.21/month** | **-$0.05/month** |

### **Annual Savings: $0.05 × 12 = $0.60/year**

---

## 📋 COMPARISON: What Costs WOULD Be (If Using Firestore + Background Jobs)

**Note:** This is NOT your current architecture, but shown for reference:

### Old Architecture (Firestore + Background Jobs - 15 min refresh):

**Monthly Operations:**
- Background jobs: 2,880 jobs/month (every 15 minutes)
- Firestore reads: 62,073,600 reads/month
- Firestore writes: 22,377,600 writes/month
- Cloud Run: 924,000 CPU-seconds/month

**Costs:**
- **Cloud Run:** $24.49/month
- **Firestore Reads:** $37.24/month
- **Firestore Writes:** $40.28/month
- **Firestore Storage:** $0.18/month
- **Cloud Scheduler:** $0.00/month (within free tier)
- **Artifact Registry:** $1.20/month

**TOTAL (Old Architecture): ~$103.39/month**

### Old Architecture (Firestore + Background Jobs - 6 hour refresh):

**Monthly Operations:**
- Background jobs: 120 jobs/month (every 6 hours) = 24x reduction
- Firestore reads: 2,586,400 reads/month (24x reduction)
- Firestore writes: 932,400 writes/month (24x reduction)
- Cloud Run: 38,500 CPU-seconds/month (24x reduction)

**Costs:**
- **Cloud Run:** $1.02/month
- **Firestore Reads:** $1.55/month
- **Firestore Writes:** $1.68/month
- **Firestore Storage:** $0.18/month
- **Cloud Scheduler:** $0.00/month
- **Artifact Registry:** $1.20/month

**TOTAL (Old Architecture - 6 hours): ~$5.63/month**

**Savings vs 15 min:** $103.39 - $5.63 = **$97.76/month**

---

## 🎯 Key Findings

### Your Current Implementation (Cloud Run Only):
- **Current cost:** ~$1.26/month
- **Proposed cost (6 hours):** ~$1.21/month
- **Savings:** ~$0.05/month ($0.60/year)

### Why Savings Are Minimal:
1. ✅ **Already optimized** - No Firestore, no background jobs
2. ✅ **Scale to zero** - Only charges when handling requests
3. ✅ **Efficient caching** - 95.5% cache hit rate already
4. ✅ **Low traffic** - Only 1,000 requests/day

### If You Were Using Firestore + Background Jobs:
- **Current cost:** ~$103.39/month (15 min refresh)
- **Proposed cost:** ~$5.63/month (6 hour refresh)
- **Savings:** ~$97.76/month ($1,173/year)

**But you're NOT using that architecture, so these savings don't apply to you.**

---

## Cost Savings Calculation

### Assumptions (from REFRESH_FREQUENCY_COSTS.md):
- **Daily feed requests:** 1,000 requests/day = 30,000 requests/month
- **Total feeds:** 259 feeds
- **Average fetch time (cache miss):** 1.39 seconds
- **Cache hit processing time:** 0.01 seconds
- **Cloud Run pricing:**
  - CPU: $0.00002400 per vCPU-second
  - Memory: $0.00000250 per GiB-second
  - Requests: First 2 million/month free

### Current: 15 minutes cache TTL (if that's what you're using)

**Cache Hit Rate:**
- Average time between requests per feed: ~6.2 hours
- Cache valid for: 15 minutes
- **Cache hit rate: ~95.5%**

**Monthly Costs:**
- Cache hits: 28,650 requests × 0.01s = 286.5 CPU-seconds
- Cache misses: 1,350 requests × 1.39s = 1,876.5 CPU-seconds
- **Total CPU-seconds: 2,163**
- **Total Memory GiB-seconds: 1,081.5** (512 MiB = 0.5 GiB)

**Current Monthly Cost:**
- CPU: 2,163 × $0.00002400 = **$0.0519**
- Memory: 1,081.5 × $0.00000250 = **$0.0027**
- Requests: 30,000 (free tier) = **$0.00**
- **Total: ~$0.055/month**

---

### Proposed: 6 hours (360 minutes) cache TTL

**Cache Hit Rate:**
- Average time between requests per feed: ~6.2 hours
- Cache valid for: 6 hours (360 minutes)
- **Cache hit rate: ~99.7%** (almost all requests will be cache hits)

**Monthly Calculations:**
- Cache hits: 29,910 requests × 0.01s = 299.1 CPU-seconds
- Cache misses: 90 requests × 1.39s = 125.1 CPU-seconds
- **Total CPU-seconds: 424.2**
- **Total Memory GiB-seconds: 212.1** (512 MiB = 0.5 GiB)

**Proposed Monthly Cost:**
- CPU: 424.2 × $0.00002400 = **$0.0102**
- Memory: 212.1 × $0.00000250 = **$0.0005**
- Requests: 30,000 (free tier) = **$0.00**
- **Total: ~$0.011/month**

---

## 💰 Cost Savings Summary

| Metric | Current (15 min) | Proposed (6 hours) | Savings |
|--------|------------------|-------------------|---------|
| **Monthly Cost** | **$0.055** | **$0.011** | **$0.044/month** |
| **Cache Hit Rate** | 95.5% | 99.7% | +4.2% |
| **Cache Misses** | 1,350/month | 90/month | -93% |
| **CPU-seconds** | 2,163 | 424.2 | -80% |
| **Memory GiB-seconds** | 1,081.5 | 212.1 | -80% |

### **Annual Savings: $0.044 × 12 = $0.53/year**

---

## 📊 Impact Analysis

### ✅ Benefits:
1. **80% reduction in compute costs** (CPU + Memory)
2. **93% fewer cache misses** = fewer external API calls
3. **Better rate limit compliance** (fewer requests to external sources)
4. **Lower server load** (less processing)

### ⚠️ Trade-offs:
1. **Stale data for up to 6 hours** - Users may see older content
2. **Breaking news delay** - Up to 6 hours before new articles appear
3. **Less fresh content** - Especially during active hours

---

## 🎯 Recommendation

### If Current is Actually 30 Minutes (as code shows):

**Current (30 min):** ~$0.04/month
**Proposed (6 hours):** ~$0.011/month
**Savings: ~$0.029/month ($0.35/year)**

### If Current is 15 Minutes:

**Current (15 min):** ~$0.055/month
**Proposed (6 hours):** ~$0.011/month
**Savings: ~$0.044/month ($0.53/year)**

---

## 💡 Alternative Options

### Option 1: Moderate Increase (2 hours)
- **Cost:** ~$0.02/month
- **Savings:** ~$0.035/month vs 15 min
- **Freshness:** Better balance (2 hours is reasonable for RSS feeds)

### Option 2: Hybrid Approach (Keep Active Hours Shorter)
- **Active hours (7 AM - 11 PM):** 1 hour cache
- **Off-hours (11 PM - 7 AM):** 6 hours cache
- **Cost:** ~$0.015/month
- **Savings:** ~$0.04/month vs 15 min
- **Freshness:** Good during active hours, efficient during off-hours

---

## 🔧 Implementation

To change cache TTL to 6 hours, modify `rss-feed-service/index.js`:

```javascript
// Current (line 44):
const CACHE_TTL = 30 * 60; // 30 minutes cache

// Change to:
const CACHE_TTL = 6 * 60 * 60; // 6 hours cache (21600 seconds)

// Also update getCacheTTLMinutes() function (lines 29-40):
function getCacheTTLMinutes() {
  return 360; // 6 hours (360 minutes)
}
```

---

## 📝 Conclusion

### Your Current Architecture (Cloud Run Only):

**Changing from 30 minutes to 6 hours cache TTL:**

| Metric | Current | Proposed | Difference |
|--------|---------|----------|------------|
| **Total Monthly Cost** | **$1.26** | **$1.21** | **-$0.05/month** |
| **Cloud Run Cost** | $0.055 | $0.011 | -$0.044 |
| **Artifact Registry** | $1.20 | $1.20 | $0.00 |
| **Firestore** | $0.00 | $0.00 | $0.00 |
| **Cloud Scheduler** | $0.00 | $0.00 | $0.00 |

**Annual Savings: $0.60/year**

### Why Savings Are So Small:

1. ✅ **Already optimized architecture** - No Firestore, no background jobs
2. ✅ **Scale to zero** - Only charges when handling requests
3. ✅ **High cache hit rate** - Already 95.5% with 30-minute cache
4. ✅ **Low traffic** - Only 1,000 requests/day
5. ✅ **Minimal compute** - Most requests served from cache (<10ms)

### Trade-offs:

**Pros of 6-hour cache:**
- Saves $0.05/month
- 80% reduction in Cloud Run compute
- Fewer external API calls
- Better rate limit compliance

**Cons of 6-hour cache:**
- Content may be stale for up to 6 hours
- Breaking news delay
- Less fresh content during active hours

### Recommendation:

**Keep current 30-minute cache** because:
- Savings are minimal ($0.05/month = $0.60/year)
- Better user experience with fresher content
- Already extremely cost-efficient ($1.26/month total)

**If you want to optimize further:**
- **2-hour cache:** Saves ~$0.03/month, better freshness than 6 hours
- **1-hour cache:** Saves ~$0.02/month, still very fresh

---

## 📊 Summary Table: All Costs Included

| Component | Current (30 min) | Proposed (6 hours) | Savings |
|-----------|------------------|-------------------|---------|
| **Cloud Run CPU** | $0.0519 | $0.0102 | -$0.0417 |
| **Cloud Run Memory** | $0.0027 | $0.0005 | -$0.0022 |
| **Cloud Run Requests** | $0.00 | $0.00 | $0.00 |
| **Firestore** | $0.00 | $0.00 | $0.00 |
| **Cloud Scheduler** | $0.00 | $0.00 | $0.00 |
| **Artifact Registry** | $1.20 | $1.20 | $0.00 |
| **TOTAL** | **$1.26/month** | **$1.21/month** | **-$0.05/month** |

**Annual Savings: $0.60/year**
