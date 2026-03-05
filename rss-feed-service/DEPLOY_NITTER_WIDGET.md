# Deploy RSS Feed Service with Nitter Widget

## Quick Deploy

From the `rss-feed-service` directory:

```bash
cd rss-feed-service
./deploy.sh YOUR_YOUTUBE_API_KEY
```

**Or without YouTube API key:**
```bash
cd rss-feed-service
./deploy.sh
```

## What's Being Deployed

✅ Nitter RSS feed: `/feeds/nitter-buffalosabres.xml`  
✅ Nitter widget: `/widget/nitter`  
✅ All existing RSS feeds

## After Deployment

Once deployed, your service URL will be something like:
```
https://rss-feed-service-xxxxx-uc.a.run.app
```

### Test the Widget

1. **Widget URL:**
   ```
   https://your-service-url.run.app/widget/nitter?username=BuffaloSabres
   ```

2. **RSS Feed URL:**
   ```
   https://your-service-url.run.app/feeds/nitter-buffalosabres.xml
   ```

3. **Embed in your site:**
   ```html
   <iframe 
     src="https://your-service-url.run.app/widget/nitter?username=BuffaloSabres" 
     width="100%" 
     height="600" 
     frameborder="0">
   </iframe>
   ```

## Manual Deployment (Alternative)

If the deploy script doesn't work:

```bash
cd rss-feed-service

# Deploy with YouTube API key
gcloud run deploy rss-feed-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars YOUTUBE_API_KEY=YOUR_KEY_HERE

# Or without YouTube API key
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

## Verify Deployment

After deployment completes:

```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe rss-feed-service --region us-central1 --format 'value(status.url)')

# Test health
curl $SERVICE_URL/health

# Test widget
curl $SERVICE_URL/widget/nitter?username=BuffaloSabres

# Test RSS feed
curl $SERVICE_URL/feeds/nitter-buffalosabres.xml
```

## Troubleshooting

**If deployment fails:**
1. Make sure you're authenticated: `gcloud auth login`
2. Check your project: `gcloud config get-value project`
3. Verify Dockerfile exists: `ls -la Dockerfile`
4. Check nitter-widget.html exists: `ls -la nitter-widget.html`

**If widget doesn't load:**
1. Check service logs: `gcloud run services logs read rss-feed-service --region us-central1`
2. Verify widget endpoint: `curl $SERVICE_URL/widget/nitter`
3. Check feed endpoint: `curl $SERVICE_URL/feeds/nitter-buffalosabres.xml`

