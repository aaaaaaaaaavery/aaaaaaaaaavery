# Your Highest GCP Costs - Specific Breakdown

Based on your January 2026 billing: **$74.59/month total**

---

## 🥇 #1 HIGHEST COST: Cloud Run - $32.75/month (44% of total)

### What This Is:
Compute costs for your Cloud Run services (CPU + Memory when processing requests)

### Breakdown:
- **Usage Cost**: $58.56
- **Savings Applied**: -$25.80 (free tier credits)
- **Net Cost**: **$32.75/month**

### What's Driving This Cost:

**Active Services (15 total):**
1. **flashlive-scraper** (main service) - Likely **$15-25/month**
   - Handles: `pollESPNLiveData`, `refreshAll`, `initialScrapeAndStartPolling`
   - Runs: Daily at 5 AM (daily-refresh-all) + on-demand requests
   - Processes: ESPN API games, NCAA API games, Google Sheets imports
   - **Estimated**: $15-25/month (biggest contributor)

2. **standings-fetcher** - Likely **$1-3/month**
   - Runs: Daily at 6 AM (or on-demand)
   - Processes: NBA, NFL, MLB, WNBA standings
   - **Estimated**: $1-3/month

3. **Other 13 services** - Likely **$5-10/month combined**
   - channel-lookup, fetchandstoreevents, fetchtodaygames, etc.
   - Most scale to zero (only charge when used)
   - Many may be unused/legacy services

### Why It Costs This Much:
- **CPU usage**: $0.00002400 per vCPU-second
- **Memory usage**: $0.00000250 per GiB-second
- **flashlive-scraper** processes thousands of games daily
- Daily refresh job runs for several minutes processing all leagues

### Optimization Potential:
- **Delete unused services**: Save $5-10/month
- **Right-size resources**: If services use less CPU/memory, save $6-10/month
- **Total potential savings**: $11-20/month

---

## 🥈 #2 HIGHEST COST: Firestore (App Engine) - $19.57/month (26% of total)

### What This Is:
Database operations (reads, writes, deletes, storage) - GCP bills this under "App Engine"

### Breakdown:
- **Reads**: ~$18/month (estimated ~30-35 million reads/month)
- **Writes**: ~$1-2/month (estimated ~5-10 million writes/month)
- **Storage**: ~$0.18-0.36/month (~1-2 GB stored)
- **Total**: **$19.57/month**

### What's Driving This Cost:

**Main Sources:**

1. **flashlive-scraper operations** - Likely **$10-15/month**
   - Reading games from `sportsGames` collection
   - Writing/updating games (ESPN API, NCAA API, Google Sheets)
   - Moving games to `yesterdayScores` collection
   - **Before optimizations**: Would read ALL games every run
   - **After optimizations**: Only reads yesterday/today/tomorrow games
   - **Expected reduction**: Should drop to $5-10/month next billing cycle

2. **Standings operations** - Likely **$1-2/month**
   - standings-fetcher writes standings data
   - Frontend reads standings
   - Minimal cost

3. **Other Firestore operations** - Likely **$2-5/month**
   - Various collections (Featured, Top25, etc.)
   - Frontend reads for JSON endpoints

### Firestore Pricing:
- **Reads**: $0.06 per 100,000 document reads
- **Writes**: $0.18 per 100,000 document writes
- **Storage**: $0.18 per GB/month (first 1 GB free)

### Current Usage Estimate:
- **~30-35 million reads/month** = ~$18/month
- **~5-10 million writes/month** = ~$1-2/month
- **~1-2 GB storage** = ~$0.18-0.36/month

### Optimization Potential:
- **Code optimizations already deployed**: Should reduce reads by 50-80%
- **Expected new cost**: $5-10/month (savings: ~$9-14/month)
- **Will show up in**: Next billing cycle (February 2026)

---

## 🥉 #3 HIGHEST COST: Artifact Registry - $17.94/month (24% of total)

### What This Is:
Docker image storage for your Cloud Run services

### Breakdown:
- **Storage**: ~180 GB of Docker images
- **Cost**: $0.10 per GB/month
- **Total**: **$17.94/month**

### What's Driving This Cost:

**15 Cloud Run services** × **~12 GB average per service** = **~180 GB total**

Each service has multiple Docker image versions stored:
- Latest version
- Previous versions (for rollback)
- Old/unused versions (not cleaned up)

### Why It Costs This Much:
- Docker images are large (typically 500 MB - 2 GB each)
- Multiple versions stored per service
- Old images not deleted
- **This is pure storage cost** - doesn't matter if services are active or not

### Optimization Potential:
- **Delete old images**: Keep only latest 2-3 versions per service
- **Potential savings**: $10-15/month
- **New cost**: $3-8/month

### How to Check:
```bash
# List all Docker images
gcloud artifacts docker images list \
  --repository=YOUR_REPO_NAME \
  --location=us-central1 \
  --project=flashlive-daily-scraper
```

---

## 📊 #4: Cloud Scheduler - $3.45/month (5% of total)

### What This Is:
Scheduled job costs (after first 3 jobs free)

### Breakdown:
- **First 3 jobs**: FREE
- **Additional jobs**: $0.10 per job per month
- **$3.45 = ~34 additional jobs** (but most are paused)

### What's Driving This Cost:

**Current Status:**
- **1 job enabled**: `daily-refresh-all` (runs daily at 5 AM)
- **11+ jobs paused**: Not costing money (paused jobs are free)

**Why $3.45?**
- You have many scheduled jobs created
- Even if paused, some may still incur costs (need to verify)
- Or there are more enabled jobs than documented

### Optimization Potential:
- **Delete unused paused jobs**: Save $0.10 per job
- **Consolidate jobs**: Combine similar jobs into one
- **Potential savings**: $1-3/month

---

## 📊 Cost Summary (Ranked)

| Rank | Service | Monthly Cost | % of Total | Optimization Potential |
|------|---------|--------------|------------|------------------------|
| **1** | **Cloud Run** | **$32.75** | **44%** | Delete unused services: $11-20/month |
| **2** | **Firestore** | **$19.57** | **26%** | Code optimizations: $9-14/month (already done) |
| **3** | **Artifact Registry** | **$17.94** | **24%** | Clean up images: $10-15/month |
| **4** | **Cloud Scheduler** | **$3.45** | **5%** | Delete unused jobs: $1-3/month |
| **5** | **Cloud Storage** | **$0.61** | **<1%** | Minimal |
| **6** | **Cloud Build** | **$0.27** | **<1%** | Minimal |
| **TOTAL** | | **$74.59** | **100%** | **Total potential savings: $31-52/month** |

---

## 🎯 Top 3 Cost Drivers (Specific)

### 1. Cloud Run: $32.75/month
- **flashlive-scraper**: $15-25/month (main service, daily refresh + polling)
- **Other services**: $5-10/month (13 other services, mostly unused)
- **standings-fetcher**: $1-3/month (daily standings updates)

### 2. Firestore: $19.57/month
- **Game reads/writes**: $10-15/month (flashlive-scraper operations)
- **Other operations**: $2-5/month (standings, featured games, etc.)
- **Storage**: $0.18-0.36/month (1-2 GB stored)

### 3. Artifact Registry: $17.94/month
- **Docker image storage**: $17.94/month (~180 GB)
- **No operations cost** - pure storage
- **Doesn't matter if services are active** - you pay for storage regardless

---

## 💡 Quick Wins to Reduce Costs

### Immediate (This Week):
1. **Clean up Artifact Registry** → Save $10-15/month
   - Delete old Docker images
   - Keep only latest 2-3 versions per service

2. **Delete unused Cloud Run services** → Save $5-10/month
   - Remove services that aren't being used
   - Reduces Artifact Registry storage too

### Next Billing Cycle:
3. **Code optimizations already deployed** → Save $9-14/month
   - Date-filtered Firestore queries
   - Will show up in February billing

### Total Potential Savings: $24-39/month
**New total after optimizations: $35-50/month**
