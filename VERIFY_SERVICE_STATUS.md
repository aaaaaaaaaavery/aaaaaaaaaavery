# How to Verify if Services Are Still Active

## ✅ Quick Check Commands

### 1. Check Cloud Run Services (Active Services)
```bash
gcloud run services list --region=us-central1
```
**Current Status:** Only 3 active services remain:
- `flashlive-scraper` ✅
- `rss-feed-service` ✅  
- `standings-fetcher` ✅

### 2. Check Cloud Functions (Orphaned Functions)
```bash
gcloud functions list
```
**Current Status:** Found 11 orphaned Cloud Functions:
- `channel-lookup` ❌ (ERROR - Cloud Run service missing)
- `fetchAndStoreEvents` ❌ (ERROR - Cloud Run service missing)
- `fetchTodayGames` ❌ (ERROR - Cloud Run service missing)
- `fetchTomorrowGames` ❌ (ERROR - Cloud Run service missing)
- `fetchUpcomingGames` ❌ (ERROR - Cloud Run service missing)
- `flashlive-scraper-v2` ❌ (ERROR - Cloud Run service missing)
- `import-from-sheets` ❌ (ERROR - Cloud Run service missing)
- `parseFutureGames` ❌ (ERROR - Cloud Run service missing)
- `pollLiveGames` ❌ (ERROR - Cloud Run service missing)

**These are NOT active** - they show ERROR status and cannot execute.

### 3. Check Billing/Usage
```bash
# View recent Cloud Run usage
gcloud billing accounts list
gcloud billing projects describe flashlive-daily-scraper
```

Or check in GCP Console:
- Go to: https://console.cloud.google.com/billing
- Select your billing account
- View "Reports" → Filter by "Cloud Run" or "Cloud Functions"

---

## 🔍 How to Tell if a Service is Active

### Method 1: Check Service Status
```bash
# For Cloud Run (replace SERVICE_NAME with actual name)
gcloud run services describe flashlive-scraper --region=us-central1
gcloud run services describe rss-feed-service --region=us-central1
gcloud run services describe standings-fetcher --region=us-central1

# For Cloud Functions (replace FUNCTION_NAME with actual name)
gcloud functions describe fetchYesterdayScores --gen2 --region=us-central1
```

**Active indicators:**
- ✅ Status: `ACTIVE` or `READY`
- ✅ Has a valid URL
- ✅ No ERROR conditions

**Inactive indicators:**
- ❌ Status: `ERROR` or missing
- ❌ ERROR message: "Cloud Run service ... was not found"
- ❌ No URL or invalid URL

### Method 2: Check Recent Logs
```bash
# Cloud Run logs (replace SERVICE_NAME with actual name)
gcloud run services logs read flashlive-scraper --region=us-central1 --limit=10
gcloud run services logs read rss-feed-service --region=us-central1 --limit=10
gcloud run services logs read standings-fetcher --region=us-central1 --limit=10

# Cloud Functions logs (replace FUNCTION_NAME with actual name)
gcloud functions logs read fetchYesterdayScores --gen2 --region=us-central1 --limit=10
```

**Active:** Recent log entries (last 24 hours)
**Inactive:** No logs or very old logs (weeks/months ago)

### Method 3: Check Billing Data
1. Go to: https://console.cloud.google.com/billing
2. Select your billing account
3. Click "Reports"
4. Filter by service name
5. Check if there's recent cost/usage

**Active:** Shows recent costs/usage
**Inactive:** $0 cost or no usage data

### Method 4: Check Cloud Scheduler Jobs
```bash
gcloud scheduler jobs list --location=us-central1
```

If a scheduler job points to a service, check if the job is:
- **ENABLED** → Service might be active
- **PAUSED** → Service is inactive
- **Missing** → Service is not scheduled

---

## 🧹 Clean Up Orphaned Cloud Functions

The 11 Cloud Functions are orphaned (their Cloud Run services don't exist). They're not costing money but should be deleted for cleanliness.

### Delete All Orphaned Functions:
```bash
for func in channel-lookup fetchAndStoreEvents fetchTodayGames fetchTomorrowGames fetchUpcomingGames flashlive-scraper-v2 import-from-sheets parseFutureGames pollLiveGames; do
  echo "Deleting $func..."
  gcloud functions delete $func --gen2 --region=us-central1 --quiet
done
```

**Note:** Only delete if you're sure they're not needed. These functions are already broken and cannot execute.

---

## 📊 Current State Summary

### ✅ Active Services (3):
1. `flashlive-scraper` - Main service
2. `rss-feed-service` - RSS feeds  
3. `standings-fetcher` - Standings

### ❌ Inactive/Orphaned (11 Cloud Functions):
- All show ERROR status
- Cannot execute (Cloud Run services missing)
- Not costing money
- Should be deleted for cleanup

---

## 💡 Pro Tip: Monitor Service Activity

Create a monitoring script:
```bash
#!/bin/bash
echo "=== Active Cloud Run Services ==="
gcloud run services list --region=us-central1 --format="table(metadata.name,status.url,status.conditions[0].status)"

echo ""
echo "=== Cloud Functions Status ==="
gcloud functions list --format="table(name,status,updateTime)"

echo ""
echo "=== Recent Activity (last 24h) ==="
# Check logs for each service
for service in flashlive-scraper rss-feed-service standings-fetcher; do
  echo "Service: $service"
  gcloud run services logs read $service --region=us-central1 --limit=5 --format="value(timestamp)" | head -1
done
```

Save as `check-services.sh` and run periodically to monitor activity.
