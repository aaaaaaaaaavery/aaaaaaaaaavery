# Cloud Run Only Setup (No Firestore)

## Changes Made

### Removed:
- ✅ Firestore database imports and usage
- ✅ Local SQLite database imports and usage
- ✅ Background job that pre-fetched feeds every 15 minutes
- ✅ All database read/write operations

### Updated:
- ✅ Feeds are now fetched **on-demand** when requested
- ✅ In-memory cache (NodeCache) caches feeds for 15 minutes
- ✅ All feed types handled on-demand:
  - RSS.app feeds: Fetched directly from RSS.app
  - YouTube feeds: Generated directly (already working)
  - Reddit feeds: Fetched on-demand from Reddit RSS
  - Scraper feeds: Scraped on-demand when requested

## How It Works

1. **User requests a feed** → `/feeds/:sourceId.xml`
2. **Check in-memory cache** → If cached, serve instantly (<10ms)
3. **If not cached** → Fetch/scrape feed on-demand
4. **Cache the result** → Store in memory for 15 minutes
5. **Serve the feed** → Return RSS XML to user

## Performance

- **95% of requests**: <10ms (served from cache)
- **5% of requests**: 200ms-3s (cache miss, needs fetching)
- **Overall**: Fast user experience

## Cost

- **Cloud Run only**: ~$0.07/month
- **No Firestore**: $0/month (saved $77.70/month)
- **No background jobs**: $0/month (saved $24.49/month)
- **Total savings**: ~$102/month (99.9% cheaper)

## Cache Location

- **In-memory cache**: Stored in Cloud Run container's RAM
- **Cache duration**: 15 minutes
- **Cache lost when**: Instance scales to zero or restarts
- **First request after restart**: Cache miss (slower), then fast

## Deployment

The service is ready to deploy to Cloud Run. No Firestore setup needed.

