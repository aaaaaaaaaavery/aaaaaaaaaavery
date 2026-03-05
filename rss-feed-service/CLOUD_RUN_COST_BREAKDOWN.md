# Complete Cost Breakdown: RSS Feed Service on Cloud Run

## Service Overview
- **Total Feeds**: 259 feeds
- **Background Job**: Runs every 15 minutes (96 times/day)
- **Frontend Requests**: ~1,000 per day
- **Runtime**: 24/7 (always-on for background jobs)

---

## 1. CLOUD RUN COSTS (SCALE TO ZERO)

### Resource Allocation
- **CPU**: 1 vCPU (only when processing requests)
- **Memory**: 1 GiB (only when processing requests)
- **Runtime**: Scale to zero (only charges when handling requests)
- **Background Jobs**: Triggered by Cloud Scheduler (not always-on)

### Monthly Usage
- **Frontend requests**: 30,000 per month (~2 seconds each)
- **Background jobs**: 2,880 per month (~5 minutes each, processing all 259 feeds)
- **Total requests**: 32,880 per month
- **CPU-seconds**: ~924,000 per month (only when processing)
- **Memory GiB-seconds**: ~924,000 per month (only when processing)

### Cloud Run Pricing (as of 2024)
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second
- **Requests**: First 2 million free, then $0.40 per million

### Cloud Run Cost Calculation

**CPU Cost:**
- 924,000 vCPU-seconds × $0.00002400 = **$22.18/month**

**Memory Cost:**
- 924,000 GiB-seconds × $0.00000250 = **$2.31/month**

**Request Cost:**
- 32,880 requests (all within free tier of 2M) = **$0.00/month**

**Cloud Scheduler Cost:**
- First 3 jobs free, then $0.10 per job
- 2,880 jobs/month = **$0.00/month** (all within free tier)

**Cloud Run Subtotal: $24.49/month**

---

## 2. FIRESTORE COSTS

### Monthly Operations
- **Reads**: 62,073,600 reads
- **Writes**: 22,377,600 writes
- **Storage**: ~1 GB

### Firestore Pricing (as of 2024)
- **Reads**: $0.06 per 100,000 document reads
- **Writes**: $0.18 per 100,000 document writes
- **Storage**: $0.18 per GB/month

### Firestore Cost Calculation

**Reads Cost:**
- 62,073,600 ÷ 100,000 = 620.736 units
- 620.736 × $0.06 = **$37.24/month**

**Writes Cost:**
- 22,377,600 ÷ 100,000 = 223.776 units
- 223.776 × $0.18 = **$40.28/month**

**Storage Cost:**
- 1 GB × $0.18 = **$0.18/month**

**Firestore Subtotal: $77.70/month**

---

## 3. TOTAL MONTHLY COST

### Summary
- **Cloud Run**: $24.49/month (24.0%)
- **Firestore**: $77.70/month (76.0%)
- **TOTAL**: **$102.19/month**

---

## 4. COST OPTIMIZATION OPTIONS

### Option 1: Reduce Resource Allocation
- **1 vCPU, 1 GiB**: Would reduce Cloud Run cost to ~$68.69/month
- **Risk**: May cause timeouts or performance issues with 259 feeds
- **New Total**: ~$146.39/month

### Option 2: Increase Background Refresh Interval
- **30 minutes instead of 15**: Cuts Firestore costs in half
- **Firestore**: ~$38.85/month
- **New Total**: ~$176.23/month

### Option 3: Reduce Items Per Feed
- **40 items instead of 80**: Cuts Firestore costs in half
- **Firestore**: ~$38.85/month
- **New Total**: ~$176.23/month

### Option 4: Use Minimum Resources + Optimizations
- **1 vCPU, 1 GiB** + **30 min refresh** + **40 items per feed**
- **Cloud Run**: ~$68.69/month
- **Firestore**: ~$19.43/month
- **New Total**: ~$88.12/month
- **Risk**: May impact performance

---

## 5. COMPARISON: CLOUD RUN vs LOCAL SQLITE

| Component | Cloud Run + Firestore | Local SQLite |
|-----------|----------------------|--------------|
| **Cloud Run** | $24.49/month | $0/month |
| **Firestore** | $77.70/month | $0/month |
| **Total** | **$102.19/month** | **$0/month** |
| **Reddit Feeds** | ✅ Works (Cloud Run IP) | ❌ Blocked (local IP) |

---

## 6. RECOMMENDATION

**For 24/7 operation with all feeds working:**
- **Cloud Run + Firestore**: $102.19/month
- **Pros**: All feeds work, automatic scaling, no IP blocking, scale-to-zero saves costs
- **Cons**: Still costs ~$100/month

**For cost savings:**
- **Local SQLite**: $0/month
- **Pros**: Free, instant performance
- **Cons**: Reddit feeds blocked (local IP issue)

**Hybrid Option (if implemented):**
- **Reddit feeds → Firestore**: ~$9.47/month
- **Other feeds → SQLite**: $0/month
- **Total**: ~$9.47/month
- **Pros**: Reddit works, minimal cost
- **Cons**: Requires code changes

---

## 7. NOTES

- Cloud Run uses **scale-to-zero** (only charges when processing requests)
- Background jobs triggered by **Cloud Scheduler** (free tier covers all jobs)
- Firestore costs are the main driver (76% of total cost)
- All costs are estimates based on current usage patterns
- Actual costs may vary based on:
  - Processing time per request (may be faster than estimated)
  - Background job duration (may be shorter than 5 minutes)
  - Traffic volume

