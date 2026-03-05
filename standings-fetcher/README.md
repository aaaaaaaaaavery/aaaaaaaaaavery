# Standings Fetcher Service

This service fetches standings from SportsData.io API and caches them in Firestore.

## Features

- Fetches standings for NBA, NFL, MLB, and WNBA
- Caches data in Firestore (reduces API calls)
- Runs on Google Cloud Run
- Scheduled updates via Cloud Scheduler

## API Calls Per Day

With daily updates:
- NBA: 1 call/day
- NFL: 1 call/day
- MLB: 1 call/day
- WNBA: 1 call/day

**Total: 4 calls/day = 0.4% of free tier (1000 calls/day)**

## Setup

### 1. Get SportsData.io API Key

1. Go to https://sportsdata.io/
2. Sign up for free account
3. Get API key from dashboard
4. Free tier includes 1000 calls/day

### 2. Deploy to Cloud Run

```bash
cd standings-fetcher

# Build and deploy
gcloud run deploy standings-fetcher \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=flashlive-daily-scraper,SPORTSDATA_API_KEY=your_api_key_here
```

### 3. Set up Cloud Scheduler

```bash
# Create a daily job at 6 AM Eastern
gcloud scheduler jobs create http update-standings-daily \
  --schedule="0 6 * * *" \
  --time-zone="America/New_York" \
  --uri="https://standings-fetcher-YOUR_PROJECT_ID.us-central1.run.app/updateStandings" \
  --http-method=POST \
  --location=us-central1
```

### 4. Manual Trigger (for testing)

```bash
curl -X POST https://standings-fetcher-YOUR_PROJECT_ID.us-central1.run.app/updateStandings
```

## Usage on Website

```javascript
// Load NBA standings from Firestore (cached)
async function loadNBAStandings() {
  const standingsRef = db.collection('standings').doc('NBA');
  const doc = await standingsRef.get();
  
  if (doc.exists) {
    const standings = doc.data();
    console.log('Last updated:', standings.lastUpdated);
    
    // Display standings
    standings.data.forEach(team => {
      console.log(`${team.Rank}. ${team.Team} (${team.Wins}-${team.Losses})`);
    });
  }
}
```

## Data Structure

Each league's document in Firestore contains:

```javascript
{
  data: [
    {
      Rank: 1,
      Team: "Boston Celtics",
      Conference: "Eastern",
      Wins: 45,
      Losses: 20,
      Percentage: "0.692",
      GamesBack: 0,
      // ... more fields
    },
    // ... more teams
  ],
  lastUpdated: Timestamp,
  season: "2025",
  league: "NBA"
}
```

## Adding More Leagues

To add more leagues (NHL, NCAA, etc.), add new functions in `index.js`:

```javascript
async function fetchNHLStandings() {
  const response = await fetch(
    `https://api.sportsdata.io/v3/nhl/scores/json/Standings/2025`,
    { headers: { 'Ocp-Apim-Subscription-Key': SPORTSDATA_API_KEY } }
  );
  // ... format and store
}

// Add to fetchAllStandingsHandler:
results.leagues.NHL = await fetchNHLStandings();
```

## Cost Estimate

- **SportsData.io**: Free (under 1000 calls/day)
- **Cloud Run**: ~$1-2/month (minimal usage)
- **Cloud Scheduler**: ~$0.10/month
- **Firestore**: Free (under quotas)

**Total: ~$1-2/month**

## Monitoring

Check logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=standings-fetcher" --limit=50
```

## Next Steps

1. Add more leagues (NHL, NCAA Basketball, etc.)
2. Add update frequency options (2x/day, 3x/day during playoffs)
3. Create standings display page on website
4. Add Google Sheets export functionality

