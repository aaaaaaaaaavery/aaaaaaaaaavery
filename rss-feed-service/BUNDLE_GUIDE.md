# RSS Feed Bundle Guide

## Overview

RSS Feed Bundles allow you to combine multiple RSS feeds into a single feed. This is perfect for video columns that need content from multiple sources.

## Two Ways to Create Bundles

### Method 1: Query Parameters (Dynamic)

Create a bundle on-the-fly by passing feed URLs as query parameters:

```
http://your-rss-service.com/bundle?feeds=url1,url2,url3&name=BundleName
```

**Example:**
```
http://localhost:3001/bundle?feeds=/youtube/playlist/PLRdw3IjKY2gkkRZXXJvfF5R6egSDPsdrH.xml,/youtube/playlist/PLn3nHXu50t5zlzgZhRCXRsZcRIfapIxEV.xml&name=NFL-NCAAM-Videos
```

**Features:**
- ✅ No code changes needed
- ✅ Works with any combination of feeds
- ✅ URLs can be relative (e.g., `/youtube/playlist/...`) or absolute
- ✅ Automatically sorts by date (newest first)
- ✅ Limits to 50 most recent items

### Method 2: Named Bundles (Predefined)

Define bundles in `bundle-rss.js` and access them by name:

```
http://your-rss-service.com/bundle/ncaam-videos.xml
```

**To add a new bundle:**

1. Edit `rss-feed-service/bundle-rss.js`
2. Add to `BUNDLE_CONFIGS` object:

```javascript
const BUNDLE_CONFIGS = {
  'ncaam-videos': [
    '/youtube/playlist/PLn3nHXu50t5zlzgZhRCXRsZcRIfapIxEV.xml',
    '/youtube/playlist/PLSrXjFYZsRuMeW1ttMkXz4cQy9bap9flB.xml',
    '/youtube/playlist/PLhh7fyF6r5qVV2_RonsHodwkwe-GGt_Jl.xml'
  ],
  'your-bundle-name': [
    '/youtube/playlist/PLAYLIST_ID_1.xml',
    '/youtube/playlist/PLAYLIST_ID_2.xml',
    '/feeds/espn-mlb.xml'  // Can mix YouTube and other feeds
  ]
};
```

3. Access at: `http://your-rss-service.com/bundle/your-bundle-name.xml`

## Using Bundles in Frontend

### Replace RSS.app Bundle

**Before (RSS.app):**
```javascript
NCAAM: ["nSxcJn3Ke9aIPqkw"]  // Single RSS.app feed
```

**After (Custom Bundle):**
```javascript
NCAAM: ["http://your-rss-service.com/bundle/ncaam-videos.xml"]
```

Or use query parameters:
```javascript
NCAAM: ["http://your-rss-service.com/bundle?feeds=/youtube/playlist/PL1.xml,/youtube/playlist/PL2.xml&name=NCAAM-Videos"]
```

## Example: Migrating Your YouTube Playlists

From your RSS.app image, here are the playlist IDs:

### NCAAM Videos Bundle
- ESPN: `PLn3nHXu50t5zlzgZhRCXRsZcRIfapIxEV`
- ACC: `PLSrXjFYZsRuMeW1ttMkXz4cQy9bap9flB`
- Big 12: `PLhh7fyF6r5qVV2_RonsHodwkwe-GGt_Jl`
- FOX: `PLSoN6Th-EepPKUIUbnOMTwOpdBb5eNonz`
- B1G: `PL2RRF9GtC9s1v7L7t05Astcl4Z8xq3BqQ`

**Bundle URL:**
```
http://your-rss-service.com/bundle?feeds=/youtube/playlist/PLn3nHXu50t5zlzgZhRCXRsZcRIfapIxEV.xml,/youtube/playlist/PLSrXjFYZsRuMeW1ttMkXz4cQy9bap9flB.xml,/youtube/playlist/PLhh7fyF6r5qVV2_RonsHodwkwe-GGt_Jl.xml,/youtube/playlist/PLSoN6Th-EepPKUIUbnOMTwOpdBb5eNonz.xml,/youtube/playlist/PL2RRF9GtC9s1v7L7t05Astcl4Z8xq3BqQ.xml&name=NCAAM-Videos
```

### NCAAW Videos Bundle
- ESPN: `PLn3nHXu50t5ycOprei1VvRrS6rgFyNamo`
- ACC: `PLSrXjFYZsRuPigBvTe-tB2PWDWZr6Eks_`
- Big 12: `PLhh7fyF6r5qXCuhDgwdKKfCIzXkgF4fqx`
- B1G: `PL2RRF9GtC9s32jHtkN74wyLXRtTR5Ash8`

**Bundle URL:**
```
http://your-rss-service.com/bundle?feeds=/youtube/playlist/PLn3nHXu50t5ycOprei1VvRrS6rgFyNamo.xml,/youtube/playlist/PLSrXjFYZsRuPigBvTe-tB2PWDWZr6Eks_.xml,/youtube/playlist/PLhh7fyF6r5qXCuhDgwdKKfCIzXkgF4fqx.xml,/youtube/playlist/PL2RRF9GtC9s32jHtkN74wyLXRtTR5Ash8.xml&name=NCAAW-Videos
```

## Features

- ✅ **Automatic Sorting**: Items sorted by publication date (newest first)
- ✅ **Deduplication**: Same item from multiple feeds appears once
- ✅ **Caching**: Bundles cached for 15 minutes
- ✅ **Mixed Sources**: Combine YouTube playlists, news feeds, etc.
- ✅ **Limit**: Returns up to 50 most recent items

## Migration Workflow

1. **Identify feeds** in your RSS.app bundle
2. **Extract URLs/IDs** (YouTube playlist IDs, news feed URLs, etc.)
3. **Create bundle URL** using query parameters or named bundle
4. **Replace RSS.app ID** in `rssFeeds` object with bundle URL
5. **Test** the bundle URL directly in browser
6. **Deploy** RSS service if not already deployed

## Testing

Test a bundle URL:
```bash
curl "http://localhost:3001/bundle?feeds=/youtube/playlist/PLRdw3IjKY2gkkRZXXJvfF5R6egSDPsdrH.xml&name=Test"
```

Or in browser:
```
http://localhost:3001/bundle?feeds=/youtube/playlist/PLRdw3IjKY2gkkRZXXJvfF5R6egSDPsdrH.xml&name=Test
```

