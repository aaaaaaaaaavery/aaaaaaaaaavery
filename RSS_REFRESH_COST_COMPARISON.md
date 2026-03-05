# RSS Feed Service: Cost Comparison (15 min vs 6 hours)

## Current Setup: 15 Minutes

### Frequency:
- **Runs every**: 15 minutes
- **Runs per day**: 96 times (24 hours × 4)
- **Runs per month**: 2,880 times (30 days × 96)

### Current Monthly Costs:
- **Firestore Reads**: 59,673,600 reads = **$37.24/month**
- **Firestore Writes**: 22,377,600 writes = **$40.28/month**
- **Firestore Storage**: ~1 GB = **$0.18/month**
- **Cloud Run Compute**: ~924,000 vCPU-seconds = **$24.49/month**
- **Total**: **$102.19/month**

---

## Proposed Setup: 6 Hours

### Frequency:
- **Runs every**: 6 hours
- **Runs per day**: 4 times (24 hours ÷ 6)
- **Runs per month**: 120 times (30 days × 4)

### Cost Calculation:

#### Reduction Factor:
- **Frequency reduction**: 2,880 → 120 = **24x less frequent** (96% reduction)

#### Firestore Operations:

**Per refresh (all 259 feeds):**
- Reads: 259 feeds × 80 = 20,720 reads
- Writes: 259 feeds × 30 = 7,770 writes

**Monthly operations (120 runs):**
- Reads: 20,720 × 120 = **2,486,400 reads/month**
- Writes: 7,770 × 120 = **932,400 writes/month**

**Cost calculation:**
- Reads: (2,486,400 ÷ 100,000) × $0.06 = **$1.49/month**
- Writes: (932,400 ÷ 100,000) × $0.18 = **$1.68/month**
- Storage: ~1 GB = **$0.18/month** (unchanged)
- **Firestore Subtotal**: **$3.35/month**

#### Cloud Run Compute:

**Monthly usage:**
- Background jobs: 120 jobs/month × ~5 minutes each = 600 minutes = 36,000 seconds
- CPU-seconds: ~36,000 per month (only when processing)
- Memory GiB-seconds: ~36,000 per month

**Cost calculation:**
- CPU: 36,000 × $0.00002400 = **$0.86/month**
- Memory: 36,000 × $0.00000250 = **$0.09/month**
- Requests: 120 requests (well within free tier) = **$0.00/month**
- **Cloud Run Subtotal**: **$0.95/month**

---

## Cost Comparison

| Component | 15 Minutes | 6 Hours | Savings |
|-----------|------------|---------|---------|
| **Firestore Reads** | $37.24 | $1.49 | **-$35.75** |
| **Firestore Writes** | $40.28 | $1.68 | **-$38.60** |
| **Firestore Storage** | $0.18 | $0.18 | $0.00 |
| **Cloud Run CPU** | $22.18 | $0.86 | **-$21.32** |
| **Cloud Run Memory** | $2.31 | $0.09 | **-$2.22** |
| **Cloud Run Requests** | $0.00 | $0.00 | $0.00 |
| **TOTAL** | **$102.19** | **$4.30** | **-$97.89** |

---

## Summary

### Current Cost (15 minutes): **$102.19/month**

### New Cost (6 hours): **$4.30/month**

### Monthly Savings: **$97.89/month** (96% reduction! 🎉)

---

## Trade-offs

### Pros of 6-hour refresh:
- ✅ **Massive cost savings** ($97.89/month)
- ✅ Feeds still update 4 times per day
- ✅ Still acceptable for most users (feeds update at 12 AM, 6 AM, 12 PM, 6 PM)
- ✅ Reduces Firestore quota usage significantly

### Cons of 6-hour refresh:
- ❌ Feeds update less frequently (4x per day instead of 96x)
- ❌ Breaking news may take up to 6 hours to appear
- ❌ Less "real-time" feel for users
- ❌ Higher chance of missing time-sensitive content

---

## Alternative: 1 Hour Refresh

If 6 hours feels too long, consider **1 hour refresh**:

### 1 Hour Refresh:
- **Runs per day**: 24 times
- **Runs per month**: 720 times
- **Monthly Cost**: ~**$25.55/month**
- **Savings**: **$76.64/month** (75% reduction)

This gives you:
- Hourly updates (still frequent enough for breaking news)
- Significant cost savings (75% reduction)
- Better balance between freshness and cost

---

## Recommendation

### For Temporary Cost Reduction: **6 hours is excellent**

If you just need to reduce costs temporarily:
- **6 hours = $4.30/month** (96% savings)
- Feeds still update 4x per day
- Most users won't notice the difference

### For Permanent Solution: **Consider 1 hour**

If you want to keep it longer term:
- **1 hour = $25.55/month** (75% savings)
- Hourly updates are more acceptable
- Still significant savings

### For Best User Experience: **30 minutes**

If you need more frequent updates:
- **30 minutes = $51.10/month** (50% savings)
- Updates every 30 minutes
- Better balance of freshness and cost

---

## How to Change Refresh Frequency

### If Using Cloud Scheduler:

```bash
# Update Cloud Scheduler job
gcloud scheduler jobs update rss-feed-refresh \
  --schedule="0 */6 * * *" \
  --location=us-central1 \
  --project=flashlive-daily-scraper
```

This sets it to run every 6 hours (at 12 AM, 6 AM, 12 PM, 6 PM).

### If Using Local Cron:

Edit crontab:
```bash
crontab -e
```

Change from:
```cron
*/15 * * * * /path/to/refresh-script.js  # Every 15 minutes
```

To:
```cron
0 */6 * * * /path/to/refresh-script.js  # Every 6 hours
```

---

## Expected Impact

### Current Situation:
- **Cost**: $102.19/month
- **Updates**: 96 times per day
- **Freshness**: Very high (15-minute updates)

### After Change (6 hours):
- **Cost**: $4.30/month ✅
- **Updates**: 4 times per day
- **Freshness**: Good (6-hour updates)
- **Savings**: $97.89/month (96% reduction)

---

## Notes

1. **Frontend reads are NOT affected** by this change
   - Frontend reads happen when users visit your site
   - This only affects background refresh jobs
   - Frontend costs remain the same

2. **First refresh after change may take longer**
   - If feeds haven't been refreshed in a while
   - First refresh may process more items

3. **Cache TTL should match refresh frequency**
   - Consider updating cache TTL to match 6-hour refresh
   - Prevents serving stale data
