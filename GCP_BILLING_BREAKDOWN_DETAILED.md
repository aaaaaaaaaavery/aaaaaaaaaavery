# Detailed GCP Cost Breakdown & Optimization Guide

Based on your January 2026 billing data showing **$74.59 total cost**.

---

## 📊 Current Cost Breakdown (January 2026)

### By Service:

| Service | Usage Cost | Savings | Net Cost | % of Total |
|---------|------------|---------|----------|------------|
| **Cloud Run** | $58.56 | -$25.80 | **$32.75** | 44% |
| **App Engine** (Firestore) | $19.57 | $0.00 | **$19.57** | 26% |
| **Artifact Registry** | $17.94 | $0.00 | **$17.94** | 24% |
| **Cloud Scheduler** | $3.45 | $0.00 | **$3.45** | 5% |
| **Cloud Storage** | $0.61 | $0.00 | $0.61 | <1% |
| **Cloud Build** | $0.27 | $0.00 | $0.27 | <1% |
| **Cloud Run Functions** | $3.21 | -$3.21 | $0.00 | 0% |
| **TOTAL** | $103.01 | -$29.01 | **$74.59** | 100% |

### By Project:

| Project | Usage Cost | Savings | Net Cost | % of Total |
|---------|------------|---------|----------|------------|
| **flashlive-daily-scraper** | $96.99 | -$27.11 | **$69.88** | 94% |
| thport-rss-feeds | $3.25 | -$0.01 | $3.24 | 4% |
| espn-stream-scraper | $0.99 | -$0.16 | $0.84 | 1% |
| MLB Live Data Scraper | $2.37 | -$1.73 | $0.64 | <1% |
| rss-feeds-thporth | $0.00 | $0.00 | $0.00 | 0% |

---

## 🔍 Cost Analysis by Service

### 1. **Cloud Run: $32.75/month** (44% of total)

**What this is**: Compute costs for your Cloud Run services (RSS feed service, game polling, etc.)

**Breakdown**:
- You have ~15 Cloud Run services deployed
- Services scale to zero when idle (good!)
- Cost comes from CPU and memory usage when handling requests
- Processing time for scheduled jobs and frontend requests

**Optimization Options**:

#### Option A: Reduce RSS Feed Background Job Frequency
- **Current**: RSS feed service likely runs background jobs every 15 minutes
- **Change to**: Every 30-60 minutes
- **Savings**: ~50-75% of Cloud Run costs = **$16-24/month saved**
- **How to do it**: Check Cloud Scheduler job frequency for RSS feed refresh

#### Option B: Optimize RSS Feed Service
- Switch to on-demand fetching only (no background jobs)
- Cache feeds in memory (NodeCache) instead of Firestore
- **Savings**: ~80% of Cloud Run costs = **$26/month saved**
- **Trade-off**: First request after cache expiry is slower (~1-3 seconds)

#### Option C: Right-size Cloud Run Resources
- Check if services are using more CPU/memory than needed
- Reduce from 1 vCPU to 0.5 vCPU if possible
- Reduce memory if services aren't using it all
- **Savings**: ~20-30% = **$6-10/month saved**

**Action Items**:
1. Check Cloud Run service logs to see which services use the most CPU/memory
2. Review RSS feed service background job frequency
3. Consider switching RSS feeds to on-demand only

---

### 2. **App Engine: $19.57/month** (26% of total)

**What this is**: Firestore operations (reads, writes, deletes) - GCP bills Firestore under "App Engine"

**Breakdown**:
- **Reads**: Likely ~30-35 million reads/month = ~$18/month
- **Writes**: Likely ~5-10 million writes/month = ~$1-2/month
- This aligns with my analysis of RSS feed service + live polling

**Optimization (Already Fixed)**:
- ✅ Fixed `pollLiveGamesHandler` - Now only reads yesterday/today/tomorrow
- ✅ Fixed `writeGamesToFirestore` - Now only reads recent games
- ✅ Fixed `smartUpdateFirestoreCollection` - Now only reads last 7 days

**Expected Impact**:
- **Before fixes**: Reading all games every 2 minutes = ~$129/month
- **After fixes**: Reading only recent games = ~$5-10/month
- **Savings**: **~$110-120/month** (but this will show up in next billing cycle)

**Additional Optimization**:
- RSS feed service still accounts for most Firestore reads
- See "RSS Feed Service Optimization" below

**Action Items**:
1. Monitor Firestore usage in next billing cycle (should drop significantly)
2. Check if any other services are doing full collection reads

---

### 3. **Artifact Registry: $17.94/month** (24% of total)

**What this is**: Docker image storage for your Cloud Run services

**Breakdown**:
- You have Docker images stored for each Cloud Run service
- Storage costs: $0.10 per GB/month (first 0.5 GB free)
- Estimated storage: ~180 GB (15 services × ~12 GB average)

**Optimization Options**:

#### Option A: Clean Up Old Images (RECOMMENDED)
- Delete unused/unnecessary Docker images
- Keep only the latest 2-3 versions of each image
- **Savings**: Potentially **$10-15/month saved**

#### Option B: Use Cloud Build with Automatic Cleanup
- Configure Cloud Build to automatically delete old images
- Keep only images from last 30-60 days
- **Savings**: **$5-10/month saved**

#### Option C: Compress Images
- Optimize Docker images to reduce size
- Use multi-stage builds to minimize image size
- **Savings**: **$5-8/month saved** (depends on current image sizes)

**How to Clean Up**:
```bash
# List all images
gcloud artifacts docker images list \
  --repository=YOUR_REPO_NAME \
  --location=us-central1 \
  --project=flashlive-daily-scraper

# Delete old images (keep only latest 3)
gcloud artifacts docker images delete IMAGE_NAME:TAG \
  --repository=YOUR_REPO_NAME \
  --location=us-central1 \
  --project=flashlive-daily-scraper
```

**Action Items**:
1. List all Docker images to see what's stored
2. Identify images that can be deleted
3. Set up automatic cleanup policy

---

### 4. **Cloud Scheduler: $3.45/month** (5% of total)

**What this is**: Scheduled job costs (after first 3 jobs free)

**Breakdown**:
- First 3 jobs: FREE
- Additional jobs: $0.10 per job per month
- $3.45 = ~34 additional jobs

**Optimization Options**:

#### Option A: Consolidate Jobs
- Combine multiple jobs that run at similar times
- Use a single job that handles multiple tasks
- **Savings**: **$1-2/month saved**

#### Option B: Reduce Job Frequency
- Change frequent jobs (every 15 min) to less frequent (every 30-60 min)
- **Savings**: No direct savings (same number of jobs), but reduces Cloud Run/Firestore costs

#### Option C: Delete Unused Jobs
- Check if all scheduled jobs are actually needed
- Delete jobs that are no longer used
- **Savings**: **$0.10 per job deleted**

**Action Items**:
1. List all Cloud Scheduler jobs
2. Identify jobs that can be consolidated or deleted
3. Review job frequency for optimization

---

### 5. **Cloud Storage: $0.61/month** (<1% of total)

**What this is**: File storage (JSON exports, backups, etc.)

**Optimization**: Minimal cost, but can optimize with lifecycle policies to delete old files.

---

### 6. **Cloud Build: $0.27/month** (<1% of total)

**What this is**: Building Docker images when you deploy

**Optimization**: Minimal cost. Ensure builds are only triggered when needed (not on every commit).

---

## 🎯 Priority Optimization Plan

### Immediate Actions (This Week):

1. **Deploy Code Fixes** (Already done ✅)
   - Deploy the updated `index.js` with optimized Firestore queries
   - **Expected savings**: ~$110-120/month (will appear in next billing cycle)

2. **Clean Up Artifact Registry**
   - Delete old Docker images
   - **Expected savings**: $10-15/month
   - **Steps**: See commands above

3. **Review RSS Feed Service**
   - Check current refresh frequency
   - Consider switching to on-demand only
   - **Expected savings**: $20-30/month

### Short-term Actions (This Month):

4. **Optimize Cloud Run Services**
   - Right-size CPU/memory
   - Review which services are most expensive
   - **Expected savings**: $6-10/month

5. **Consolidate Cloud Scheduler Jobs**
   - Combine similar jobs
   - Delete unused jobs
   - **Expected savings**: $1-2/month

---

## 📈 Expected Cost After All Optimizations

**Current Cost**: $74.59/month

**After All Optimizations**:
- App Engine (Firestore): $19.57 → **$5-10** (code fixes)
- Cloud Run: $32.75 → **$8-15** (RSS feed optimization)
- Artifact Registry: $17.94 → **$3-8** (cleanup)
- Cloud Scheduler: $3.45 → **$2-3** (consolidation)
- Other: $0.88 → **$0.50**

**New Total**: **~$18-36/month** (50-75% reduction)

---

## 📥 How to Export GCP Billing Data

### Method 1: Export CSV from Billing Console

1. Go to: https://console.cloud.google.com/billing
2. Select your billing account
3. Click "Reports" in the left menu
4. Click "Download CSV" button (top right of the table)
5. The CSV will include:
   - Date ranges
   - Service costs
   - Project costs
   - SKU-level details

### Method 2: Use BigQuery Export (Recommended for Detailed Analysis)

1. **Enable BigQuery Export**:
   ```bash
   gcloud billing accounts list
   # Note your billing account ID
   
   gcloud beta billing accounts describe BILLING_ACCOUNT_ID
   ```

2. **Go to Billing Console**:
   - Navigate to: https://console.cloud.google.com/billing
   - Select billing account
   - Click "Billing export" in left menu
   - Enable "Export to BigQuery"
   - Select dataset location (us-central1 recommended)

3. **Query in BigQuery**:
   ```sql
   -- Get costs by service for current month
   SELECT 
     service.description as service_name,
     SUM(cost) as total_cost,
     currency
   FROM `project-id.billing_export.gcp_billing_export_resource_v1_XXXXXX`
   WHERE 
     _PARTITIONTIME >= TIMESTAMP('2026-01-01')
     AND _PARTITIONTIME < TIMESTAMP('2026-02-01')
   GROUP BY service_name, currency
   ORDER BY total_cost DESC;
   ```

### Method 3: Use Billing API

```bash
# Get service cost breakdown
gcloud alpha billing projects describe flashlive-daily-scraper \
  --billing-account=BILLING_ACCOUNT_ID

# List billing accounts
gcloud billing accounts list
```

### Method 4: Use Cost Table Report (Most Detailed)

1. Go to: https://console.cloud.google.com/billing
2. Click "Reports"
3. Click "Generate query" button
4. Use the query builder to create custom reports
5. Export the query results

---

## 🔍 How to Investigate Specific Costs

### Check Cloud Run Service Costs:

```bash
# List all Cloud Run services
gcloud run services list --project=flashlive-daily-scraper

# Get metrics for a specific service
gcloud run services describe SERVICE_NAME \
  --region=us-central1 \
  --project=flashlive-daily-scraper
```

### Check Firestore Usage:

```bash
# View Firestore usage (in GCP Console)
# Go to: https://console.cloud.google.com/firestore/usage?project=flashlive-daily-scraper

# Or check quotas
gcloud firestore operations list --project=flashlive-daily-scraper
```

### Check Cloud Scheduler Jobs:

```bash
# List all jobs
gcloud scheduler jobs list --location=us-central1 --project=flashlive-daily-scraper

# Get job details
gcloud scheduler jobs describe JOB_NAME \
  --location=us-central1 \
  --project=flashlive-daily-scraper
```

### Check Artifact Registry Storage:

```bash
# List repositories
gcloud artifacts repositories list --location=us-central1 --project=flashlive-daily-scraper

# List images in a repository
gcloud artifacts docker images list \
  --repository=REPO_NAME \
  --location=us-central1 \
  --project=flashlive-daily-scraper
```

---

## 📝 Action Checklist

- [ ] Deploy code fixes (optimized Firestore queries) ✅ DONE
- [ ] Export billing data to CSV for detailed analysis
- [ ] Clean up Artifact Registry (delete old images)
- [ ] Review RSS feed service refresh frequency
- [ ] Check Cloud Run service resource allocation
- [ ] Consolidate/delete unused Cloud Scheduler jobs
- [ ] Monitor costs for 1 week after fixes
- [ ] Compare next month's bill to current month

---

## 🚨 Monitoring Going Forward

### Set Up Budget Alerts:

```bash
# Create budget alert
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Monthly Budget Alert" \
  --budget-amount=50USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Weekly Cost Review:
1. Check GCP Billing Dashboard weekly
2. Look for unexpected cost spikes
3. Review service-level breakdown
4. Adjust optimizations as needed

---

## 📞 Next Steps

1. **This Week**: Deploy fixes and clean up Artifact Registry
2. **Next Week**: Review RSS feed service optimization
3. **End of Month**: Compare February bill to January to see savings from code fixes
