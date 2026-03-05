# Official APIs Guide - Reddit, Instagram, YouTube

## Overview

Yes! You can use official APIs instead of scraping. Here's what's available:

---

## ✅ Reddit API (FREE)

### What You Get:
- **Free** - No cost
- **Reliable** - Official API, won't get blocked
- **Rate Limits**: 60 requests per minute
- **No Authentication Required** for public data

### How to Use:

**1. Get Reddit RSS Feeds (Easiest - No API needed!)**
```
https://www.reddit.com/r/nba/.rss
https://www.reddit.com/r/nba/search.rss?q=Grizzlies+Trail+Blazers&restrict_sr=1
```
- Reddit automatically provides RSS feeds for subreddits
- You can search within subreddits via RSS
- **Cost**: $0
- **No API key needed**

**2. Use Reddit API (For More Control)**
```javascript
// Example: Get posts from r/nba about "Grizzlies Trail Blazers"
const response = await fetch('https://www.reddit.com/r/nba/search.json?q=Grizzlies+Trail+Blazers&limit=25');
const data = await response.json();
const posts = data.data.children.map(child => child.data);
```

**What You Can Get:**
- Posts from subreddits
- Comments
- Search results
- User posts
- Hot/New/Top posts

**Rate Limits:**
- 60 requests per minute (per IP)
- More than enough for your use case

**Cost**: **FREE** ✅

**Best For**: Reddit data (posts, comments, game threads)

---

## ⚠️ Instagram API (Meta Graph API)

### What You Get:
- **Free** (with limitations)
- **Requires App Approval** - Must apply to Meta
- **Rate Limits**: Varies by tier
- **Authentication Required** - OAuth tokens

### How to Use:

**1. Basic Display API (Deprecated)**
- No longer available for new apps
- Old apps can still use it

**2. Instagram Graph API (Current)**
- Requires Facebook App
- Must apply for Instagram Basic Display or Instagram Graph API
- Requires business/creator account verification
- **Complex setup process**

**What You Can Get:**
- Posts from Instagram accounts (if approved)
- Media (photos/videos)
- Comments
- User info

**Limitations:**
- **Cannot search hashtags** without special approval
- **Cannot search by location** without special approval
- **Cannot get posts from accounts you don't own** (without permission)
- **Requires app review** by Meta (can take weeks)

**Rate Limits:**
- 200 requests per hour (basic tier)
- Higher tiers available

**Cost**: **FREE** (but requires approval process)

**Best For**: Getting posts from specific Instagram accounts you own/manage

**Not Good For**: 
- Searching hashtags (#Grizzlies)
- Searching by game/matchup
- Getting posts from accounts you don't control

---

## ✅ YouTube API (FREE)

### What You Get:
- **Free** - Generous quota
- **Reliable** - Official Google API
- **Rate Limits**: 10,000 units per day (default)
- **Authentication Required** - API key (free)

### How to Use:

**1. Get API Key (Free)**
- Go to Google Cloud Console
- Create project
- Enable YouTube Data API v3
- Create API key
- **Cost**: $0

**2. Search for Videos**
```javascript
// Example: Search for "Grizzlies Trail Blazers"
const apiKey = 'YOUR_API_KEY';
const searchQuery = 'Grizzlies Trail Blazers';
const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=25&key=${apiKey}`;

const response = await fetch(url);
const data = await response.json();
const videos = data.items;
```

**What You Can Get:**
- Video search results
- Video details (title, description, thumbnails)
- Channel information
- Playlists
- Comments (with authentication)

**Rate Limits:**
- **10,000 units per day** (default, free)
- Each search = 100 units
- = ~100 searches per day
- Can request quota increase (free)

**Cost**: **FREE** ✅

**Best For**: 
- Video content about games
- Highlights, recaps
- Channel subscriptions

---

## Comparison Table

| Platform | API Available? | Cost | Rate Limits | Search Capabilities | Best For |
|----------|----------------|------|-------------|---------------------|----------|
| **Reddit** | ✅ Yes | FREE | 60 req/min | ✅ Full search | Posts, comments, game threads |
| **Instagram** | ⚠️ Limited | FREE* | 200 req/hour | ❌ No hashtag search | Own account posts only |
| **YouTube** | ✅ Yes | FREE | 10K units/day | ✅ Full search | Videos, highlights |
| **Twitter/X** | ✅ Yes | $100+/month | Varies | ✅ Full search | Tweets, hashtags |

*Requires Meta app approval

---

## Recommendation for Your Use Case

### For "Grizzlies vs Trail Blazers" Social Data:

**1. Reddit** ✅ **Use Official API (FREE)**
```javascript
// Get game thread from r/nba
const response = await fetch('https://www.reddit.com/r/nba/search.json?q=Grizzlies+Trail+Blazers&limit=50');
// Or use RSS: https://www.reddit.com/r/nba/search.rss?q=Grizzlies+Trail+Blazers
```
- **Cost**: $0
- **Easy to implement**
- **Reliable**

**2. YouTube** ✅ **Use Official API (FREE)**
```javascript
// Search for game highlights
const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Grizzlies+Trail+Blazers&key=${apiKey}`;
```
- **Cost**: $0
- **Easy to implement**
- **Great for video content**

**3. Instagram** ❌ **Not Recommended**
- Cannot search hashtags without special approval
- Cannot search by game/matchup
- Only works for accounts you own
- **Use Apify instead** (~$0.15 per search)

**4. Twitter/X** ⚠️ **Expensive**
- Official API: $100+/month
- **Use Apify instead** (~$0.30 per search)
- Or use your RSS.app clone to scrape Twitter (difficult, low success rate)

---

## Implementation Example

### Reddit API Integration

```javascript
// Get Reddit posts about a game
async function getRedditPostsForGame(awayTeam, homeTeam) {
  const searchQuery = `${awayTeam} ${homeTeam}`;
  
  // Option 1: Use RSS (easiest)
  const rssUrl = `https://www.reddit.com/r/nba/search.rss?q=${encodeURIComponent(searchQuery)}&restrict_sr=1&sort=new`;
  // Parse RSS feed (you already have RSS parsing in your system)
  
  // Option 2: Use JSON API (more control)
  const apiUrl = `https://www.reddit.com/r/nba/search.json?q=${encodeURIComponent(searchQuery)}&limit=25&sort=new`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  return data.data.children.map(child => ({
    title: child.data.title,
    author: child.data.author,
    score: child.data.score,
    url: child.data.url,
    created: new Date(child.data.created_utc * 1000),
    subreddit: child.data.subreddit,
    numComments: child.data.num_comments
  }));
}

// Usage
const posts = await getRedditPostsForGame('Grizzlies', 'Trail Blazers');
```

### YouTube API Integration

```javascript
// Get YouTube videos about a game
async function getYouTubeVideosForGame(awayTeam, homeTeam, apiKey) {
  const searchQuery = `${awayTeam} vs ${homeTeam}`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=25&order=relevance&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.items.map(item => ({
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.medium.url,
    videoId: item.id.videoId,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    channel: item.snippet.channelTitle,
    publishedAt: new Date(item.snippet.publishedAt)
  }));
}

// Usage
const videos = await getYouTubeVideosForGame('Grizzlies', 'Trail Blazers', 'YOUR_API_KEY');
```

---

## Cost Summary

### Using Official APIs:

**Reddit:**
- **Cost**: $0 ✅
- **Rate Limit**: 60 requests/minute
- **Best for**: Posts, comments, game threads

**YouTube:**
- **Cost**: $0 ✅
- **Rate Limit**: 10,000 units/day (~100 searches/day)
- **Best for**: Videos, highlights

**Instagram:**
- **Cost**: $0 (but limited functionality)
- **Not recommended** for game searches
- **Use Apify instead** (~$0.15 per search)

**Twitter/X:**
- **Cost**: $100+/month (official API)
- **Use Apify instead** (~$0.30 per search)

---

## Recommended Approach

**For Social Data on Games:**

1. **Reddit** → Use Official API (FREE) ✅
2. **YouTube** → Use Official API (FREE) ✅
3. **Twitter/X** → Use Apify (~$0.30 per game)
4. **Instagram** → Use Apify (~$0.15 per game) OR skip it

**Total Cost per Game:**
- Reddit: $0 (official API)
- YouTube: $0 (official API)
- Twitter: $0.30 (Apify)
- Instagram: $0.15 (Apify) or skip
- **Total: ~$0.30-$0.45 per game** (just Twitter, or Twitter + Instagram)

**Much cheaper than Twitter API ($100+/month)!**

---

## Next Steps

1. **Set up Reddit API** (just use RSS or JSON API - no key needed)
2. **Set up YouTube API** (get free API key from Google Cloud)
3. **Use Apify for Twitter** (when needed)
4. **Skip Instagram** (or use Apify if needed)

Want me to help you implement the Reddit and YouTube API integrations?

