# Failing RSS Feeds - Status Report

## Working Feeds ✅
- **Direct RSS Feeds**: All working (MLB, Yahoo, ESPN, FanGraphs, etc.)
- **YouTube Channels**: All working (NBA, Formula 1, etc.)
- **YouTube Playlists**: All working

## Failing Feeds ❌
All **scraped websites** are currently failing because the HTML selectors don't match the current website structure:

1. **si-nba** - Sports Illustrated NBA
2. **autosport-f1** - Autosport F1
3. **planetf1** - Planet F1
4. **bbc-premierleague** - BBC Premier League
5. **nhl-video-recaps** - NHL Game Recaps
6. **bleacherreport-nba** - Bleacher Report NBA

## Solution Options

### Option 1: Use RSS.app for failing feeds (Quick Fix)
Temporarily revert these feeds back to RSS.app until scrapers are fixed.

### Option 2: Fix Scrapers (Long-term)
Update the HTML selectors in `scraper.js` to match the current website structure. This requires:
- Inspecting each website's HTML structure
- Updating selectors in `rss-feed-service/index.js`
- Testing each scraper

### Option 3: Find Native RSS Feeds
Some of these sites may have native RSS feeds we can use instead of scraping.

## Next Steps
1. For now, these feeds will return cached data if available, or an error message
2. Users can continue using RSS.app for these feeds
3. Scrapers need to be updated with correct selectors

