# Sports Standings Scraper

## Overview
This scraper fetches current standings data from ESPN's API and stores it in Firestore for display on your website.

## NFL Standings

### Usage
```bash
node scrape-nfl-standings.js
```

This will:
1. Fetch current NFL standings from ESPN's API
2. Clear the `NFLStandings` Firestore collection
3. Save the updated standings with the following data for each team:
   - Team name
   - Conference (AFC/NFC)
   - Division
   - Wins, Losses, Ties
   - Win Percentage
   - Points For, Points Against, Point Differential
   - Current Streak
   - Home/Road/Division/Conference Records
   - Last updated timestamp

### Automation
To keep standings updated automatically, you can:

1. **Run manually** whenever you want fresh data
2. **Set up a cron job** (Mac/Linux):
   ```bash
   # Edit crontab
   crontab -e
   
   # Add this line to run daily at 6 AM
   0 6 * * * cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX && node scrape-nfl-standings.js
   ```

3. **Deploy as Cloud Function** (runs on schedule):
   - Similar to your existing Cloud Functions
   - Can run multiple times per day during season

## Adding Other Sports

ESPN provides similar APIs for other sports. Here are the endpoints:

### NBA Standings
```javascript
const ESPN_NBA_API = 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings';
```

### MLB Standings
```javascript
const ESPN_MLB_API = 'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings';
```

### NHL Standings
```javascript
const ESPN_NHL_API = 'https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings';
```

### College Football (FBS)
```javascript
const ESPN_NCAAF_API = 'https://site.api.espn.com/apis/v2/sports/football/college-football/standings';
```

### Soccer Leagues
```javascript
// Premier League
const ESPN_EPL_API = 'https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings';

// La Liga
const ESPN_LALIGA_API = 'https://site.api.espn.com/apis/v2/sports/soccer/esp.1/standings';

// Bundesliga
const ESPN_BUNDESLIGA_API = 'https://site.api.espn.com/apis/v2/sports/soccer/ger.1/standings';

// Serie A
const ESPN_SERIEA_API = 'https://site.api.espn.com/apis/v2/sports/soccer/ita.1/standings';

// Ligue 1
const ESPN_LIGUE1_API = 'https://site.api.espn.com/apis/v2/sports/soccer/fra.1/standings';

// MLS
const ESPN_MLS_API = 'https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings';
```

### To Create a New Scraper:

1. **Copy the NFL scraper**:
   ```bash
   cp scrape-nfl-standings.js scrape-nba-standings.js
   ```

2. **Update the API endpoint**:
   ```javascript
   const ESPN_NBA_API = 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings';
   ```

3. **Inspect the stat indices** (they differ by sport):
   ```bash
   curl -s "API_URL" | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(JSON.stringify(data.children[0].standings.entries[0].stats.map((s, i) => ({index: i, name: s.name, value: s.displayValue})), null, 2));"
   ```

4. **Update stat indices** based on the inspection

5. **Change Firestore collection name**:
   ```javascript
   const collectionRef = db.collection('NBAStandings');
   ```

## Data Structure

Each team document in Firestore contains:
```javascript
{
  Team: "Indianapolis Colts",
  Conference: "American Football Conference",
  Division: "AFC South",
  Wins: "6",
  Losses: "1",
  Ties: "0",
  WinPercentage: ".857",
  PointsFor: "232",
  PointsAgainst: "140",
  PointsDiff: "+92",
  Streak: "W3",
  HomeRecord: "4-0",
  RoadRecord: "2-1",
  DivisionRecord: "1-0",
  ConferenceRecord: "5-0",
  lastUpdated: "2025-10-22T12:34:56.789Z"
}
```

## Notes

- The scraper clears and replaces all standings data each time it runs
- Firestore collection names: `NFLStandings`, `NBAStandings`, `MLBStandings`, etc.
- Each team is stored as a document with the team name (spaces replaced with underscores) as the document ID
- The `lastUpdated` timestamp helps you know when the data was last refreshed
- ESPN's API is publicly accessible but may have rate limits - don't run too frequently

## Troubleshooting

1. **No data returned**: Check if ESPN changed their API structure
2. **Wrong stats**: Inspect the API response to verify stat indices haven't changed
3. **Firestore errors**: Ensure your service account has write permissions
4. **Network errors**: ESPN's API may be temporarily unavailable

## Future Enhancements

- Add error handling/retry logic
- Add notifications when scraper fails
- Create a master scraper that runs all sports
- Add data validation before saving to Firestore
- Cache results to avoid duplicate saves if data hasn't changed

