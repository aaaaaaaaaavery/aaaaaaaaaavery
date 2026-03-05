# RSSHub Integration Guide

## What is RSSHub?

RSSHub is an open-source RSS feed generator that can create RSS feeds from various sources, including X.com/Twitter. It's free and can be self-hosted.

## Current Status

I've integrated RSSHub into our RSS feed service. The integration tries multiple public RSSHub instances as fallbacks.

## Available Routes

### X.com/Twitter via RSSHub:

1. **User Feed**: `/rsshub/twitter/user/[username].xml`
   - Example: `http://localhost:3001/rsshub/twitter/user/nfl.xml`

2. **Twitter List**: `/rsshub/twitter/list/[username]/[listId].xml`
   - Example: `/rsshub/twitter/list/nfl/official.xml`

3. **Hashtag**: `/rsshub/twitter/hashtag/[hashtag].xml`
   - Example: `/rsshub/twitter/hashtag/nfl.xml`

4. **Generic Proxy**: `/rsshub/proxy/[any-rsshub-route]`
   - Example: `/rsshub/proxy/twitter/user/nfl`

## Public Instances (Fallback)

The service tries these RSSHub instances in order:
1. `https://rsshub.app` (Official)
2. `https://rsshub.rssforever.com`
3. `https://rsshub.uneasy.win`

## Self-Hosting RSSHub (Recommended for Reliability)

If public instances are down or rate-limited, you can self-host RSSHub:

### Option 1: Docker (Easiest)

```bash
docker run -d --name rsshub \
  -p 1200:1200 \
  -e NODE_ENV=production \
  diygod/rsshub
```

Then update `rsshub-integration.js` to use `http://localhost:1200` as the first instance.

### Option 2: npm (Local)

```bash
git clone https://github.com/DIYgod/RSSHub.git
cd RSSHub
npm install
npm start
```

### Option 3: Cloud Run (Production)

Deploy RSSHub to Cloud Run alongside our RSS service.

## Testing

Test the RSSHub integration:
```bash
curl "http://localhost:3001/rsshub/twitter/user/nfl.xml"
```

## Migration from RSS.app

To replace RSS.app X.com feeds:

1. Find the X.com username from your RSS.app feed
2. Use: `/rsshub/twitter/user/[username].xml`
3. Update `index.html` to use the new feed URL

## Limitations

- Public RSSHub instances may be rate-limited
- Some X.com accounts may require authentication
- RSSHub's Twitter routes depend on X.com's structure (may break if X.com changes)

## Recommendation

1. **Test public instances first** - They may work intermittently
2. **Self-host RSSHub** - Most reliable option
3. **Keep RSS.app as backup** - For accounts that RSSHub can't access

