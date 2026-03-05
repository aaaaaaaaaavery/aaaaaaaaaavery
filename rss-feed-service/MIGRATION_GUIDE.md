# Migration Guide: RSS.app to Custom RSS Service

This guide will help you migrate from RSS.app to your custom RSS feed service.

## Step 1: Deploy the Service

```bash
cd rss-feed-service
chmod +x deploy.sh
./deploy.sh
```

After deployment, note your service URL (e.g., `https://rss-feed-service-xxxxx.run.app`)

## Step 2: Update Frontend URLs

### For News Headlines (XML Feeds)

In `index (1).html`, replace RSS.app URLs:

**Before:**
```html
<div class="headlines-tab active" data-url="https://rss.app/feeds/Kcftj40UrmoGhLBA.xml">MLB.com</div>
```

**After:**
```html
<div class="headlines-tab active" data-url="https://your-service-url.run.app/feeds/mlb-com.xml">MLB.com</div>
```

### Mapping Reference

Use `feed-mapping.json` to find the new source ID for each RSS.app feed ID:

- `Kcftj40UrmoGhLBA` → `mlb-com`
- `HOpwhDoXxePVbZxP` → `espn-mlb`
- `gpNdeo4WRun54WuS` → `nba-com`
- `pbw0uEDOop5lPZ1h` → `espn-nba`
- `RzsFiWRkJWt232Z1` → `nfl-com`
- `cexYuRoRAMSoUAp8` → `espn-nfl`
- `tjqR23Xwa5us4EGS` → `nhl-com`
- `aEOH2tj5bfjq4oJd` → `espn-nhl`

### For Social Feeds (Widgets)

The social feeds use RSS.app widgets. You have two options:

#### Option A: Replace with RSS XML Feeds
Modify `loadSocialFeed()` to fetch and display RSS feeds directly instead of using widgets.

#### Option B: Keep RSS.app for Social (Temporary)
Keep using RSS.app widgets for social feeds while migrating news feeds first.

## Step 3: Test the Feeds

1. Test health endpoint: `https://your-service-url/health`
2. List all feeds: `https://your-service-url/feeds`
3. Test a feed: `https://your-service-url/feeds/mlb-com.xml`

## Step 4: Add More Sources

To add more news sources, edit `rss-feed-service/index.js` and add to `NEWS_SOURCES`:

```javascript
'new-source-id': {
  url: 'https://example.com/news',
  title: 'Source Name',
  description: 'Description',
  scraper: async () => await scrapeWebsite('https://example.com/news', {
    selector: ['.article', 'article'],
    linkSelector: 'a',
    titleSelector: 'h1, h2, h3',
    dateSelector: '.date, time',
    imageSelector: 'img',
    maxItems: 20
  })
}
```

Then redeploy:
```bash
./deploy.sh
```

## Troubleshooting

### Feeds return empty
- Check if the website structure has changed
- Update selectors in `scraper.js`
- Check service logs: `gcloud run services logs read rss-feed-service --region us-central1`

### Feeds are slow
- Increase cache TTL in `index.js` (currently 15 minutes)
- Increase Cloud Run memory allocation
- Add more instances

### Some sites block scraping
- Some sites may require different headers
- Consider using a proxy service
- Some sites may have rate limiting

## Cost Comparison

**RSS.app:** ~$10-50/month depending on plan
**Custom Service:** 
- Cloud Run: ~$0-5/month (pay per request)
- Free tier: 2 million requests/month free

## Next Steps

1. Deploy the service
2. Test with a few feeds
3. Gradually migrate all feeds
4. Monitor performance and adjust as needed
5. Add more sources as needed

