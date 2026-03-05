# NewsNow RSS.app Process: How It Works

This document explains how the RSS feed service will handle NewsNow feeds through RSS.app.

---

## Overview: Two-Step Process

### Step 1: Fetch from RSS.app
- RSS.app provides RSS feeds for NewsNow.com pages
- These feeds contain NewsNow redirect URLs (e.g., `https://www.newsnow.com/us/Sports/NFL?type=ln&url=https://espn.com/article/123`)
- We fetch these feeds every 15 minutes in the background

### Step 2: Extract Ultimate URLs & Store in Database
- Extract the final destination URL from each NewsNow redirect link
- Store articles with **ultimate URLs only** (never redirect URLs) in the database
- Frontend serves from database (instant, no scraping on request)

---

## How It Works: Detailed Flow

### Background Job (Runs Every 15 Minutes)

```
1. Fetch RSS.app Feed
   ↓
2. Parse RSS XML
   ↓
3. For each article:
   - Check if link contains newsnow.com redirect
   - If yes: Extract ultimate URL using extractFinalUrl()
   - If no: Use link as-is
   ↓
4. Store all articles in database (SQLite or Firestore)
   - Title
   - Ultimate URL (never redirect URL)
   - Description
   - Publication date
   - GUID (for deduplication)
   ↓
5. Database now has 80 articles per feed (accumulates over time)
```

### Frontend Request (Instant)

```
1. User clicks feed on website
   ↓
2. Frontend requests: GET /feeds/newsnow-nfl.xml
   ↓
3. Service checks database
   ↓
4. Returns RSS XML from database (instant, no scraping)
   ↓
5. User sees articles with direct URLs (no NewsNow redirects)
```

---

## URL Extraction Process

### NewsNow Redirect URL Format

RSS.app feeds contain links like:
```
https://www.newsnow.com/us/Sports/NFL?type=ln&url=https://espn.com/article/123
```

### Extraction Methods (in order of priority):

1. **Query Parameter Extraction** (fastest, no network request)
   - Extract `url` parameter from query string
   - Example: `?url=https://espn.com/article/123` → `https://espn.com/article/123`

2. **Hash Fragment Extraction**
   - Extract URL from hash fragment
   - Example: `#url=https://espn.com/article/123` → `https://espn.com/article/123`

3. **Path Segment Extraction**
   - Extract URL from path segments
   - Example: `/A/1234567890?url=https://espn.com/article/123`

4. **HTML Fetching** (fallback if URL string extraction fails)
   - Fetch the NewsNow redirect page
   - Extract from JavaScript: `url: 'https://espn.com/article/123'`
   - Extract from HTML: `<a href="https://espn.com/article/123">`
   - Extract from meta tags or canonical links

### Result

**Before:** `https://www.newsnow.com/us/Sports/NFL?type=ln&url=https://espn.com/article/123`  
**After:** `https://espn.com/article/123` ✅

---

## Database Storage

### What Gets Stored

For each article:
```javascript
{
  title: "Article Title",
  link: "https://espn.com/article/123",  // ULTIMATE URL (never redirect)
  description: "Article description...",
  date: "2025-12-13T10:00:00Z",
  guid: "unique-article-id",
  pubDate: "2025-12-13T10:00:00Z"
}
```

### Accumulation Logic

- **New articles** are added to database
- **Duplicate articles** (same GUID) are updated (keeps newer version)
- **Old articles** beyond 80-item limit are deleted
- **Result:** Database always has up to 80 most recent articles per feed

---

## Configuration Changes Needed

### Current State
- NewsNow feeds use `scrapeNewsNow()` to scrape NewsNow.com directly
- This causes IP blocks and timeouts

### New State
- NewsNow feeds use RSS.app URLs (`isDirectRSS: true`)
- Background job fetches from RSS.app
- Extracts ultimate URLs automatically
- Stores in database

### Feed Configuration Example

**Before:**
```javascript
'newsnow-nfl': {
  url: 'https://www.newsnow.com/us/Sports/NFL',
  scraper: async () => await scrapeNewsNow('https://www.newsnow.com/us/Sports/NFL')
}
```

**After:**
```javascript
'newsnow-nfl': {
  url: 'https://rss.app/feeds/[RSS_APP_FEED_ID].xml',
  title: 'NewsNow NFL',
  description: 'NewsNow NFL news',
  isDirectRSS: true  // This tells the service to fetch from RSS.app
}
```

---

## Benefits

✅ **No IP Blocks** - RSS.app handles NewsNow.com access  
✅ **No Timeouts** - RSS.app is reliable and fast  
✅ **Instant Serving** - Frontend serves from database (no scraping on request)  
✅ **Always Direct URLs** - Ultimate URLs extracted and stored  
✅ **Accumulated History** - Up to 80 articles per feed (not just latest 20)  
✅ **Automatic Updates** - Background job refreshes every 15 minutes  

---

## Implementation Steps

1. **Get RSS.app Feed IDs** for all NewsNow feeds
   - Create feeds in RSS.app for each NewsNow page
   - Get the RSS.app feed URLs

2. **Update Feed Configurations**
   - Change all `newsnow-*` feeds to use RSS.app URLs
   - Set `isDirectRSS: true`
   - Remove `scraper` functions

3. **Update Background Job**
   - Process ALL RSS.app feeds (not just those with NewsNow redirects)
   - For feeds with NewsNow redirects, extract ultimate URLs
   - Store in database with ultimate URLs only

4. **Test**
   - Verify feeds are fetched from RSS.app
   - Verify ultimate URLs are extracted correctly
   - Verify database stores articles correctly
   - Verify frontend serves from database

---

## Code Changes Required

### 1. Update NEWS_SOURCES Configuration

Change all NewsNow feeds from:
```javascript
'newsnow-nfl': {
  url: 'https://www.newsnow.com/us/Sports/NFL',
  scraper: async () => await scrapeNewsNow('...')
}
```

To:
```javascript
'newsnow-nfl': {
  url: 'https://rss.app/feeds/[FEED_ID].xml',
  title: 'NewsNow NFL',
  description: 'NewsNow NFL news',
  isDirectRSS: true
}
```

### 2. Update Background Job

Modify `refreshRSSAppFeeds()` to:
- Process ALL RSS.app feeds (not just those with NewsNow redirects)
- For each article, check if link is a NewsNow redirect
- If yes, extract ultimate URL using `extractFinalUrl()`
- Store in database with ultimate URL

### 3. Update extractFinalUrl Function

Ensure it handles all NewsNow redirect formats:
- Query parameters
- Hash fragments
- Path segments
- HTML extraction (fallback)

---

## Testing Checklist

- [ ] RSS.app feeds are accessible
- [ ] Background job fetches RSS.app feeds successfully
- [ ] NewsNow redirect URLs are detected correctly
- [ ] Ultimate URLs are extracted correctly (no NewsNow.com in final URLs)
- [ ] Articles are stored in database with ultimate URLs
- [ ] Frontend serves articles from database
- [ ] No NewsNow.com redirects appear in frontend
- [ ] Feed accumulates up to 80 articles over time
- [ ] Background job runs every 15 minutes automatically

---

## Example: Complete Flow for NFL Feed

1. **RSS.app Feed URL:** `https://rss.app/feeds/abc123.xml`

2. **RSS.app Returns:**
   ```xml
   <item>
     <title>NFL News Article</title>
     <link>https://www.newsnow.com/us/Sports/NFL?type=ln&url=https://espn.com/nfl/article/123</link>
   </item>
   ```

3. **Background Job Extracts:**
   - Detects NewsNow redirect: `https://www.newsnow.com/us/Sports/NFL?type=ln&url=https://espn.com/nfl/article/123`
   - Extracts ultimate URL: `https://espn.com/nfl/article/123`

4. **Stores in Database:**
   ```javascript
   {
     title: "NFL News Article",
     link: "https://espn.com/nfl/article/123",  // Ultimate URL
     guid: "nfl-article-123",
     date: "2025-12-13T10:00:00Z"
   }
   ```

5. **Frontend Requests:** `GET /feeds/newsnow-nfl.xml`

6. **Service Returns:** RSS XML with `link: "https://espn.com/nfl/article/123"` (direct URL)

7. **User Clicks:** Goes directly to ESPN article (no NewsNow redirect)

---

## Next Steps

1. Get RSS.app feed URLs for all NewsNow feeds
2. Update feed configurations in `index.js`
3. Test URL extraction with sample feeds
4. Deploy and verify everything works

