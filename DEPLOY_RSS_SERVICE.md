# Step-by-Step: Deploy RSS Feed Service

## Step 1: Navigate to the RSS Feed Service Directory

```bash
cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service"
```

## Step 2: Make the Deploy Script Executable (if needed)

```bash
chmod +x deploy.sh
```

## Step 3: Deploy to Cloud Run

```bash
./deploy.sh
```

**OR** if the script doesn't work, run this command directly:

```bash
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

## Step 4: Get Your Service URL

After deployment completes, the script will display your service URL. It will look like:
```
https://rss-feed-service-123456789-uc.a.run.app
```

**OR** if you need to get it manually, run:

```bash
gcloud run services describe rss-feed-service --region us-central1 --format 'value(status.url)'
```

## Step 5: Update the Frontend with Your Service URL

1. Open `index (1).html` in your editor
2. Find line 16836 (search for `YOUR-RSS-SERVICE-URL`)
3. Replace `YOUR-RSS-SERVICE-URL` with your actual service URL (without `https://` and without the trailing path)

**Example:**
- If your service URL is: `https://rss-feed-service-123456789-uc.a.run.app`
- Change this line:
  ```javascript
  'NCAAW': 'https://YOUR-RSS-SERVICE-URL.run.app/bundle/ncaaw-videos.xml',
  ```
- To this:
  ```javascript
  'NCAAW': 'https://rss-feed-service-123456789-uc.a.run.app/bundle/ncaaw-videos.xml',
  ```

## Step 6: Test the Bundle

### Test 1: Health Check
```bash
curl https://YOUR-SERVICE-URL/health
```
Should return: `{"status":"ok"}`

### Test 2: List Available Feeds
```bash
curl https://YOUR-SERVICE-URL/feeds
```

### Test 3: Test the NCAAW Bundle
```bash
curl https://YOUR-SERVICE-URL/bundle/ncaaw-videos.xml | head -50
```

You should see RSS XML with video entries from all 4 YouTube playlists.

### Test 4: Test in Browser
Open in your browser:
```
https://YOUR-SERVICE-URL/bundle/ncaaw-videos.xml
```

You should see RSS XML formatted for viewing.

## Step 7: Test on Your Website

1. Open your `index (1).html` file locally or on your server
2. Navigate to the NCAAW section
3. Click on the "Social" or "Videos" tab
4. The feed should load with videos from all 4 playlists

## Troubleshooting

### If deployment fails:
- Make sure you're logged into gcloud: `gcloud auth login`
- Make sure you have the correct project set: `gcloud config set project YOUR-PROJECT-ID`
- Check that Cloud Run API is enabled: `gcloud services enable run.googleapis.com`

### If the bundle returns "No items found":
- Check that the YouTube playlist IDs are correct
- Test individual playlists: `https://YOUR-SERVICE-URL/youtube/playlist/PLn3nHXu50t5ycOprei1VvRrS6rgFyNamo.xml`

### If the frontend doesn't load:
- Check browser console for errors
- Verify the URL in `index (1).html` is correct (no typos)
- Make sure the service URL doesn't have a trailing slash

