# Quick Start Guide - Standings Fetcher

## What This Does

Automatically fetches sports standings daily and caches them so your website loads instantly without hitting API limits.

## Step 1: Get SportsData.io API Key (5 minutes)

1. Go to https://sportsdata.io/
2. Click "Sign Up" (top right)
3. Choose **FREE** plan (1000 calls/day)
4. Verify email
5. Go to Dashboard → API Keys
6. Copy your API key (looks like: `a1b2c3d4e5f6g7h8i9j0`)

## Step 2: Deploy Service (2 minutes)

```bash
cd /Users/avery/Downloads/THPORTHIndex/standings-fetcher

# Deploy with your API key
./deploy.sh YOUR_API_KEY_HERE
```

Example:
```bash
./deploy.sh a1b2c3d4e5f6g7h8i9j0
```

## Step 3: Set Up Daily Updates (1 minute)

Run this command to update standings every day at 6 AM Eastern:

```bash
gcloud scheduler jobs create http update-standings-daily \
  --schedule="0 6 * * *" \
  --time-zone="America/New_York" \
  --uri="https://standings-fetcher-124291936014.us-central1.run.app/updateStandings" \
  --http-method=POST \
  --location=us-central1
```

## Step 4: Test It! (30 seconds)

Trigger a manual update:

```bash
curl -X POST https://standings-fetcher-124291936014.us-central1.run.app/updateStandings
```

You should see:
```json
{
  "message": "Standings updated successfully",
  "totalApiCalls": 4,
  "results": { ... }
}
```

## Step 5: Check Firestore (30 seconds)

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select `flashlive-daily-scraper` project
3. Click "Firestore Database" in left menu
4. You should see a `standings` collection with documents: `NBA`, `NFL`, `MLB`, `WNBA`

## Step 6: Display on Website (Optional)

Add this to your `index (1).html` to display standings:

```javascript
// Load NBA standings from cached data
async function loadNBAStandings() {
  const doc = await db.collection('standings').doc('NBA').get();
  const standings = doc.data().data;
  
  standings.forEach(team => {
    console.log(`${team.Rank}. ${team.Team} ${team.Wins}-${team.Losses}`);
  });
}
```

## What Happens Now?

✅ Every day at 6 AM Eastern, standings automatically update
✅ Only 4 API calls per day (0.4% of your limit!)
✅ Your website loads standings instantly from cache
✅ All site visitors see the same cached data (no extra API calls)

## Costs

- **SportsData.io**: FREE (under 1000 calls/day)
- **Cloud Run**: ~$1-2/month
- **Total**: ~$1-2/month

## Troubleshooting

### Check if service is running:
```bash
curl https://standings-fetcher-124291936014.us-central1.run.app/
```
Should return: "Standings Fetcher Service is running"

### Check logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=standings-fetcher" --limit=20
```

### Force update now:
```bash
curl -X POST https://standings-fetcher-124291936014.us-central1.run.app/updateStandings
```

## Next Steps

1. **Add more leagues**: Edit `index.js` to add NHL, NCAA, etc.
2. **Update more frequently**: Change schedule to `"0 6,18 * * *"` for twice daily (6 AM and 6 PM)
3. **Add to your website**: Use the `example-display.html` as a template
4. **Export to Google Sheets**: We can add this functionality next!

## Need Help?

- **API Key issues**: Check https://sportsdata.io/members/my-account/api-keys
- **Deployment issues**: Make sure you're in the `standings-fetcher` directory
- **Data not showing**: Check Firestore console to verify data was written

