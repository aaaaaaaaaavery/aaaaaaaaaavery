# Costs After Pausing Services - What Stops vs What Continues

## What You Paused

✅ **Cloud Scheduler: live-polling** - Paused  
✅ **Cloud Scheduler: morning-refresh** - Paused  
✅ **Cloud Run: rss-feed-service** - Deleted/Paused  

---

## ❌ What Costs WILL STOP

### 1. RSS Feed Service Costs
- **Cloud Run compute**: $0/month (service deleted)
- **Firestore reads/writes from RSS feeds**: $0/month (no background jobs)
- **Savings**: ~$4-5/month (depending on traffic)

### 2. Live Polling Job Costs
- **Cloud Run compute for polling**: Reduced (job paused)
- **Firestore reads/writes from polling**: $0/month (job not running)
- **Savings**: ~$10-20/month (depending on frequency)

### 3. Morning Refresh Job Costs
- **Cloud Run compute**: Reduced (job paused)
- **Firestore reads/writes**: $0/month (job not running)
- **Savings**: Depends on what this job does

### 4. Cloud Scheduler Costs
- If these were your only paid jobs (beyond first 3 free), you save $0.10 per job per month
- **Savings**: Minimal (likely $0 since first 3 jobs are free)

---

## ⚠️ What Costs WILL CONTINUE

### 1. Other Cloud Run Services (Still Running)
Based on your billing breakdown, you have **many other Cloud Run services** still running:

- flashlive-scraper (main service)
- standings-fetcher
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
- And more...

**Estimated cost**: ~$20-30/month (if they're actively receiving requests)

### 2. Firestore Storage Costs
- **Storage**: ~$0.18/GB/month (first 1 GB free)
- Even if no reads/writes, you still pay for storage
- **Cost**: Depends on data size (likely $0-5/month if under 1 GB)

### 3. Artifact Registry (Docker Images)
- **Storage**: ~$0.10/GB/month
- You have Docker images stored for all your Cloud Run services
- **Cost**: ~$17.94/month (from your billing - this doesn't stop just because services are paused)

### 4. Other Active Services
- Any other Cloud Run services still running
- Any other Cloud Scheduler jobs still active
- Any other GCP services you're using

---

## Expected Costs After Pausing

### Your Current Monthly Costs:
- **Cloud Run**: $32.75/month
- **App Engine (Firestore)**: $19.57/month
- **Artifact Registry**: $17.94/month
- **Cloud Scheduler**: $3.45/month
- **Other**: ~$0.88/month
- **Total**: **$74.59/month**

### After Pausing RSS Feed Service + Polling Jobs:

**Costs that STOP:**
- RSS feed service Cloud Run: ~$0.05/month
- RSS feed Firestore operations: ~$1.44/month (if no background jobs)
- Live polling Firestore operations: ~$10-20/month
- Morning refresh operations: Varies
- **Total stopped**: ~$15-25/month

**Costs that CONTINUE:**
- Other Cloud Run services: ~$20-30/month
- Firestore storage: ~$0-5/month (depending on data size)
- **Artifact Registry storage**: ~$17.94/month ⚠️ **This doesn't stop!**
- Other services: ~$1-5/month
- **Total continuing**: ~$40-55/month

### New Estimated Total: ~$40-55/month

**Savings**: ~$20-35/month (not zero, but significant reduction)

---

## Why You Still Have Costs

### 1. Artifact Registry ($17.94/month)
- **This is storage for Docker images**
- Pausing services doesn't delete the images
- Images are still stored, so you still pay
- **To stop this cost**: Delete old Docker images

### 2. Other Cloud Run Services (~$20-30/month)
- You have many other services still running
- flashlive-scraper (main service) is likely still running
- These services cost money when they receive requests
- **To stop this cost**: Pause/delete other services too

### 3. Firestore Storage (~$0-5/month)
- Data is still stored in Firestore
- You pay for storage even if no one accesses it
- First 1 GB is free, then $0.18/GB/month
- **To stop this cost**: Delete data from Firestore (or keep it - it's cheap)

---

## To Get Closer to Zero Costs

### Option 1: Pause Other Cloud Run Services
If you want to minimize costs further:

```bash
# List all Cloud Run services
gcloud run services list --region=us-central1 --project=flashlive-daily-scraper

# Pause/delete services you don't need
gcloud run services delete SERVICE_NAME --region=us-central1 --quiet
```

**Savings**: ~$20-30/month (but this breaks your website features)

### Option 2: Clean Up Artifact Registry
Delete old Docker images:

```bash
# List images
gcloud artifacts docker images list \
  --repository=REPO_NAME \
  --location=us-central1

# Delete old images (keep only latest 2-3 versions)
gcloud artifacts docker images delete IMAGE:TAG \
  --repository=REPO_NAME \
  --location=us-central1
```

**Savings**: ~$10-15/month (if you can delete old images)

### Option 3: Keep Services Paused (Current State)
- RSS feed service: Paused ✅
- Live polling: Paused ✅
- Morning refresh: Paused ✅
- Other services: Still running
- **Cost**: ~$40-55/month (down from $74.59/month)

---

## Summary

### Question: "Should I have no costs from GCP now?"

**Answer: No, you'll still have ~$40-55/month in costs**

### What Stopped:
- ✅ RSS feed service costs (~$5/month)
- ✅ Live polling operations (~$10-20/month)
- ✅ Morning refresh operations (varies)
- ✅ Cloud Scheduler costs (minimal)

### What Continues:
- ❌ Other Cloud Run services (~$20-30/month)
- ❌ Artifact Registry storage (~$17.94/month) ⚠️
- ❌ Firestore storage (~$0-5/month)
- ❌ Other services (~$1-5/month)

### Estimated New Total: ~$40-55/month

**Savings from pausing**: ~$20-35/month (about 30-50% reduction)

---

## Next Steps

### 1. Monitor Your Costs
Check your billing in a few days to see actual costs:
```
https://console.cloud.google.com/billing
```

### 2. If You Want to Reduce Further
- **Clean up Artifact Registry** (save ~$10-15/month)
- **Pause other Cloud Run services** (save ~$20-30/month, but breaks features)
- **Delete unused Firestore data** (save ~$0-5/month)

### 3. If Current Costs Are Acceptable
- Keep services paused (you're already saving ~$20-35/month)
- Monitor costs to confirm
- You've made good progress!

---

## Bottom Line

**No, you won't have zero costs** - but you've **significantly reduced costs** (~$20-35/month savings).

The remaining costs are from:
1. **Artifact Registry storage** ($17.94/month) - Docker images
2. **Other Cloud Run services** (~$20-30/month) - Still running
3. **Firestore storage** (~$0-5/month) - Data stored

To get closer to zero, you'd need to:
- Clean up Artifact Registry
- Pause/delete other Cloud Run services (but this breaks your site)
- Delete Firestore data (but this removes your data)

**Current state is a good balance** - significant savings without breaking your site!
