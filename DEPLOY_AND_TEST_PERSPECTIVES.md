# Deploy and Test Perspectives Pipeline

## 1. Deploy to Cloud Run

**Option A: Direct deploy (may timeout on first build):**
```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX && gcloud run deploy flashlive-scraper --source=. --allow-unauthenticated --region=us-central1 --project=flashlive-daily-scraper --set-env-vars=SPREADSHEET_ID=1vSHd7VQzFjTeZhIbWGJHsU_Mbz5OOYvkPHyVU0auzWw,SHEET_NAME=Sheet1,FIREBASE_PROJECT_ID=flashlive-daily-scraper,RAPIDAPI_KEY=1c6421f9acmshe820d0c9faf1cf5p165f88jsnc42711af762d,RAPIDAPI_HOST=flashlive-sports.p.rapidapi.com --timeout=3600
```

**Option B: Use Cloud Build (recommended for first build):**
```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX && gcloud builds submit --config=cloudbuild.yaml --project=flashlive-daily-scraper
```

## 2. Manual Trigger (Test the Pipeline)

**Test NHL Perspectives Pipeline:**

```bash
curl -X POST https://flashlive-scraper-124291936014.us-central1.run.app/perspectives/runPipeline \
  -H "Content-Type: application/json" \
  -d '{
    "league": "NHL",
    "keywordSource": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyIIgOCR5htCszBylkLxwx41MSrVZ61t_xw9FmzVSTi7tiFSS9-cQObaRPuQQi9WgzC4uRIhV1il6C/pub?gid=0&single=true&output=csv"
  }'
```

**Or use the test script:**

```bash
./test-perspectives-nhl.sh
```

## 3. Check Logs

```bash
gcloud run logs read flashlive-scraper --region=us-central1 --project=flashlive-daily-scraper --limit=50
```

## 4. Test Other Leagues

Replace `"league": "NHL"` and `keywordSource` with your league's Google Sheets URL:

```bash
curl -X POST https://flashlive-scraper-124291936014.us-central1.run.app/perspectives/runPipeline \
  -H "Content-Type: application/json" \
  -d '{
    "league": "NFL",
    "keywordSource": "YOUR_NFL_GOOGLE_SHEETS_CSV_URL"
  }'
```

