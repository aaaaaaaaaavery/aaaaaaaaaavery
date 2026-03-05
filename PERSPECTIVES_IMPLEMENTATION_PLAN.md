# Perspectives System Implementation Plan

## Overview
Build a multi-level content aggregation system where users can drill down from Home → League → Game → Team → Player, with all associated content (news, social, videos) automatically matched and displayed.

## Architecture

### 1. **Enrichment Service** (`perspectives-enrichment/`)
- Processes RSS feeds and extracts entities (teams, players, leagues)
- Matches content to games using team names and time proximity
- Stores enriched content in Firestore with perspective tags

### 2. **Perspectives API** (`perspectives-api/`)
- REST API endpoints to query content by perspective
- Fast queries using Firestore indexes
- Supports filtering by content type, time range, sorting

### 3. **Frontend Integration** (in `index (1).html`)
- Add click handlers to game tiles → open Game Perspective
- Add click handlers to team names → open Team Perspective
- Display content panels (News | Social | Videos) for each perspective

## Implementation Steps

### Phase 1: Core Enrichment (Week 1)
1. ✅ Create enrichment service structure
2. Build team name dictionary from existing `TEAM_DISPLAY_MAP`
3. Implement entity extraction (teams, leagues)
4. Implement game matching logic
5. Test with sample RSS feeds

### Phase 2: Storage & API (Week 2)
1. ✅ Create Firestore collection structure
2. ✅ Build Perspectives API endpoints
3. Set up Firestore indexes for fast queries
4. Test API endpoints

### Phase 3: Frontend Integration (Week 3)
1. Add "Open Game" modal/panel to game tiles
2. Create content display components (News/Social/Videos tabs)
3. Add navigation breadcrumbs
4. Style perspective views

### Phase 4: Enhancement (Week 4+)
1. Add player extraction
2. Improve matching accuracy with fuzzy matching
3. Add content deduplication
4. Add ranking/scoring system
5. Add real-time updates via WebSockets

## Data Flow

```
RSS Feeds → Enrichment Service → Firestore (perspectives/content)
                                           ↓
                                    Perspectives API
                                           ↓
                                    Frontend (index.html)
```

## Firestore Structure

### Collection: `perspectives/content`
Each document:
```javascript
{
  id: "newsnow-nfl_12345",
  title: "Browns vs Bills Preview",
  description: "...",
  link: "https://...",
  source: "newsnow-nfl",
  contentType: "article",
  publishedAt: Timestamp,
  
  // Extracted entities
  teams: ["CLE", "BUF"],
  leagues: ["NFL"],
  players: [],
  
  // Game matches
  gameMatches: [
    { gameId: "game-123", score: 0.95 }
  ],
  
  // Indexed fields for querying
  indexedTeams: ["CLE", "BUF"],
  indexedLeagues: ["NFL"],
  indexedGameIds: ["game-123"],
  indexedContentType: "article",
  indexedPublishedAt: Timestamp
}
```

## API Endpoints

- `GET /perspective/home` - All content
- `GET /perspective/league/:leagueId` - League content
- `GET /perspective/game/:gameId` - Game content
- `GET /perspective/team/:teamId` - Team content
- `GET /perspective/player/:playerId` - Player content

Query params:
- `contentType` - Filter by type (article/video/social)
- `limit` - Number of results (default: 50)
- `sortBy` - Sort field (publishedAt/matchScore)
- `timeRange` - Time filter (today/week/month)

## Next Steps

1. **Expand team dictionary** - Add all teams from your existing mappings
2. **Set up enrichment cron job** - Run every 15 minutes to process new RSS items
3. **Deploy Perspectives API** - Cloud Run service
4. **Build frontend components** - Game/Team/Player perspective views
5. **Add player extraction** - Use spaCy or similar for NER

## Files Created

- `perspectives-enrichment/index.js` - Enrichment service
- `perspectives-enrichment/package.json` - Dependencies
- `perspectives-api/index.js` - API service
- `perspectives-api/package.json` - Dependencies
- `PERSPECTIVES_IMPLEMENTATION_PLAN.md` - This file


