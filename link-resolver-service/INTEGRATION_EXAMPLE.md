# Integration Example

This document shows how `rss-feed-service` would call `link-resolver-service` via HTTP.

**NOTE: This is illustrative only. Do NOT modify rss-feed-service based on this example.**

## Example Usage in rss-feed-service

```javascript
// In rss-feed-service/index.js (example only - DO NOT IMPLEMENT)

const LINK_RESOLVER_SERVICE_URL = process.env.LINK_RESOLVER_SERVICE_URL || 'http://localhost:3001';

async function resolveAggregatorUrl(url) {
  try {
    const response = await fetch(`${LINK_RESOLVER_SERVICE_URL}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url }),
      timeout: 12000 // Slightly longer than resolver timeout
    });

    if (!response.ok) {
      console.warn(`[RSS Service] Link resolver returned ${response.status}, using original URL`);
      return url; // Fallback to original URL
    }

    const result = await response.json();
    
    if (result.status === 'ok' && result.resolvedUrl) {
      return result.resolvedUrl;
    }

    // Fallback to original URL if resolution failed
    return url;
  } catch (error) {
    console.error(`[RSS Service] Error calling link resolver:`, error.message);
    return url; // Always fallback to original URL
  }
}

// Example usage when processing RSS items:
async function processRSSItem(item) {
  const originalLink = item.link;
  
  // Check if it's an aggregator URL
  if (originalLink.includes('sportspyder.com') || originalLink.includes('newsnow.co.uk')) {
    const resolvedLink = await resolveAggregatorUrl(originalLink);
    item.link = resolvedLink;
  }
  
  return item;
}
```

## Environment Variable

Set `LINK_RESOLVER_SERVICE_URL` to point to your deployed resolver service:
```
LINK_RESOLVER_SERVICE_URL=https://link-resolver-service.example.com
```

