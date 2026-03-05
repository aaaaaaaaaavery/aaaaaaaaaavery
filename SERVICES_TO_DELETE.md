# 12 Unused Cloud Run Services to Delete

## ✅ Services to KEEP (Currently in Use):

1. **flashlive-scraper** - Main service
   - Handles: `pollESPNLiveData`, `refreshAll`, `initialScrapeAndStartPolling`, `fetchUpcomingGames`, `morningRefresh`
   - This is your primary service - **DO NOT DELETE**

2. **standings-fetcher** - Standings service
   - Fetches NBA, NFL, MLB, WNBA standings daily
   - **KEEP** (if you're using standings)

3. **rss-feed-service** - RSS feed service
   - Currently paused/deleted
   - **KEEP** if you plan to re-enable it, otherwise can delete

---

## ❌ 12 Services to DELETE (Unused/Old):

### 1. **channel-lookup**
- **Why**: Channel lookup functionality is now built into `flashlive-scraper` (see `index.js` lines 4950-5096)
- **Replaced by**: Channel lookup code in `flashlive-scraper` that reads from Google Sheets directly
- **Delete command**:
```bash
gcloud run services delete channel-lookup --region=us-central1 --quiet
```

### 2. **fetchandstoreevents**
- **Why**: Old event fetcher, functionality moved to `flashlive-scraper`
- **Replaced by**: `pollESPNLiveData` endpoint in `flashlive-scraper`
- **Delete command**:
```bash
gcloud run services delete fetchandstoreevents --region=us-central1 --quiet
```

### 3. **fetchtodaygames**
- **Why**: Old game fetcher for today's games
- **Replaced by**: `pollESPNLiveData` endpoint in `flashlive-scraper` (handles today's games)
- **Delete command**:
```bash
gcloud run services delete fetchtodaygames --region=us-central1 --quiet
```

### 4. **fetchtomorrowgames**
- **Why**: Old game fetcher for tomorrow's games
- **Replaced by**: `pollESPNLiveData` endpoint in `flashlive-scraper` (handles multiple dates)
- **Delete command**:
```bash
gcloud run services delete fetchtomorrowgames --region=us-central1 --quiet
```

### 5. **fetchupcominggames**
- **Why**: Old upcoming games fetcher
- **Replaced by**: `fetchUpcomingGames` endpoint in `flashlive-scraper` (line 5503-5504)
- **Delete command**:
```bash
gcloud run services delete fetchupcominggames --region=us-central1 --quiet
```

### 6. **flashlive-archiver**
- **Why**: Old archiver service, no longer needed
- **Replaced by**: Archive functionality built into `flashlive-scraper` (moving games to `yesterdayScores`)
- **Delete command**:
```bash
gcloud run services delete flashlive-archiver --region=us-central1 --quiet
```

### 7. **flashlive-poller**
- **Why**: Old poller service
- **Replaced by**: `pollESPNLiveData` endpoint in `flashlive-scraper`
- **Delete command**:
```bash
gcloud run services delete flashlive-poller --region=us-central1 --quiet
```

### 8. **flashlive-scraper-test**
- **Why**: Test service, not needed in production
- **Delete command**:
```bash
gcloud run services delete flashlive-scraper-test --region=us-central1 --quiet
```

### 9. **flashlive-scraper-v2**
- **Why**: Old v2 service, marked as "Inactive" in billing breakdown
- **Replaced by**: Current `flashlive-scraper` service
- **Delete command**:
```bash
gcloud run services delete flashlive-scraper-v2 --region=us-central1 --quiet
```

### 10. **import-from-sheets**
- **Why**: Old import service, marked as "Inactive" in billing breakdown
- **Replaced by**: `initialScrapeAndStartPolling` handler in `flashlive-scraper` (line 1530) which imports from Google Sheets
- **Delete command**:
```bash
gcloud run services delete import-from-sheets --region=us-central1 --quiet
```

### 11. **parsefuturegames**
- **Why**: Old parser service for future games
- **Replaced by**: `fetchUpcomingGames` endpoint in `flashlive-scraper`
- **Delete command**:
```bash
gcloud run services delete parsefuturegames --region=us-central1 --quiet
```

### 12. **polllivegames**
- **Why**: Old poller service for live games
- **Replaced by**: `pollESPNLiveData` endpoint in `flashlive-scraper`
- **Delete command**:
```bash
gcloud run services delete polllivegames --region=us-central1 --quiet
```

---

## 🚀 Delete All 12 Services at Once

**One-liner to delete all unused services:**
```bash
gcloud run services delete channel-lookup fetchandstoreevents fetchtodaygames fetchtomorrowgames fetchupcominggames flashlive-archiver flashlive-poller flashlive-scraper-test flashlive-scraper-v2 import-from-sheets parsefuturegames polllivegames --region=us-central1 --quiet
```

**Or delete them one by one** (safer, allows you to verify each deletion):
```bash
# Delete unused Cloud Run services
gcloud run services delete channel-lookup --region=us-central1 --quiet
gcloud run services delete fetchandstoreevents --region=us-central1 --quiet
gcloud run services delete fetchtodaygames --region=us-central1 --quiet
gcloud run services delete fetchtomorrowgames --region=us-central1 --quiet
gcloud run services delete fetchupcominggames --region=us-central1 --quiet
gcloud run services delete flashlive-archiver --region=us-central1 --quiet
gcloud run services delete flashlive-poller --region=us-central1 --quiet
gcloud run services delete flashlive-scraper-test --region=us-central1 --quiet
gcloud run services delete flashlive-scraper-v2 --region=us-central1 --quiet
gcloud run services delete import-from-sheets --region=us-central1 --quiet
gcloud run services delete parsefuturegames --region=us-central1 --quiet
gcloud run services delete polllivegames --region=us-central1 --quiet
```

---

## 💰 Expected Cost Savings

### Artifact Registry Savings:
- **Current**: ~180 GB stored (15 services × ~12 GB average)
- **After deletion**: ~36 GB stored (3 services × ~12 GB average)
- **Storage reduction**: ~144 GB
- **Cost savings**: ~144 GB × $0.10/GB/month = **~$14/month**

### Cloud Run Savings:
- These services scale to zero, so minimal Cloud Run cost savings
- **Estimated**: $0-2/month (only if they were receiving occasional requests)

### Total Savings: **~$14-16/month**

---

## ✅ Verification Steps

### Before Deleting:
1. **Verify services are not being called**:
   ```bash
   # Check Cloud Run service logs for recent activity
   gcloud run services logs read SERVICE_NAME --region=us-central1 --limit=50
   ```

2. **Check Cloud Scheduler jobs**:
   ```bash
   # Make sure no scheduler jobs point to these services
   gcloud scheduler jobs list --location=us-central1
   ```

### After Deleting:
1. **Verify deletion**:
   ```bash
   # List remaining services
   gcloud run services list --region=us-central1
   ```

2. **Check Artifact Registry storage**:
   ```bash
   # Should see reduced storage
   gcloud artifacts docker images list \
     --repository=YOUR_REPO \
     --location=us-central1 \
     --format="value(image_size_bytes)" | \
     awk '{sum+=$1} END {print "Total: " sum/1024/1024/1024 " GB"}'
   ```

---

## 📋 Summary

**12 Services to Delete:**
1. channel-lookup
2. fetchandstoreevents
3. fetchtodaygames
4. fetchtomorrowgames
5. fetchupcominggames
6. flashlive-archiver
7. flashlive-poller
8. flashlive-scraper-test
9. flashlive-scraper-v2
10. import-from-sheets
11. parsefuturegames
12. polllivegames

**All functionality replaced by `flashlive-scraper` main service**

**Expected Savings: ~$14-16/month** (mostly from Artifact Registry storage reduction)
