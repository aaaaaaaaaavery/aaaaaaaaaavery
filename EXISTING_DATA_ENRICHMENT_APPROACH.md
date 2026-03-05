# Using Your Existing Data for Perspectives - Detailed Plan

## The Smart Approach: Use What You Already Have!

You're absolutely right - you're already collecting tons of data (RSS feeds, YouTube videos, social posts). Instead of adding external APIs, we can **search/match your existing data** to games right now!

---

## How Your Current System Works

### Current Data Flow:
1. **RSS Feed Service** (`rss-feed-service/`)
   - Scrapes websites or proxies RSS feeds
   - Generates RSS XML on the fly
   - Caches in memory (NodeCache, 15-minute TTL)
   - Serves RSS feeds at: `/feeds/{sourceId}.xml`

2. **Frontend** (`index.html`)
   - Fetches RSS feeds via URLs
   - Parses RSS XML client-side
   - Displays articles/videos/social posts in columns

3. **Data You're Already Collecting:**
   - **News articles**: ~100+ RSS feeds (ESPN, CBS, Yahoo, etc.)
   - **YouTube videos**: Playlist feeds (NFL, NBA, etc.)
   - **Social posts**: Reddit feeds, Twitter profile scrapes
   - **All with**: Titles, descriptions, links, dates, thumbnails

---

## Option 1: Search Your Existing RSS Data (RECOMMENDED FOR NOW)

### How It Works:

#### Step 1: Enrichment Service Reads Your RSS Feeds
Instead of creating new data sources, the enrichment service:
1. **Fetches all your RSS feeds** (or reads from cache)
2. **Parses RSS XML** to extract items
3. **Extracts text** from titles + descriptions
4. **Matches team names** to games
5. **Stores matched content** in Firestore

#### Step 2: Matching Logic
For each RSS item:
```javascript
// Example RSS item:
{
  title: "Cowboys vs. Lions: Three must-know storylines for Thursday's Week 14 prime-time game",
  description: "The Dallas Cowboys host the Detroit Lions...",
  link: "https://...",
  date: "2025-12-04T06:22:00Z"
}

// Matching process:
1. Extract text: "Cowboys vs. Lions: Three must-know storylines..."
2. Find teams: ["DAL", "DET"] (using TEAM_DISPLAY_MAP)
3. Query Firestore: Find games with teams ["DAL", "DET"] on Dec 4, 2025
4. Match found: gameId = "game-123"
5. Store in Firestore with indexedGameIds: ["game-123"]
```

#### Step 3: Query by Game
When user clicks "Cowboys vs Lions":
- API queries: `WHERE indexedGameIds CONTAINS "game-123"`
- Returns: All articles, videos, social posts that matched this game
- Frontend displays in tabs: News | Social | Videos

---

## Implementation Details

### 1. Enrichment Service Architecture

```javascript
// perspectives-enrichment/index.js

// Step 1: Get list of all RSS feeds
const RSS_FEED_SERVICE_URL = 'https://rss-feed-service-124291936014.us-central1.run.app';

async function getAllRSSFeeds() {
  // Option A: Get list from your RSS service (if you add an endpoint)
  // Option B: Hardcode list of feed IDs from NEWS_SOURCES
  // Option C: Read from a config file
  
  return [
    'espn-nfl',
    'cbs-nfl',
    'yahoo-nfl',
    'nfl-com',
    // ... all your feed IDs
  ];
}

// Step 2: Fetch and parse each RSS feed
async function fetchRSSFeed(feedId) {
  const url = `${RSS_FEED_SERVICE_URL}/feeds/${feedId}.xml`;
  const response = await fetch(url);
  const xml = await response.text();
  
  // Parse RSS XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = doc.querySelectorAll('item');
  
  const articles = [];
  items.forEach(item => {
    articles.push({
      title: item.querySelector('title')?.textContent || '',
      description: item.querySelector('description')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
      date: item.querySelector('pubDate')?.textContent || '',
      source: feedId,
      contentType: 'article' // or 'video', 'social'
    });
  });
  
  return articles;
}

// Step 3: Extract teams from text
function extractTeams(text) {
  const normalized = text.toLowerCase();
  const foundTeams = [];
  
  // Check against TEAM_DISPLAY_MAP
  for (const [code, names] of Object.entries(TEAM_DISPLAY_MAP)) {
    for (const name of names) {
      if (normalized.includes(name.toLowerCase())) {
        foundTeams.push(code);
        break; // Found this team, move to next
      }
    }
  }
  
  return foundTeams;
}

// Step 4: Match to games
async function matchToGames(article, teams) {
  if (teams.length < 1) return []; // Need at least one team
  
  const db = admin.firestore();
  const articleDate = new Date(article.date);
  
  // Query games with these teams, within 48 hours
  const startTime = new Date(articleDate.getTime() - 48 * 60 * 60 * 1000);
  const endTime = new Date(articleDate.getTime() + 48 * 60 * 60 * 1000);
  
  let query = db.collection('games')
    .where('Start Time', '>=', admin.firestore.Timestamp.fromDate(startTime))
    .where('Start Time', '<=', admin.firestore.Timestamp.fromDate(endTime));
  
  const games = await query.get();
  
  const matches = [];
  games.forEach(doc => {
    const game = doc.data();
    const homeTeam = game['Home Team'];
    const awayTeam = game['Away Team'];
    
    // Check if article mentions both teams (for game-specific content)
    const homeCode = getTeamCode(homeTeam);
    const awayCode = getTeamCode(awayTeam);
    
    if (teams.includes(homeCode) && teams.includes(awayCode)) {
      // Both teams found = high confidence game match
      matches.push({
        gameId: doc.id,
        score: 0.9, // High confidence
        matchType: 'game'
      });
    } else if (teams.includes(homeCode) || teams.includes(awayCode)) {
      // One team found = team match (lower confidence for game)
      matches.push({
        gameId: doc.id,
        score: 0.5, // Lower confidence
        matchType: 'team'
      });
    }
  });
  
  return matches;
}

// Step 5: Store in Firestore
async function storeEnrichedContent(article, teams, gameMatches) {
  const db = admin.firestore();
  
  // Create content document
  const contentDoc = {
    title: article.title,
    description: article.description,
    link: article.link,
    publishedAt: admin.firestore.Timestamp.fromDate(new Date(article.date)),
    source: article.source,
    contentType: article.contentType,
    
    // Indexed fields for querying
    indexedTeams: teams, // ["DAL", "DET"]
    indexedLeagues: extractLeagues(article.title + ' ' + article.description),
    indexedGameIds: gameMatches.map(m => m.gameId), // ["game-123"]
    indexedContentType: article.contentType,
    
    // Metadata
    matchScores: gameMatches, // [{gameId: "game-123", score: 0.9}]
    extractedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  // Use link as document ID (or hash) to avoid duplicates
  const docId = hashContent(article.link);
  await db.collection('perspectives/content').doc(docId).set(contentDoc);
}
```

### 2. Processing Flow

```javascript
// Main enrichment function
async function enrichAllFeeds() {
  console.log('Starting enrichment...');
  
  // 1. Get all RSS feed IDs
  const feedIds = await getAllRSSFeeds();
  console.log(`Processing ${feedIds.length} feeds...`);
  
  // 2. Process each feed
  for (const feedId of feedIds) {
    try {
      console.log(`Processing feed: ${feedId}`);
      
      // Fetch RSS feed
      const articles = await fetchRSSFeed(feedId);
      console.log(`  Found ${articles.length} items`);
      
      // Process each article
      for (const article of articles) {
        // Extract teams
        const text = article.title + ' ' + article.description;
        const teams = extractTeams(text);
        
        if (teams.length > 0) {
          // Match to games
          const gameMatches = await matchToGames(article, teams);
          
          // Store in Firestore
          await storeEnrichedContent(article, teams, gameMatches);
          
          console.log(`  Matched: ${article.title.substring(0, 50)}... → ${gameMatches.length} games`);
        }
      }
    } catch (error) {
      console.error(`Error processing feed ${feedId}:`, error);
    }
  }
  
  console.log('Enrichment complete!');
}
```

### 3. Content Type Detection

```javascript
function detectContentType(feedId, article) {
  // Check feed ID patterns
  if (feedId.includes('youtube') || feedId.includes('video')) {
    return 'video';
  }
  
  if (feedId.includes('reddit') || feedId.includes('twitter') || feedId.includes('x-')) {
    return 'social';
  }
  
  // Default to article
  return 'article';
}
```

---

## Option 2: Reddit + Account-Based Twitter (Detailed)

### How It Works:

#### Part A: Reddit Feeds (Already Working)
You already have Reddit feeds via RSS.app:
- `reddit-cfb` - College football subreddit
- `reddit-nwsl` - NWSL subreddit
- `reddit-ligue1` - Ligue 1 subreddit
- etc.

**How to use them:**
1. **Process Reddit RSS feeds** same as news articles
2. **Extract post titles** (Reddit post titles are usually descriptive)
3. **Match to games** using team name extraction
4. **Store as `contentType: 'social'`**

**Example:**
```
Reddit post: "Cowboys vs Lions game thread"
→ Extract teams: ["DAL", "DET"]
→ Match to game: game-123
→ Store in Firestore
```

#### Part B: Twitter Account Scraping (You Already Have This!)
You have `x-twitter-rss.js` that can scrape Twitter profiles:
- `/x/profile/:username.xml` - Scrapes a Twitter profile

**How to use it:**
1. **Create list of team/player accounts:**
```javascript
const TWITTER_ACCOUNTS = {
  'NFL': [
    '@NFL',
    '@NFLonFOX',
    '@ESPNNFL',
    '@CBSSportsNFL'
  ],
  'DAL': [
    '@dallascowboys',
    '@dallascowboysPR'
  ],
  'DET': [
    '@Lions',
    '@LionsPR'
  ],
  // ... more teams
};
```

2. **Scrape accounts every 15 minutes:**
```javascript
async function scrapeTwitterAccounts() {
  for (const [teamCode, accounts] of Object.entries(TWITTER_ACCOUNTS)) {
    for (const account of accounts) {
      // Use your existing Twitter scraper
      const feedUrl = `${RSS_FEED_SERVICE_URL}/x/profile/${account.replace('@', '')}.xml`;
      const posts = await fetchRSSFeed(feedUrl);
      
      // Process posts same as articles
      for (const post of posts) {
        const teams = extractTeams(post.title + ' ' + post.description);
        const gameMatches = await matchToGames(post, teams);
        await storeEnrichedContent({
          ...post,
          contentType: 'social',
          source: `twitter-${account}`
        }, teams, gameMatches);
      }
    }
  }
}
```

3. **Match posts to games:**
- Extract teams from post text
- Match by time proximity (within 48 hours of game)
- Store with `contentType: 'social'`

**Limitations:**
- ❌ Only gets posts from specific accounts (not fan content)
- ❌ Misses tweets from random users
- ❌ Requires maintaining account list
- ✅ Free (no API costs)
- ✅ Works with your existing scraper

---

## Comparison: Existing Data vs. Apify

| Feature | Existing Data | Apify |
|---------|--------------|-------|
| **Cost** | $0 | $15-75/month |
| **Coverage** | Your RSS feeds only | All Twitter posts |
| **Fan Content** | Limited (Reddit only) | Yes (all Twitter) |
| **Setup Time** | 1-2 days | 1 day |
| **Maintenance** | Low (feeds already working) | Low (API handles it) |
| **Scalability** | Good (100+ feeds) | Excellent (unlimited) |

---

## Recommended Approach: Start with Existing Data, Add Apify Later

### Phase 1: Use Existing Data (Now)
1. **Build enrichment service** to process your RSS feeds
2. **Match articles/videos/social** to games using keyword extraction
3. **Store in Firestore** with indexed fields
4. **Build API** to query by game/team/league
5. **Add frontend** to display perspectives

**Result:** You get Perspectives working with your existing data, $0 cost

### Phase 2: Add Apify (Later, if needed)
1. **Add Apify integration** to enrichment service
2. **Query Apify** for game-specific hashtags
3. **Merge results** with existing data
4. **Filter duplicates** (same content from multiple sources)

**Result:** More comprehensive social coverage, especially fan content

---

## Implementation Plan

### Step 1: Modify RSS Feed Service (Optional)
Add an endpoint to list all feeds:
```javascript
// rss-feed-service/index.js
app.get('/feeds/list', (req, res) => {
  const feedIds = Object.keys(NEWS_SOURCES);
  res.json({ feeds: feedIds });
});
```

### Step 2: Build Enrichment Service
1. Create `perspectives-enrichment/index.js`
2. Add functions to:
   - Fetch RSS feeds
   - Parse RSS XML
   - Extract teams
   - Match to games
   - Store in Firestore
3. Run every 15 minutes (cron job)

### Step 3: Build API Service
1. Create `perspectives-api/index.js`
2. Add endpoints:
   - `/perspective/game/:gameId`
   - `/perspective/team/:teamCode`
   - `/perspective/league/:league`
3. Query Firestore and return JSON

### Step 4: Frontend Integration
1. Add click handlers to game tiles
2. Create modal/panel for perspectives
3. Call API and display content

---

## Example: "Cowboys vs Lions" Game

### Current State:
- Game exists in Firestore: `game-123`
- RSS feeds have articles about this game
- YouTube has highlight videos
- Reddit has game threads

### After Enrichment:
1. **Enrichment service processes RSS feeds:**
   - Finds article: "Cowboys vs. Lions: Three must-know storylines..."
   - Extracts teams: ["DAL", "DET"]
   - Matches to game: `game-123`
   - Stores in Firestore

2. **User clicks "Cowboys vs Lions" game:**
   - Frontend calls: `GET /perspective/game/game-123`
   - API queries Firestore: `WHERE indexedGameIds CONTAINS "game-123"`
   - Returns:
     - 5 articles (from ESPN, CBS, Yahoo, etc.)
     - 3 videos (from YouTube playlists)
     - 12 social posts (from Reddit, Twitter accounts)

3. **User sees:**
   - News tab: 5 articles
   - Videos tab: 3 videos
   - Social tab: 12 posts
   - All tab: Combined view

---

## Next Steps

1. **Confirm approach**: Use existing data first?
2. **Start building**: Enrichment service to process RSS feeds
3. **Test matching**: Verify team extraction works correctly
4. **Add API**: Build query endpoints
5. **Frontend**: Add perspectives UI

This approach gets you working Perspectives **today** with $0 cost, using data you're already collecting!

