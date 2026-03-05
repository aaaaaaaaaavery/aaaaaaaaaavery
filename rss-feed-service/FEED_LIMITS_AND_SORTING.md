# RSS Feed Limits and Sorting

## Maximum Number of Posts

### Individual Feeds (`/feeds/:sourceId.xml`)
- **Limit**: **100 posts** (increased from 20)
- **Sorted**: ✅ Yes, by publication date (newest first)

### Bundles (`/bundle/:bundleName.xml`)
- **Limit**: **100 posts** (increased from 50)
- **Sorted**: ✅ Yes, by publication date (newest first)

### YouTube Playlists (`/youtube/playlist/:playlistId.xml`)
- **Limit**: **Unlimited** (uses YouTube's native RSS feed, which typically returns 15-50 most recent videos)
- **Sorted**: ✅ Yes, by publication date (newest first) - YouTube's native RSS is already sorted

## Sorting Implementation

### Individual Feeds
All individual feeds are now sorted by publication date in descending order (newest first):

```javascript
articles.sort((a, b) => {
  const dateA = a.date ? new Date(a.date).getTime() : 0;
  const dateB = b.date ? new Date(b.date).getTime() : 0;
  return dateB - dateA; // Descending order (newest first)
});
```

### Bundles
Bundles combine multiple feeds and sort all items by publication date:

```javascript
allItems.sort((a, b) => {
  const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
  const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
  return dateB - dateA; // Descending order (newest first)
});
```

### YouTube Feeds
YouTube feeds use YouTube's native RSS feed, which is already sorted by publication date (newest first). If scraping is used as a fallback, videos are processed in the order they appear in the playlist (which is typically chronological).

## Summary

✅ **All feeds are sorted by most recent posts first**
✅ **Individual feeds: 100 posts maximum**
✅ **Bundles: 100 posts maximum**
✅ **YouTube: Uses native RSS (typically 15-50 videos, already sorted)**

## Notes

- If a feed has fewer than 100 posts, all posts are included
- Posts without dates are placed at the end (sorted as if date = 0)
- The sorting happens before limiting, so you always get the 100 most recent posts

