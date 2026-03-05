# RSS Feed Migration Guide

## Overview
This guide explains how to migrate from RSS.app to our custom RSS feed service.

## Migration Process

### Step 1: Extract Playlist IDs from YouTube URLs

For YouTube playlists, extract the playlist ID from the URL:
- URL: `https://www.youtube.com/playlist?list=PLRdw3IjKY2gkkRZXXJvfF5R6egSDPsdrH`
- Playlist ID: `PLRdw3IjKY2gkkRZXXJvfF5R6egSDPsdrH`

### Step 2: Create RSS Feed URL

For YouTube playlists, use our service:
```
http://your-rss-service-domain/youtube/playlist/PLRdw3IjKY2gkkRZXXJvfF5R6egSDPsdrH.xml
```

For other sources (ESPN, CBS, etc.), use:
```
http://your-rss-service-domain/feeds/espn-mlb.xml
```

### Step 3: Update Frontend Configuration

Replace RSS.app IDs with custom RSS feed URLs in the `rssFeeds` object in `index (1).html`.

## Example Migration

**Before (RSS.app):**
```javascript
NCAAM: ["nSxcJn3Ke9aIPqkw"]
```

**After (Custom RSS):**
```javascript
NCAAM: ["http://your-domain.com/youtube/playlist/PLn3nHXu50t5zlzgZhRCXRsZcRIfapIxEV.xml"]
```

## YouTube Playlist IDs from Your Image

1. **NFL Videos**: `PLRdw3IjKY2gkkRZXXJvfF5R6egSDPsdrH`
2. **NCAAW - ACC**: `PLSrXjFYZsRuPigBvTe-tB2PWDWZr6Eks_`
3. **NCAAW - Big 12**: `PLhh7fyF6r5qXCuhDgwdKKfCIzXkgF4fqx`
4. **NCAAW - ESPN**: `PLn3nHXu50t5ycOprei1VvRrS6rgFyNamo`
5. **NCAAW - B1G**: `PL2RRF9GtC9s32jHtkN74wyLXRtTR5Ash8`
6. **NCAAM - ACC**: `PLSrXjFYZsRuMeW1ttMkXz4cQy9bap9flB`
7. **NCAAM - Big 12**: `PLhh7fyF6r5qVV2_RonsHodwkwe-GGt_Jl`
8. **NCAAM - FOX**: `PLSoN6Th-EepPKUIUbnOMTwOpdBb5eNonz`
9. **NCAAM - B1G**: `PL2RRF9GtC9s1v7L7t05Astcl4Z8xq3BqQ`
10. **NCAAM - ESPN**: `PLn3nHXu50t5zlzgZhRCXRsZcRIfapIxEV`

