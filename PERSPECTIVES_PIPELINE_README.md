# Perspectives Pipeline

Backend data pipeline that transforms league-wide content into game-specific Perspectives bundles.

## Overview

The pipeline:
1. Loads keywords from CSV (teams, players, coaches)
2. Fetches content from RSS feeds, rss-feed-service, and manual social posts
3. Matches content to games using keyword matching
4. Writes Perspectives artifacts to Firestore

## Keyword Source Format

Keywords can be provided from either:
- **Google Sheets** (recommended - easy to update)
- **Local CSV file** (faster, but requires redeployment to update)

### Format

Create a CSV where:
- **Each column** = one team
- **Column header** = full team name
- **Rows** = keywords (city, nickname, players, coaches)

Example:
```csv
Chicago Blackhawks,St Louis Blues
Chicago,St Louis
Blackhawks,Blues
Connor Bedard,Jordan Kyrou
Nick Foligno,Brayden Schenn
Luke Richardson,Craig Berube
```

### Option 1: Google Sheets (Recommended)

1. Create a Google Sheet with your keywords
2. File → Share → Publish to web
3. Select the sheet/tab
4. Choose "CSV" format
5. Copy the URL

**URL Format:**
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?gid=0&format=csv
```

### Option 2: Local CSV File

Save your keywords CSV file (e.g., `nhl-keywords.csv`) in the project directory.

## Usage

### 2. Run Pipeline

**Via API endpoint (Google Sheets) - NHL Example:**
```bash
curl -X POST https://flashlive-scraper-124291936014.us-central1.run.app/perspectives/runPipeline \
  -H "Content-Type: application/json" \
  -d '{
    "league": "NHL",
    "keywordSource": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyIIgOCR5htCszBylkLxwx41MSrVZ61t_xw9FmzVSTi7tiFSS9-cQObaRPuQQi9WgzC4uRIhV1il6C/pub?gid=0&single=true&output=csv"
  }'
```

**Via API endpoint (Local CSV):**
```bash
curl -X POST https://flashlive-scraper-124291936014.us-central1.run.app/perspectives/runPipeline \
  -H "Content-Type: application/json" \
  -d '{
    "league": "NHL",
    "keywordSource": "./nhl-keywords.csv"
  }'
```

**Or integrate into existing scraper:**
```javascript
import { runPerspectivesPipeline } from './perspectives-pipeline.js';

// In your morning refresh handler
await runPerspectivesPipeline({
  league: 'NHL',
  keywordSource: 'https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?gid=0&format=csv'
  // Or use local file: keywordSource: './nhl-keywords.csv'
});
```

## Content Sources

### RSS Feeds (fetchMethod: 'rss')
Direct RSS/Atom XML feeds:
- RSS.app feeds
- Public XML feeds

### RSS Feed Service (fetchMethod: 'rss-service')
Your rss-feed-service JSON endpoints:
- Scraped content
- YouTube API responses

## Output

Perspectives are written to Firestore at:
```
artifacts/flashlive-daily-scraper/public/data/sportsGames/{gameId}
```

Structure:
```json
{
  "perspectives": {
    "news": [...],
    "social": [...],
    "videos": [...]
  }
}
```

## Matching Logic

Content matches a game if:
1. **Both teams detected** in content, OR
2. **Proximity match**: Both teams within 50 words + relevance score ≥ 4

Relevance scoring:
- Title match: +3
- Description match: +2
- Body match: +1
- Requires score ≥ 4

## Manual Social Posts

Manual social posts from `perspectives-admin` are automatically included in the pipeline.

## Scheduling

Add to your Cloud Scheduler or existing cron job:

```bash
# Run after morning game refresh
gcloud scheduler jobs create http perspectives-nhl \
  --schedule="0 8 * * *" \
  --uri="https://flashlive-scraper-124291936014.us-central1.run.app/perspectives/runPipeline" \
  --http-method=POST \
  --message-body='{"league":"NHL","keywordSource":"https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?gid=0&format=csv"}'
```

