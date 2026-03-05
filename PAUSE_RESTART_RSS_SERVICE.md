# Pausing and Restarting RSS Feed Service

## Short Answer

**Yes, you can pause and restart anytime!** When you "pause" (delete) the service, you can redeploy it later. Your code stays on your computer, so restarting is just redeploying.

---

## What Happens When You Pause (Delete)

### What Gets Deleted:
- ✅ Cloud Run service is deleted
- ✅ Service URL stops working
- ✅ All costs stop immediately
- ✅ In-memory cache is lost (since it's in RAM)
- ✅ Service stops responding to requests

### What Stays:
- ✅ Your code stays on your computer (`rss-feed-service/` folder)
- ✅ All your configuration files
- ✅ Deployment scripts (`deploy.sh`, `pause-cloud-service.sh`)
- ✅ Everything needed to redeploy

---

## What Happens When You Restart (Redeploy)

### What Gets Restored:
- ✅ Cloud Run service is recreated
- ✅ Service gets a new URL (might be same, might be slightly different)
- ✅ Service starts responding to requests
- ✅ In-memory cache starts empty (rebuilds as users visit)

### What's Different:
- ❌ In-memory cache is empty (rebuilds on first requests)
- ❌ First requests after restart are slower (cache miss, need to fetch)
- ❌ Service URL might be slightly different (usually same base, but check)
- ❌ No background jobs (since you're using on-demand fetching)

---

## How to Pause (Delete)

### Option 1: Use the Script
```bash
cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service"
chmod +x pause-cloud-service.sh
./pause-cloud-service.sh
```

### Option 2: Use gcloud Command
```bash
gcloud run services delete rss-feed-service \
  --region=us-central1 \
  --project=flashlive-daily-scraper \
  --quiet
```

**Result**: Service is deleted, costs stop immediately.

---

## How to Restart (Redeploy)

### Option 1: Use the Deploy Script
```bash
cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service"
chmod +x deploy.sh
./deploy.sh
```

**OR** if you have a YouTube API key:
```bash
./deploy.sh YOUR_YOUTUBE_API_KEY
```

### Option 2: Use gcloud Command Directly
```bash
cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service"

gcloud run deploy rss-feed-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 10 \
  --min-instances 0
```

**Result**: Service is redeployed, starts responding to requests.

---

## After Restart: What to Check

### 1. Get the New Service URL
After redeploying, get your service URL:
```bash
gcloud run services describe rss-feed-service \
  --region=us-central1 \
  --project=flashlive-daily-scraper \
  --format 'value(status.url)'
```

### 2. Test the Service
```bash
# Test health endpoint
curl https://YOUR-SERVICE-URL/health

# Test a feed
curl https://YOUR-SERVICE-URL/feeds/newsnow-nfl.xml
```

### 3. Update Website (If URL Changed)
If the URL changed, update your website (`index (1).html`) to use the new URL.

**Note**: Usually the URL stays the same, but check to be sure.

---

## Important Notes

### 1. Cache Starts Empty
- **In-memory cache is lost** when you delete the service
- First requests after restart need to fetch from source (slower)
- Cache rebuilds automatically as users visit
- After 15-30 minutes, cache is populated and requests are fast

### 2. No Data Loss (For RSS Feeds)
- **RSS feeds are fetched on-demand** (not stored permanently)
- No permanent data is lost (feeds are fetched fresh anyway)
- Cache is temporary (15-30 minutes) and rebuilds automatically

### 3. Service URL Usually Stays Same
- Cloud Run usually reuses the same URL
- But check the URL after redeploying to be sure
- If it changes, update your website

### 4. Costs Resume
- When you redeploy, costs resume immediately
- But since you're using in-memory cache, costs are very low (~$0.04/month at 1,000 users/day)

---

## Timeline Example

### Day 1: Pause Service
```
12:00 PM - Run pause script
12:00 PM - Service deleted, costs stop
12:01 PM - Service URL stops working
12:01 PM - Your website's RSS feeds stop working (404 errors)
```

### Day 2: Restart Service
```
2:00 PM - Run deploy script
2:05 PM - Service redeployed, costs resume
2:05 PM - Service URL works again (usually same URL)
2:06 PM - First user visits → cache miss (slower, ~1-2 seconds)
2:07 PM - Cache populated, subsequent requests fast (<10ms)
2:15 PM - Cache fully populated, all requests fast
```

---

## Cost Impact

### While Paused:
- **Cost**: $0/month
- **Service**: Not running
- **Website RSS feeds**: Broken (404 errors)

### After Restart:
- **Cost**: ~$0.04/month (with in-memory cache, 1,000 users/day)
- **Service**: Running normally
- **Website RSS feeds**: Working (cache rebuilds automatically)

---

## Pro Tips

### 1. Test Before Pausing
Before pausing, make sure you know how to redeploy:
```bash
# Test deployment (don't actually pause yet)
cd rss-feed-service
gcloud run services describe rss-feed-service \
  --region=us-central1 \
  --format 'value(status.url)'
```

### 2. Save Service URL
Before pausing, save your service URL so you can compare after restart:
```bash
gcloud run services describe rss-feed-service \
  --region=us-central1 \
  --format 'value(status.url)' > service-url.txt
```

### 3. Check Website After Restart
After restarting, check your website to make sure RSS feeds work:
- Visit your site
- Click on RSS feeds
- Should load (might be slower on first request while cache rebuilds)

---

## Troubleshooting

### Service URL Changed?
If the service URL changed after restart:
1. Get the new URL (see "After Restart" section above)
2. Update your website to use the new URL
3. Or check if the old URL still works (sometimes Cloud Run keeps it for a while)

### Feeds Not Working After Restart?
1. Check service health: `curl https://YOUR-URL/health`
2. Check service logs: `gcloud run services logs read rss-feed-service --region=us-central1`
3. First requests are slower (cache rebuilding), wait 15-30 minutes

### Deploy Fails?
1. Make sure you're in the right directory: `cd rss-feed-service`
2. Make sure gcloud is authenticated: `gcloud auth login`
3. Check your project: `gcloud config get-value project`
4. Make sure you have permissions to deploy to Cloud Run

---

## Summary

### Can You Pause and Restart Anytime?
**Yes!** ✅

### What Happens When You Pause?
- Service is deleted
- Costs stop
- Cache is lost
- Code stays on your computer

### What Happens When You Restart?
- Service is redeployed
- Costs resume (but very low with in-memory cache)
- Cache starts empty (rebuilds automatically)
- Service URL usually stays the same (but check to be sure)

### Bottom Line:
**It's completely reversible!** You can pause to save money, then restart anytime when you need it again. Your code stays on your computer, so restarting is just redeploying.

---

## Quick Reference

```bash
# Pause (Delete)
cd rss-feed-service
./pause-cloud-service.sh

# Restart (Redeploy)
cd rss-feed-service
./deploy.sh

# Check Service URL
gcloud run services describe rss-feed-service \
  --region=us-central1 \
  --format 'value(status.url)'

# Test Service
curl https://YOUR-URL/health
```
