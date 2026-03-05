# GCP Billing Breakdown Guide

## Your Active Services

### Cloud Run Services (15 services)
1. **channel-lookup** - Active
2. **fetchandstoreevents** - Active
3. **fetchtodaygames** - Active
4. **fetchtomorrowgames** - Active
5. **fetchupcominggames** - Active
6. **flashlive-archiver** - Active
7. **flashlive-poller** - Active
8. **flashlive-scraper** - Active (main service)
9. **flashlive-scraper-test** - Active
10. **parsefuturegames** - Active
11. **polllivegames** - Active
12. **rss-feed-service** - Active
13. **standings-fetcher** - Active
14. **flashlive-scraper-v2** - Inactive
15. **import-from-sheets** - Inactive

### Cloud Scheduler Jobs (12 jobs)
- **daily-refresh-all** - ENABLED (runs daily at 5 AM)
- 11 other jobs - PAUSED (not costing money)

### Firestore Database
- 1 Native database in us-central1

## How to View Your Billing in GCP Console

### Step 1: View Overall Costs
1. Go to: https://console.cloud.google.com/billing
2. Select your billing account: "My Billing Account" (01D3B4-343BA5-7B8388)
3. Click on "Reports" in the left menu
4. You'll see a breakdown by service

### Step 2: View Costs by Service
1. In Billing Reports, click "Group by: Service"
2. This shows:
   - Cloud Run costs
   - Cloud Scheduler costs
   - Firestore costs
   - Any other services

### Step 3: View Costs by Project
1. In Billing Reports, click "Group by: Project"
2. This shows costs for `flashlive-daily-scraper` project

### Step 4: View Detailed Cloud Run Costs
1. Go to: https://console.cloud.google.com/run?project=flashlive-daily-scraper
2. Click on any service
3. Go to "Metrics" tab to see:
   - Request count
   - CPU usage
   - Memory usage
   - Execution time

## Cost Estimation

### Cloud Run (Main Cost Driver)
**Free Tier:**
- 2 million requests/month
- 400,000 GB-seconds/month
- 200,000 vCPU-seconds/month

**Your Usage:**
- 15 active services
- Most services likely get minimal traffic
- Main services: `flashlive-scraper`, `rss-feed-service`

**Estimated Cost:** $0-5/month (likely FREE if low traffic)

### Cloud Scheduler
**Free Tier:**
- First 3 jobs: FREE
- Additional jobs: $0.10/job/month

**Your Usage:**
- 1 enabled job (`daily-refresh-all`)
- 11 paused jobs (FREE - not running)

**Estimated Cost:** $0.00 (FREE - within first 3 jobs)

### Firestore
**Free Tier:**
- 1 GB storage: FREE
- 50K reads/day: FREE
- 20K writes/day: FREE
- 20K deletes/day: FREE

**Your Usage:**
- Depends on data size and operations

**Estimated Cost:** $0-10/month (likely FREE if under limits)

## How to Check Current Month Costs

### Via Command Line:
```bash
# Check Cloud Run usage
gcloud run services list --project=flashlive-daily-scraper

# Check Cloud Scheduler
gcloud scheduler jobs list --location=us-central1 --project=flashlive-daily-scraper

# Check Firestore
gcloud firestore databases describe --database="(default)" --project=flashlive-daily-scraper
```

### Via Console:
1. Go to: https://console.cloud.google.com/billing/01D3B4-343BA5-7B8388/reports
2. Select current month
3. Group by "Service" to see breakdown

## Cost Optimization Tips

1. **Pause Unused Services**: You have 2 inactive Cloud Run services that can be deleted
2. **Monitor Active Services**: Check which services get actual traffic
3. **Set Budget Alerts**: 
   - Go to: https://console.cloud.google.com/billing/01D3B4-343BA5-7B8388/budgets
   - Create a budget alert (e.g., $10/month)

## Expected Monthly Cost

**Best Case (within free tiers):** $0.00/month
**Realistic Estimate:** $0-10/month
**Worst Case (heavy usage):** $10-50/month

Most likely you're in the **$0-5/month** range.

