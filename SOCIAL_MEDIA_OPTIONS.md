# Social Media Content Collection - Options & Recommendations

## The Challenge

For the Perspectives system, we need to match social media posts (primarily Twitter/X) to games/teams/players. The challenge:

- **Dynamic hashtags**: Each game needs different keywords (e.g., "#BrownsVsBills", "Browns Bills", etc.)
- **Not scalable**: Creating RSS feeds for each hashtag/game combination would require hundreds of feeds per day
- **Twitter/X limitations**: No official RSS support, requires API or scraping
- **Real-time needs**: Content should update as games happen

---

## Current State

### What You Have:
1. **Reddit feeds** - Via RSS.app (working, but some failing with 503s)
2. **X/Twitter scraper** - Can scrape individual profiles (`/x/profile/:username.xml`)
3. **Social panel** - Frontend ready to display social content

### What's Missing:
- Dynamic keyword/hashtag search for Twitter/X
- Account-based filtering (posts from team/player accounts)
- Real-time game-specific social feeds

---

## Option 1: Apify Twitter Scraper (RECOMMENDED)

### How It Works:
- Apify provides pre-built actors (scrapers) for Twitter/X
- Can search by hashtags, keywords, accounts, or combinations
- Returns structured JSON data
- Can be called via API from your enrichment service

### Pros:
✅ **Scalable**: One API call per search query  
✅ **No RSS feeds needed**: Direct API integration  
✅ **Flexible**: Search by hashtag, keyword, account, or combination  
✅ **Reliable**: Handles rate limits, proxies, anti-bot measures  
✅ **Real-time**: Can query on-demand when games happen  
✅ **Cost-effective**: Pay per API call (~$0.10-0.50 per 1000 tweets)

### Cons:
❌ **Costs money**: ~$0.10-0.50 per 1000 tweets scraped  
❌ **Requires API key**: Need to sign up for Apify account  
❌ **Rate limits**: Still subject to Twitter's rate limits (via Apify)

### Implementation:
```javascript
// In enrichment service
const apifyClient = require('apify-client');

async function getTwitterPostsForGame(game) {
  const client = new apifyClient.ApifyClient({
    token: process.env.APIFY_API_TOKEN
  });
  
  // Search for tweets mentioning both teams
  const team1 = game["Away Team"]; // "Cleveland Browns"
  const team2 = game["Home Team"]; // "Buffalo Bills"
  
  const searchQuery = `${team1} ${team2} OR #${team1.replace(/\s+/g, '')}Vs${team2.replace(/\s+/g, '')}`;
  
  const run = await client.actor('apify/twitter-scraper').call({
    searchTerms: [searchQuery],
    maxTweets: 50,
    addUserInfo: true
  });
  
  const tweets = await client.dataset(run.defaultDatasetId).listItems();
  return tweets.items;
}
```

### Cost Estimate:
- **Per game**: ~50-100 tweets = $0.01-0.05 per game
- **Daily (50 games)**: ~$0.50-2.50/day
- **Monthly**: ~$15-75/month

### Apify Actors Available:
1. **`apify/twitter-scraper`** - Search by keyword/hashtag
2. **`apify/twitter-profile-scraper`** - Get posts from specific accounts
3. **`apify/twitter-search-scraper`** - Advanced search with filters

---

## Option 2: Twitter/X API v2 (Official)

### How It Works:
- Twitter's official API (requires developer account)
- Search tweets by keyword/hashtag
- Filter by accounts, date, engagement, etc.
- Returns JSON data

### Pros:
✅ **Official**: Direct from Twitter, most reliable  
✅ **Rich data**: Includes engagement metrics, user info  
✅ **Real-time**: Can stream tweets as they happen  
✅ **Well-documented**: Official documentation

### Cons:
❌ **Expensive**: Free tier is very limited (1,500 tweets/month)  
❌ **Paid tier**: $100/month for Basic tier (10,000 tweets/month)  
❌ **Rate limits**: Strict rate limits even on paid tiers  
❌ **Complex**: Requires OAuth, API keys, webhooks for streaming

### Cost Estimate:
- **Free tier**: 1,500 tweets/month (not enough)
- **Basic tier**: $100/month (10,000 tweets/month)
- **Pro tier**: $5,000/month (1M tweets/month)

### Implementation:
```javascript
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function getTwitterPostsForGame(game) {
  const team1 = game["Away Team"];
  const team2 = game["Home Team"];
  const query = `${team1} ${team2} -is:retweet`;
  
  const tweets = await client.v2.search(query, {
    max_results: 50,
    tweet: { fields: ['created_at', 'author_id', 'public_metrics'] }
  });
  
  return tweets.data.data;
}
```

---

## Option 3: RSS.app Keyword Feeds (Current Approach)

### How It Works:
- RSS.app can create feeds from Twitter keyword searches
- You create feeds manually or via API
- Each feed = one search query

### Pros:
✅ **Already using**: You're familiar with RSS.app  
✅ **Simple**: Works like your existing RSS feeds  
✅ **No code changes**: Can integrate with existing RSS service

### Cons:
❌ **Not scalable**: Need to create feed for each game/hashtag  
❌ **Manual work**: Creating feeds manually is tedious  
❌ **Cost**: RSS.app charges per feed (if you exceed free tier)  
❌ **Limited**: Can't dynamically search for new games  
❌ **Delayed**: RSS feeds update slower than API calls

### When to Use:
- **Small scale**: If you only need feeds for major games/teams
- **Static**: If hashtags don't change often
- **Quick start**: As a temporary solution while building API integration

---

## Option 4: Reddit + Account-Based Twitter (Hybrid)

### How It Works:
- Use Reddit feeds (already working) for game discussions
- Scrape Twitter accounts of teams/players/official accounts
- Match posts by time proximity to games

### Pros:
✅ **Free**: Reddit feeds are free, Twitter profile scraping is free  
✅ **Reliable**: Reddit RSS works well, Twitter profiles are public  
✅ **No API costs**: Uses your existing scraper

### Cons:
❌ **Limited coverage**: Only gets posts from specific accounts  
❌ **Misses fan content**: Won't get tweets from random fans  
❌ **Less real-time**: Profile scraping is slower than search

### Implementation:
```javascript
// Use existing Twitter profile scraper
// Scrape accounts like: @Browns, @BuffaloBills, @NFL, @ESPNNFL

// In enrichment service:
const teamAccounts = {
  "CLE": ["@Browns", "@NFL"],
  "BUF": ["@BuffaloBills", "@NFL"]
};

// Scrape these accounts every 15 minutes
// Match posts to games by:
// 1. Team mentions in post text
// 2. Time proximity to game
```

---

## Option 5: Bright Data / ScraperAPI (Enterprise)

### How It Works:
- Proxy/scraping services that handle Twitter scraping
- More reliable than DIY scraping
- Handles anti-bot measures automatically

### Pros:
✅ **Reliable**: Handles proxies, rotation, anti-bot  
✅ **Scalable**: Can handle high volume  
✅ **Flexible**: Can scrape any social platform

### Cons:
❌ **Expensive**: $500-2000/month for decent volume  
❌ **Complex**: Requires proxy management  
❌ **Overkill**: Probably more than you need

### Cost Estimate:
- **Starter**: $500/month (limited requests)
- **Business**: $2000+/month (unlimited)

---

## Recommendation: **Apify Twitter Scraper**

### Why Apify?
1. **Best balance**: Cost-effective, scalable, reliable
2. **Easy integration**: Simple API calls from your enrichment service
3. **Flexible**: Can search by keyword, hashtag, account, or combination
4. **No RSS feeds needed**: Direct API integration
5. **Real-time**: Query on-demand when games happen

### Implementation Plan:

#### Phase 1: Set Up Apify
1. Sign up for Apify account (free tier available)
2. Get API token
3. Test with one game to verify it works

#### Phase 2: Integrate with Enrichment Service
1. Add Apify client to `perspectives-enrichment`
2. Create function: `getTwitterPostsForGame(game)`
3. Query Apify when enriching content for games
4. Store tweets in Firestore with same structure as articles

#### Phase 3: Query Strategy
```javascript
// When enriching a game:
async function enrichGame(game) {
  // 1. Get articles (existing RSS feeds)
  const articles = await getRSSItemsForGame(game);
  
  // 2. Get Twitter posts (NEW - Apify)
  const tweets = await getTwitterPostsForGame(game);
  
  // 3. Store both in Firestore
  await storeContent(articles, tweets, game);
}

// Search query examples:
// "Browns Bills" OR "#BrownsVsBills" OR "#BUFvsCLE"
// Filter: last 24 hours, exclude retweets
```

#### Phase 4: Cost Optimization
- **Cache results**: Don't query same game multiple times
- **Batch queries**: Query multiple games in one API call if possible
- **Time windows**: Only query games happening today/tomorrow
- **Limit results**: Get top 50 tweets, not all tweets

---

## Alternative: Start with Reddit + Account-Based Twitter

If you want to **start free** and add Apify later:

### Phase 1 (Free):
1. Use existing Reddit feeds (already working)
2. Expand Twitter profile scraping to include:
   - Team accounts (@Browns, @BuffaloBills)
   - League accounts (@NFL, @NBA)
   - Reporter accounts (@AdamSchefter, @wojespn)
   - Player accounts (if public)
3. Match posts to games by:
   - Team mentions in post text
   - Time proximity to game

### Phase 2 (Add Apify):
1. Add Apify for hashtag/keyword searches
2. Use Reddit + Account-based as fallback
3. Gradually increase Apify usage as budget allows

---

## Cost Comparison

| Solution | Setup Cost | Monthly Cost | Scalability | Real-time |
|---------|------------|--------------|-------------|-----------|
| **Apify** | Free | $15-75 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Twitter API** | Free | $100-5000 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **RSS.app** | Free | $0-50 | ⭐⭐ | ⭐⭐ |
| **Reddit + Accounts** | Free | $0 | ⭐⭐⭐ | ⭐⭐⭐ |
| **Bright Data** | Free | $500-2000 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## Next Steps

1. **Decide on approach**: Apify vs. Reddit + Accounts vs. Hybrid
2. **Set up account**: Sign up for Apify (or Twitter API if preferred)
3. **Test integration**: Build small test to verify it works
4. **Integrate with enrichment**: Add to `perspectives-enrichment` service
5. **Monitor costs**: Track API usage and optimize queries

---

## Questions to Answer

1. **Budget**: How much can you spend per month on social media APIs?
   - $0 → Reddit + Account-based Twitter
   - $15-75 → Apify (recommended)
   - $100+ → Twitter API v2

2. **Coverage**: How important is fan content vs. official accounts?
   - Fan content important → Apify/Twitter API (keyword search)
   - Official accounts enough → Reddit + Account scraping

3. **Real-time**: How quickly do you need social posts?
   - Within 15 minutes → Apify/Twitter API
   - Within 1 hour → Reddit + Account scraping

4. **Scale**: How many games per day?
   - < 20 games → Reddit + Accounts might be enough
   - 20-50 games → Apify recommended
   - 50+ games → Apify or Twitter API

---

## Recommendation Summary

**Start with Apify Twitter Scraper** because:
- ✅ Best balance of cost, scalability, and reliability
- ✅ Easy to integrate with your existing enrichment service
- ✅ Can query on-demand for any game/hashtag
- ✅ No need to create RSS feeds manually
- ✅ Can start small and scale up

**Fallback option**: Use Reddit + Account-based Twitter scraping if budget is tight, then add Apify later.

Let me know which approach you prefer and I'll help you implement it!

