# Perspectives Pipeline - Next Steps

## ✅ What's Done

1. **Pipeline Code**: `perspectives-pipeline.js` - Complete
2. **Feed Config**: `perspectives-feed-config.js` - All RSS feeds configured
3. **API Endpoint**: `/perspectives/runPipeline` - Added to `index.js`
4. **Manual Social Posts**: Automatically included from Firestore

## 📋 What's Next

### 1. Create CSV Keyword Files

You need to create CSV files with team keywords. Format:
- Each **column** = one team
- Column **header** = full team name
- **Rows** = keywords (city, nickname, players, coaches)

**Example `nhl-keywords.csv`:**
```csv
Chicago Blackhawks,St Louis Blues,Pittsburgh Penguins
Chicago,St Louis,Pittsburgh
Blackhawks,Blues,Penguins
Connor Bedard,Jordan Kyrou,Sidney Crosby
Nick Foligno,Brayden Schenn,Evgeni Malkin
Luke Richardson,Craig Berube,Mike Sullivan
```

**Save location options:**

**Option A: Include in Docker image (Simplest)**
- Save CSV files in project root: `nhl-keywords.csv`, `nfl-keywords.csv`, etc.
- They'll be included in the Docker image automatically
- Use path: `./nhl-keywords.csv`

**Option B: Google Sheets (Like your standings)**
- Create a Google Sheet with the same format
- Publish as CSV
- We can modify the pipeline to fetch from Google Sheets URL (like `import-team-keywords.js` does)

**Option C: Cloud Storage**
- Upload CSV files to Cloud Storage
- Modify pipeline to fetch from `gs://bucket/file.csv`

**Recommendation**: Start with Option A for testing, then switch to Option B if you prefer managing keywords in Google Sheets.

### 2. Test the Pipeline

**Option A: Test via API endpoint**

```bash
curl -X POST https://flashlive-scraper-124291936014.us-central1.run.app/perspectives/runPipeline \
  -H "Content-Type: application/json" \
  -d '{
    "league": "NHL",
    "csvPath": "./nhl-keywords.csv"
  }'
```

**Option B: Test locally**

```bash
# Make sure CSV file exists
ls nhl-keywords.csv

# Test import function
node -e "import('./perspectives-pipeline.js').then(m => console.log('Module loaded'))"
```

**Option C: Add to morning refresh**

Add to your `morningRefresh` handler in `index.js`:

```javascript
import { runPerspectivesPipeline } from './perspectives-pipeline.js';

// After fetching games
await runPerspectivesPipeline({
  league: 'NHL',
  csvPath: './nhl-keywords.csv'
});
```

### 3. Handle CSV Paths in Cloud Run

If using file paths, ensure CSV files are copied into the Docker image:

```dockerfile
# In Dockerfile
COPY nhl-keywords.csv ./
COPY nfl-keywords.csv ./
# etc.
```

Or modify the pipeline to fetch from Google Sheets (easier for updates).

### 4. Set Up Scheduling

Once tested, add to Cloud Scheduler:

```bash
# Run after morning game refresh (e.g., 8 AM)
gcloud scheduler jobs create http perspectives-nhl \
  --schedule="0 8 * * *" \
  --uri="https://flashlive-scraper-124291936014.us-central1.run.app/perspectives/runPipeline" \
  --http-method=POST \
  --message-body='{"league":"NHL","csvPath":"./nhl-keywords.csv"}' \
  --time-zone="America/New_York"
```

Repeat for each league you want to process.

### 5. Verify Output

Check Firestore after running:

```
artifacts/flashlive-daily-scraper/public/data/sportsGames/{gameId}
```

Should contain:
```json
{
  "perspectives": {
    "news": [...],
    "social": [...],
    "videos": [...]
  }
}
```

## 🚀 Quick Start

1. **Test NHL pipeline** with the provided Google Sheets URL:
   ```bash
   ./test-perspectives-nhl.sh
   ```
   Or manually:
   ```bash
   curl -X POST https://flashlive-scraper-124291936014.us-central1.run.app/perspectives/runPipeline \
     -H "Content-Type: application/json" \
     -d '{
       "league": "NHL",
       "keywordSource": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyIIgOCR5htCszBylkLxwx41MSrVZ61t_xw9FmzVSTi7tiFSS9-cQObaRPuQQi9WgzC4uRIhV1il6C/pub?gid=0&single=true&output=csv"
     }'
   ```
2. **Check Firestore output** at `artifacts/flashlive-daily-scraper/public/data/sportsGames/{gameId}`
3. **Create Google Sheets** for other leagues (NFL, NBA, MLB, etc.)
4. **Set up Cloud Scheduler** for automated runs

## 💡 Recommendations

- **Start small**: Test with one league (NHL or NFL)
- **Use Google Sheets**: Easier to manage and update keywords
- **Run after games refresh**: Schedule pipeline after morning game data fetch
- **Monitor logs**: Check Cloud Run logs for errors

## ❓ Questions?

- CSV format unclear? See `PERSPECTIVES_PIPELINE_README.md`
- Need to fetch from Google Sheets? We can modify the pipeline
- Want to test with a specific league? Let me know which one

