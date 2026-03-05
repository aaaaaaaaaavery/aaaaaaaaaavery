# Perspectives System - Complete Process Explanation

## The Big Picture

You want users to be able to drill down from a high-level view (all sports) to specific games, teams, or players, and see all related content (news, social posts, videos) automatically matched and displayed.

## Current State vs. Desired State

### Current State:
- Games are displayed on league pages
- News/Social/Videos are shown in separate columns
- No connection between a game and its related content
- Content is generic (all NFL news, not "Browns vs Bills" specific)

### Desired State:
- Click on a game → See all content about that specific game
- Click on a team → See all content about that team
- Click on a player → See all content about that player
- Content is automatically matched using keywords/entities

---

## The Complete Process Flow

### Step 1: Content Ingestion (Already Working)
**What happens:**
- Your RSS feed service scrapes news articles from various sources
- YouTube playlists/channels provide videos
- Social feeds provide tweets/posts
- All this content flows into your RSS feed service

**Current output:** Raw RSS feeds with titles, descriptions, links, dates

---

### Step 2: Content Enrichment (NEW - We'll Build This)
**What happens:**
- A background service (enrichment worker) processes each RSS item
- It reads the title and description
- It extracts:
  - **Team names** (e.g., "Browns", "Bills", "Cleveland Browns")
  - **League names** (e.g., "NFL", "NBA")
  - **Player names** (future: "Baker Mayfield", "Josh Allen")
  - **Game phrases** (e.g., "Browns vs Bills", "Browns at Bills")

**How it works:**
1. Text normalization: Convert to lowercase, remove special characters
2. Team matching: Check against your existing `TEAM_DISPLAY_MAP` dictionary
3. League matching: Check against league keywords
4. Game matching: If both teams found, query Firestore for games with those teams
5. Time proximity: Boost match score if content is published near game time

**Output:** Enriched content with tags:
```javascript
{
  title: "Browns vs Bills Preview",
  link: "https://...",
  teams: ["CLE", "BUF"],
  leagues: ["NFL"],
  gameMatches: [
    { gameId: "game-123", score: 0.95 }
  ]
}
```

---

### Step 3: Storage in Firestore (NEW)
**What happens:**
- Enriched content is stored in a new Firestore collection: `perspectives/content`
- Each document has indexed fields for fast querying:
  - `indexedTeams: ["CLE", "BUF"]` - for team queries
  - `indexedLeagues: ["NFL"]` - for league queries
  - `indexedGameIds: ["game-123"]` - for game queries
  - `indexedContentType: "article"` - for filtering (article/video/social)
  - `indexedPublishedAt: Timestamp` - for sorting by date

**Why indexed fields?**
- Firestore requires specific field structure for queries
- We can't query arrays directly, so we use `array-contains` queries
- This allows fast queries like "get all content where teams includes CLE"

---

### Step 4: Perspectives API (NEW - We'll Build This)
**What happens:**
- A REST API service provides endpoints to query content by perspective
- Endpoints:
  - `GET /perspective/home` - All content (global)
  - `GET /perspective/league/NFL` - All NFL content
  - `GET /perspective/game/game-123` - All content for a specific game
  - `GET /perspective/team/CLE` - All content about Cleveland Browns
  - `GET /perspective/player/baker-mayfield` - All content about a player

**How queries work:**
1. Frontend calls API: `GET /perspective/game/game-123?contentType=article&limit=20`
2. API queries Firestore: `WHERE indexedGameIds CONTAINS "game-123" AND indexedContentType == "article"`
3. API returns JSON with content array
4. Frontend displays content in tabs (News | Social | Videos)

---

### Step 5: Frontend Integration (NEW - We'll Add This)
**What happens:**
- When user clicks on a game tile, open a modal/panel
- Modal shows:
  - Game header (teams, score, time, TV info)
  - Tabs: **News** | **Social** | **Videos** | **All**
  - Each tab calls the Perspectives API with appropriate filters
  - Content is displayed in a feed format

**Example flow:**
1. User clicks "Browns vs Bills" game tile
2. JavaScript extracts `gameId` from the game data
3. Makes API call: `fetch('/perspective/game/${gameId}?contentType=article')`
4. Receives array of articles
5. Displays articles in "News" tab
6. User clicks "Videos" tab → API call with `contentType=video`
7. Displays videos in "Videos" tab

---

## Technical Architecture

```
┌─────────────────┐
│  RSS Feeds      │  (Your existing RSS feed service)
│  YouTube        │
│  Social Media   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Enrichment      │  (NEW: perspectives-enrichment/)
│ Service         │  - Extracts teams, leagues, players
│                 │  - Matches to games
│                 │  - Runs every 15 minutes (cron job)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Firestore       │  (NEW: perspectives/content collection)
│ Storage         │  - Stores enriched content
│                 │  - Indexed for fast queries
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Perspectives    │  (NEW: perspectives-api/)
│ API             │  - REST endpoints
│                 │  - Queries Firestore
│                 │  - Returns JSON
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend        │  (index.html)
│ (Your Site)     │  - Game tiles with click handlers
│                 │  - Modal/panel for perspectives
│                 │  - Content display components
└─────────────────┘
```

---

## Data Flow Example: "Browns vs Bills" Game

### 1. Game exists in Firestore:
```javascript
{
  "Game ID": "game-123",
  "Home Team": "Buffalo Bills",
  "Away Team": "Cleveland Browns",
  "League": "NFL",
  "Start Time": "2025-12-03T20:00:00Z"
}
```

### 2. RSS article published:
```
Title: "Browns vs Bills: Key Matchups to Watch"
Description: "The Cleveland Browns travel to Buffalo to face the Bills..."
```

### 3. Enrichment service processes it:
- Extracts: `teams: ["CLE", "BUF"]`
- Matches to game: `gameId: "game-123"` (both teams found + time proximity)
- Stores in Firestore with `indexedGameIds: ["game-123"]`

### 4. User clicks game tile:
- Frontend calls: `GET /perspective/game/game-123`
- API queries: `WHERE indexedGameIds CONTAINS "game-123"`
- Returns article (and any other content matched to this game)

### 5. User sees:
- Game header with teams, score, time
- News tab: Shows the article
- Videos tab: Shows any videos mentioning both teams
- Social tab: Shows tweets/posts about the game

---

## Matching Logic Details

### Team Matching:
- Uses your existing `TEAM_DISPLAY_MAP` to build a dictionary
- Normalizes text: "Cleveland Browns" → "cleveland browns"
- Checks variations: "Browns", "Cleveland Browns", "CLE"
- Returns team codes: `["CLE", "BUF"]`

### Game Matching:
- If 2+ teams found in content → potential game match
- Query Firestore for games with those teams
- Check time proximity (within 48 hours of game time)
- Calculate match score (higher = more confident)
- Only store matches with score > 0.5

### League Matching:
- Simple keyword matching: "NFL", "NBA", etc.
- Helps filter content by league perspective

---

## What We'll Build (In Order)

### Phase 1: Enrichment Service
1. Build team dictionary from your `TEAM_DISPLAY_MAP`
2. Create entity extraction functions
3. Create game matching logic
4. Create Firestore storage function
5. Test with sample RSS items

### Phase 2: API Service
1. Create Express API server
2. Build query functions for each perspective
3. Set up Firestore indexes
4. Test API endpoints

### Phase 3: Frontend Integration
1. Add click handlers to game tiles
2. Create modal/panel component
3. Create content display tabs
4. Style the perspective views
5. Add navigation breadcrumbs

### Phase 4: Automation
1. Set up cron job to run enrichment every 15 minutes
2. Deploy API to Cloud Run (or run locally)
3. Monitor and tune matching accuracy

---

## Key Decisions & Considerations

### 1. Where to run enrichment?
- **Option A:** Cloud Run Job (runs on schedule, costs per execution)
- **Option B:** Local cron job (free, runs on your machine)
- **Recommendation:** Start with local cron, move to Cloud Run if needed

### 2. How often to enrich?
- **Recommendation:** Every 15 minutes (same as RSS refresh)
- Keeps content fresh without overloading

### 3. How to handle matching errors?
- Store match confidence scores
- Allow manual review/adjustment later
- Start with high-confidence matches only (score > 0.7)

### 4. How to handle duplicates?
- Hash content (title + description) to detect duplicates
- Keep highest-authority source
- Group duplicates under same `canonicalId`

### 5. How to scale?
- Firestore handles queries well up to millions of documents
- Use pagination for large result sets
- Cache popular queries (Home, top games)

---

## Example User Journey

1. **User visits Home page**
   - Sees all games today
   - Sees global news/social/videos

2. **User clicks "NFL" league**
   - Sees only NFL games
   - Sees NFL-specific news/social/videos

3. **User clicks "Browns vs Bills" game**
   - Modal opens showing:
     - Game header (teams, score, time, TV)
     - News tab: 5 articles about this game
     - Videos tab: 3 highlight videos
     - Social tab: 12 tweets about the game
     - All tab: Combined view

4. **User clicks "Cleveland Browns" team name**
   - Navigates to Team perspective
   - Sees all Browns content (not just this game)
   - Sees upcoming Browns games
   - Sees Browns players (clickable)

5. **User clicks "Baker Mayfield" player**
   - Navigates to Player perspective
   - Sees all Baker Mayfield content
   - Sees his stats, highlights, news

---

## Success Metrics

- **Matching Accuracy:** >85% of game matches should be correct
- **Content Coverage:** Each game should have at least 3-5 items (news/social/videos)
- **Query Performance:** API responses <500ms
- **User Engagement:** Users click into game perspectives regularly

---

## Next Steps

1. **Review this explanation** - Does this match your vision?
2. **Confirm approach** - Any changes needed?
3. **Start building** - Begin with enrichment service
4. **Test incrementally** - Test each piece before moving forward

---

## Questions to Consider

1. **Do you want this to work with existing RSS feeds immediately?**
   - Yes → We'll process your current RSS feeds
   - No → We'll set up new feeds first

2. **How important is player matching?**
   - High → We'll prioritize player extraction
   - Low → We'll focus on games/teams first

3. **Do you want real-time updates?**
   - Yes → WebSockets/SSE for live updates
   - No → Polling every 30 seconds is fine

4. **Where should the API run?**
   - Cloud Run → More scalable, costs money
   - Local → Free, but requires your machine running

Let me know if this makes sense and if you want to proceed!


