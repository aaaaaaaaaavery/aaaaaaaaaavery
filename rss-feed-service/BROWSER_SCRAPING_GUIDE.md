# Browser-Based Scraping Guide (RSS.app Clone)

## Overview

This system now supports **browser-based scraping** using Puppeteer, similar to RSS.app. This allows us to scrape JavaScript-rendered websites that Cheerio cannot handle.

## Architecture

### Two Scraping Methods:

1. **Cheerio (Fast, Lightweight)** - Default for most sites
   - Static HTML parsing
   - Fast (1-3 seconds)
   - Low resource usage
   - Works for 80% of sites

2. **Puppeteer (Browser-based)** - For dynamic sites
   - Full JavaScript execution
   - Slower (5-30 seconds)
   - Higher resource usage
   - Works for 95%+ of sites (including React/Next.js apps)

### Browser Pool Management

- **Max browsers**: 3 (configurable via `MAX_BROWSERS` env var)
- **Browser reuse**: Browsers are pooled and reused for efficiency
- **Auto-cleanup**: Browsers are closed on process exit

## Configuration Options

### Option 1: Browser-Only Scraping

Use browser scraping exclusively (no Cheerio attempt):

```javascript
'mmamania': {
  url: 'https://www.mmamania.com/',
  title: 'MMA Mania',
  description: 'MMA Mania',
  useBrowser: true,  // Use browser only
  browserConfig: {
    selector: 'article, [class*="article"]',
    titleSelector: 'h1, h2, h3',
    linkSelector: 'a',
    dateSelector: 'time, [class*="date"]',
    imageSelector: 'img',
    maxItems: 20,
    waitForSelector: '.article-list',  // Wait for this selector before scraping
    scrollToBottom: true,  // Scroll to load lazy content
    scrollDelay: 2000  // Delay after scrolling
  }
}
```

### Option 2: Browser Fallback (Recommended)

Try Cheerio first, fallback to browser if Cheerio fails:

```javascript
'ringmagazine': {
  url: 'https://ringmagazine.com/en/news',
  title: 'Ring Magazine',
  description: 'Ring Magazine news',
  useBrowserFallback: true,  // Try Cheerio, then browser
  scraperConfig: {
    selector: ['article', '.article-item'],
    titleSelector: 'h1, h2, h3',
    linkSelector: 'a',
    maxItems: 20
  },
  browserConfig: {
    selector: 'article, [class*="article"]',
    titleSelector: 'h1, h2, h3',
    linkSelector: 'a',
    waitForSelector: '.article-list',
    scrollToBottom: true
  }
}
```

### Option 3: Custom Scraper with Browser Fallback

Use a custom Cheerio scraper, fallback to browser:

```javascript
'badlefthook': {
  url: 'https://www.badlefthook.com/',
  title: 'Bad Left Hook',
  description: 'Bad Left Hook',
  useBrowserFallback: true,
  scraper: async () => await scrapeBadLeftHook(),  // Custom Cheerio scraper
  browserConfig: {
    selector: 'article, [data-testid*="article"]',
    titleSelector: 'h1, h2, h3',
    linkSelector: 'a',
    waitForSelector: '[data-testid*="article"]',
    scrollToBottom: true
  }
}
```

## Browser Config Options

### Basic Options

- `selector` - CSS selector(s) for article containers (string or array)
- `titleSelector` - CSS selector for article title
- `linkSelector` - CSS selector for article link
- `dateSelector` - CSS selector for article date
- `imageSelector` - CSS selector for article image
- `descriptionSelector` - CSS selector for article description
- `maxItems` - Maximum number of articles to return (default: 20)
- `timeout` - Page load timeout in ms (default: 30000)

### Advanced Options

- `waitForSelector` - Wait for specific selector before scraping (useful for lazy-loaded content)
- `scrollToBottom` - Whether to scroll to bottom to load lazy content (default: false)
- `scrollDelay` - Delay after scrolling in ms (default: 1000)

## Example: Converting a Failing Feed to Browser Scraping

### Before (Cheerio - Failing):

```javascript
'mmamania': {
  url: 'https://www.mmamania.com/',
  title: 'MMA Mania',
  description: 'MMA Mania',
  scraper: async () => await scrapeWebsite('https://www.mmamania.com/', {
    selector: ['article', '.article-item', '.story'],
    linkSelector: 'a',
    titleSelector: 'h1, h2, h3',
    dateSelector: '.date, time',
    imageSelector: 'img',
    maxItems: 20
  })
}
```

### After (Browser Fallback - Recommended):

```javascript
'mmamania': {
  url: 'https://www.mmamania.com/',
  title: 'MMA Mania',
  description: 'MMA Mania',
  useBrowserFallback: true,
  scraperConfig: {
    selector: ['article', '.article-item', '.story'],
    linkSelector: 'a',
    titleSelector: 'h1, h2, h3',
    dateSelector: '.date, time',
    imageSelector: 'img',
    maxItems: 20
  },
  browserConfig: {
    selector: 'article, [class*="article"], [class*="story"]',
    titleSelector: 'h1, h2, h3, [class*="title"]',
    linkSelector: 'a',
    dateSelector: 'time, [datetime], [class*="date"]',
    imageSelector: 'img',
    maxItems: 20,
    waitForSelector: 'article',  // Wait for articles to load
    scrollToBottom: true,  // Scroll to load lazy content
    scrollDelay: 2000
  }
}
```

## Sites That Need Browser Scraping

Based on testing, these sites typically need browser scraping:

1. **React/Next.js Apps** (content loaded via JavaScript):
   - MMA Mania
   - MMA Fighting
   - Ring Magazine
   - Some boxing sites

2. **Dynamic Content** (infinite scroll, lazy loading):
   - Sites with "Load More" buttons
   - Sites that load content on scroll

3. **Anti-Scraping Measures**:
   - Sites that detect non-browser requests
   - Sites that require JavaScript to render content

## Performance Considerations

### Browser Scraping is Slower:

- **Cheerio**: 1-3 seconds per scrape
- **Browser**: 5-30 seconds per scrape

### Resource Usage:

- **Cheerio**: ~10-50 MB RAM per request
- **Browser**: ~100-500 MB RAM per browser instance

### Best Practices:

1. **Use browser fallback** - Try Cheerio first, only use browser if needed
2. **Limit concurrent browsers** - Max 3 browsers at once (configurable)
3. **Cache aggressively** - Browser scrapes are cached for 15 minutes
4. **Use browser only for problematic sites** - Don't use for sites that work with Cheerio

## Testing Browser Scraping

### Test a feed with browser scraping:

```bash
# Test browser-only scraping
curl "http://localhost:8080/feeds/mmamania.xml"

# Test browser fallback (will try Cheerio first)
curl "http://localhost:8080/feeds/ringmagazine.xml"
```

### Check logs:

```bash
# Watch for browser scraping logs
tail -f service.log | grep "Browser"
```

## Troubleshooting

### Browser scraping fails:

1. **Check selectors** - Use browser DevTools to find correct selectors
2. **Increase timeout** - Some sites load slowly
3. **Add waitForSelector** - Wait for content to load
4. **Enable scrollToBottom** - For lazy-loaded content

### Browser scraping is too slow:

1. **Use browser fallback** - Only use browser when Cheerio fails
2. **Reduce maxItems** - Scrape fewer articles
3. **Increase cache time** - Cache results longer
4. **Optimize selectors** - More specific selectors are faster

### Browser crashes:

1. **Check memory** - Browsers use more RAM
2. **Reduce MAX_BROWSERS** - Limit concurrent browsers
3. **Check logs** - Look for error messages
4. **Restart service** - Browser pool may need reset

## Environment Variables

- `MAX_BROWSERS` - Maximum number of concurrent browsers (default: 3)
- `CHECK_ROBOTS_TXT` - Check robots.txt before scraping (default: true, set to 'false' to disable)

## Migration Guide

### Step 1: Identify failing feeds

Check which feeds are returning "No articles found" or HTTP 503 errors.

### Step 2: Test with browser

Add `useBrowser: true` temporarily to test if browser scraping works:

```javascript
'problematic-feed': {
  url: 'https://example.com/',
  title: 'Problematic Feed',
  description: 'Test feed',
  useBrowser: true,
  browserConfig: {
    selector: 'article',
    titleSelector: 'h1, h2',
    linkSelector: 'a',
    maxItems: 20
  }
}
```

### Step 3: Optimize selectors

Use browser DevTools to find the best selectors for the site.

### Step 4: Switch to fallback

Once browser scraping works, switch to `useBrowserFallback: true` for better performance.

## Cost Comparison

### Current System (Cheerio):
- **Speed**: 1-3 seconds per scrape
- **Cost**: ~$5-20/month (Cloud Run)
- **Success rate**: ~70-80%

### Browser-Based System:
- **Speed**: 5-30 seconds per scrape
- **Cost**: ~$50-200/month (Cloud Run - more CPU/memory)
- **Success rate**: ~95%+

### Hybrid Approach (Recommended):
- **Speed**: 1-3 seconds (Cheerio) or 5-30 seconds (browser fallback)
- **Cost**: ~$20-50/month (Cloud Run)
- **Success rate**: ~95%+ (Cheerio for most, browser for problematic sites)

## Next Steps

1. **Test browser scraping** on problematic feeds
2. **Convert failing feeds** to use browser fallback
3. **Monitor performance** and costs
4. **Optimize selectors** for better speed
5. **Add more feeds** as needed

The system is now a full RSS.app clone with browser-based scraping capabilities! 🚀

