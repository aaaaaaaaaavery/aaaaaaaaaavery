# Perspectives System - Phase 1 Complete ✅

## What We Built

### 1. **Firestore Schema** (`perspectives-core.js`)
Games now support a `social` field structure:
```javascript
{
  social: {
    posts: {
      automated: {
        x: [...],
        mastodon: [...],
        youtube: [...],
        rss: [...]
      },
      manual: [
        {
          id: "x_1234567890",
          platform: "x",
          url: "https://twitter.com/...",
          sourceType: "fan",
          addedBy: "admin",
          addedAt: "2025-12-23T...",
          priority: 100,
          tags: ["manual"],
          notes: "First angle replay"
        }
      ]
    }
  }
}
```

### 2. **Source Registry** (`perspectives-config.js`)
- League-level sources (NHL, NFL, NBA, MLB, WNBA, NWSL, MLS, NCAA)
- Team-level sources (St. Louis Blues, Dallas Stars - extensible)
- Platform detection and ID extraction helpers
- Function to get all sources for a specific game

### 3. **Core Functions** (`perspectives-core.js`)
- `addManualPost()` - Add manual posts to games
- `getGameSocialPosts()` - Get merged, deduplicated, sorted posts
- `matchPostToGames()` - Match posts to games by team names/time
- `addAutomatedPost()` - Add automated posts (for Phase 2)
- `ensureGameSocialStructure()` - Initialize social structure on games

### 4. **API Endpoints** (`index.js`)
- `POST /perspectives/addManualPost` - Add manual post
- `GET /perspectives/getGameSocialPosts` - Get all posts for a game
- `POST /perspectives/matchPost` - Match post to games (for automation)

### 5. **Admin UI** (`perspectives-admin.html`)
- Simple HTML form to add manual posts
- Auto-detects platform from URL
- Priority selection (Viral/Highlight/Normal/Low)
- Source type selection (Fan/Official/Media)
- Optional notes field

## How to Use

### Adding a Manual Post (Admin UI)
1. Open `perspectives-admin.html` in a browser
2. Enter Game ID (from Firestore)
3. Paste social post URL (X/Twitter, YouTube, Mastodon)
4. Select priority and source type
5. Click "Add to Game"

### Adding a Manual Post (API)
```bash
curl -X POST https://us-central1-flashlive-daily-scraper.cloudfunctions.net/thporth-live-games/perspectives/addManualPost \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "1234567890",
    "url": "https://twitter.com/espn/status/2003285202634756243",
    "priority": 100,
    "sourceType": "fan",
    "notes": "Viral highlight"
  }'
```

### Getting Posts for a Game
```bash
curl "https://us-central1-flashlive-daily-scraper.cloudfunctions.net/thporth-live-games/perspectives/getGameSocialPosts?gameId=1234567890"
```

## What's Next (Phase 2)

1. **RSS Polling Function** - Poll RSS.app feeds every 1-2 minutes during live games
2. **RSS Parser** - Extract post IDs from RSS items
3. **Post Matching** - Automatically match posts to games
4. **Deduplication** - Prevent duplicates across automated + manual

## Files Created

- `perspectives-config.js` - Source registry and helpers
- `perspectives-core.js` - Core Firestore operations
- `perspectives-admin.html` - Admin UI for manual posts
- `PERSPECTIVES-PHASE1-COMPLETE.md` - This file

## Files Modified

- `index.js` - Added Perspectives API endpoints

## Testing

To test the manual post addition:
1. Find a game ID from Firestore (e.g., from a live game)
2. Open `perspectives-admin.html`
3. Add a test post
4. Verify it appears in Firestore under `games/{gameId}/social/posts/manual`

## Notes

- Manual posts override automated posts (same ID)
- Posts are sorted by priority (desc), then recency (desc)
- Platform detection works for X/Twitter, YouTube, Mastodon, Instagram
- Source registry is extensible - add more teams/leagues as needed

