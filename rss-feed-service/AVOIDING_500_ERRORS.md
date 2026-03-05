# How to Avoid 500 Errors in RSS Feed Service

## ✅ Current Protection Settings (Already Configured)

### 1. **Refresh Interval: 60 Minutes**
- **Location**: `SETUP_LOCAL_SCHEDULER.md` and `refresh-bundle.js`
- **Current**: Feeds refresh every 60 minutes (1 hour)
- **DO NOT**: Reduce below 30 minutes
- **If errors persist**: Increase to 90 minutes or 2 hours

### 2. **NewsNow Concurrency Limits**
- **Location**: `rss-feed-service/index.js`
- **Current Settings**:
  - `MAX_CONCURRENT_NEWSNOW = 1` (only 1 NewsNow scrape at a time)
  - `DELAY_BETWEEN_NEWSNOW_SCRAPES = 5000ms` (5 seconds between scrapes)
- **DO NOT**: Increase these values
- **If errors persist**: Increase delay to 10 seconds (10000ms)

### 3. **Cache Duration: 15 Minutes**
- **Location**: `bundle-rss.js` and `index.js`
- **Current**: Responses cached for 15 minutes
- **Benefit**: Prevents repeated scraping for same requests
- **DO NOT**: Reduce cache time

### 4. **Article Limits**
- **Location**: `scraper.js`
- **Current**: Most scrapers limit to 20-50 articles
- **NewsNow**: Limited to 20 articles by default (timeout-prone)
- **DO NOT**: Increase these limits significantly

## 📋 Best Practices Checklist

### ✅ DO's

1. **Keep Refresh Interval at 60+ Minutes**
   - Your cron job should run: `0 * * * *` (every hour)
   - Never run refreshes more frequently than every 30 minutes
   - If you see errors, increase to 90 minutes or 2 hours

2. **Don't Manually Trigger Refreshes Too Often**
   - Avoid running `refresh-bundle.js` manually multiple times per hour
   - If you need to test, wait at least 15 minutes between manual runs

3. **Monitor the Logs**
   - Check `refresh.log` regularly for errors
   - Look for patterns (specific feeds failing, time-based issues)
   - If you see repeated failures, investigate that specific feed

4. **Use Cache When Testing**
   - When testing feeds in browser, add `?nocache=timestamp` only when needed
   - Don't repeatedly hit the same feed URL without cache

5. **Let the Service Warm Up**
   - After deployment, wait 15-30 minutes before heavy testing
   - Initial requests will populate the cache

6. **Batch Feed Requests**
   - The refresh script batches requests, which is good
   - Don't create scripts that hit all feeds simultaneously

### ❌ DON'Ts

1. **Don't Reduce Refresh Interval Below 30 Minutes**
   - This will cause too many requests and likely 500 errors
   - Current 60 minutes is optimal

2. **Don't Increase NewsNow Concurrency**
   - Keep `MAX_CONCURRENT_NEWSNOW = 1`
   - Don't reduce `DELAY_BETWEEN_NEWSNOW_SCRAPES` below 5 seconds

3. **Don't Remove Cache**
   - Cache is essential for preventing overload
   - Don't disable or reduce cache duration

4. **Don't Increase Article Limits Too Much**
   - More articles = longer processing = higher chance of timeout
   - Current limits (20-50) are appropriate

5. **Don't Scrape During Peak Hours**
   - If possible, schedule refreshes during off-peak hours
   - Some sites may be slower during peak times

6. **Don't Add Too Many Feeds at Once**
   - If adding new feeds, add them gradually
   - Test each new feed before adding more

## 🔧 If You Still Get 500 Errors

### Step 1: Check Which Feeds Are Failing
```bash
# Check the refresh log
tail -f rss-feed-service/refresh.log

# Look for patterns - are specific feeds always failing?
```

### Step 2: Increase Refresh Interval
```bash
# Edit crontab
crontab -e

# Change from every hour to every 90 minutes
# 0 * * * * → 0 */90 * * * (not valid, use this instead:)
# Run at :00 and :30 past every 1.5 hours - better to use:
0 */2 * * *  # Every 2 hours
```

### Step 3: Increase NewsNow Delay
Edit `rss-feed-service/index.js`:
```javascript
const DELAY_BETWEEN_NEWSNOW_SCRAPES = 10000; // Increase to 10 seconds
```

### Step 4: Reduce NewsNow Article Limit
Edit `rss-feed-service/scraper.js`:
```javascript
// In scrapeNewsNow function, reduce default
export async function scrapeNewsNow(url, maxArticles = 15) { // Reduce from 20
```

### Step 5: Check Cloud Run Logs
```bash
# View Cloud Run logs for errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rss-feed-service" --limit 50 --format json
```

## 📊 Monitoring Recommendations

1. **Set Up Alerts** (if possible)
   - Monitor Cloud Run error rate
   - Alert if error rate exceeds 5%

2. **Regular Log Review**
   - Check `refresh.log` weekly
   - Look for trends or recurring issues

3. **Feed Health Dashboard** (optional)
   - Track which feeds succeed/fail
   - Identify problematic feeds early

## 🎯 Optimal Configuration Summary

**Current Optimal Settings:**
- ✅ Refresh interval: 60 minutes
- ✅ NewsNow concurrency: 1 at a time
- ✅ NewsNow delay: 5 seconds
- ✅ Cache: 15 minutes
- ✅ Article limits: 20-50 per feed
- ✅ Error handling: Promise.allSettled (won't break on single failures)

**If errors occur, adjust in this order:**
1. Increase refresh interval to 90-120 minutes
2. Increase NewsNow delay to 10 seconds
3. Reduce NewsNow article limit to 15
4. Investigate specific failing feeds

## 📝 Quick Reference

**Current Cron Job:**
```cron
0 * * * * cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service && /usr/local/bin/node refresh-bundle.js >> /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service/refresh.log 2>&1
```

**Service URL:**
```
https://rss-feed-service-124291936014.us-central1.run.app
```

**Key Files:**
- `rss-feed-service/index.js` - Main service, NewsNow limits
- `rss-feed-service/scraper.js` - Scraping logic, article limits
- `rss-feed-service/bundle-rss.js` - Bundle generation, cache
- `rss-feed-service/refresh-bundle.js` - Refresh script
- `rss-feed-service/SETUP_LOCAL_SCHEDULER.md` - Cron setup

