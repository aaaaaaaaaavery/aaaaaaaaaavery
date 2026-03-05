# Complete Top 25 Rankings Setup Process

## Overview
This guide walks you through the complete process to get Top 25 rankings working for NCAAM and NCAAW games.

## Prerequisites
- Your Google Sheet has alias mappings set up (Column A: League, Column B: Display Name, Columns C+: Variations)
- You have access to the terminal/command line
- You have gcloud CLI installed (for deployment)

---

## Step 1: Load Alias Mappings to Firestore

**Purpose**: Load your team alias mappings from Google Sheets into Firestore so the system can use them.

```bash
# From the project root directory
node load-supplemental-team-mappings.cjs
```

**Expected Output**:
```
Loading supplemental team name mappings from Google Sheets...
✅ Loaded supplemental mappings for 1 leagues - NCAAM: 36 unique team mappings
Storing supplemental mappings in Firestore...
✅ Stored mappings for 1 leagues in Firestore
✅ Supplemental team mappings loaded and stored successfully!
```

**What This Does**:
- Reads your Google Sheet at: https://docs.google.com/spreadsheets/d/1DiKJ1Hz1GZJ652pi74xKEY9Szm_p41IEPbfxFyQyTys/edit
- Processes all rows to create bidirectional alias mappings
- Stores them in Firestore at: `artifacts/flashlive-daily-scraper/public/data/supplementalTeamMappings`

**⚠️ Important**: Run this every time you update your Google Sheet!

---

## Step 2: Scrape Top 25 Rankings

**Purpose**: Fetch the latest Top 25 rankings from the NCAA API and store them in Firestore.

### For NCAAM (Men's Basketball):
```bash
node scrape-ncaam-standings.cjs
```

### For NCAAW (Women's Basketball):
```bash
node scrape-ncaaw-standings.cjs
```

**Expected Output**:
```
📊 Saving Top 25 rankings to Firestore...
✅ Successfully saved 25 Top 25 rankings for NCAAM
```

**What This Does**:
- Fetches Top 25 rankings from NCAA API
- Stores them in Firestore collections:
  - `NCAAMStandings` (for men's)
  - `NCAAWStandings` (for women's)
- Each document has: `Team`, `Top25Rank`, `Top25Points`, `Top25Previous`

**⚠️ Important**: Run this regularly (daily) to keep rankings up to date!

---

## Step 3: Deploy Channel Lookup Function

**Purpose**: Deploy the updated function that includes Top 25 ranking sync.

### Option A: Deploy to Cloud Functions (Production)

```bash
# Navigate to the channel-lookup-deploy directory
cd channel-lookup-deploy

# Make sure deploy.sh is executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

**OR manually deploy**:
```bash
cd channel-lookup-deploy

gcloud functions deploy channel-lookup \
  --gen2 \
  --region=us-central1 \
  --runtime=nodejs20 \
  --entry-point=channelLookupHandler \
  --trigger-http \
  --allow-unauthenticated \
  --source=. \
  --memory=512Mi \
  --timeout=540s \
  --max-instances=10
```

**Expected Output**:
```
🚀 Deploying Channel Lookup to Cloud Functions (Gen2)...
✅ Deployment successful!

📋 Function URL:
   https://us-central1-flashlive-daily-scraper.cloudfunctions.net/channel-lookup
```

### Option B: Test Locally (Development)

If you want to test locally first, you can run the function directly:

```bash
cd channel-lookup-deploy

# Install dependencies (if not already done)
npm install

# Run locally (you'll need to set up a local test script)
# Or use Firebase emulator
```

---

## Step 4: Trigger the Function

**Purpose**: Run the function to sync Top 25 rankings to games.

### If Deployed to Cloud Functions:
```bash
curl -X POST https://us-central1-flashlive-daily-scraper.cloudfunctions.net/channel-lookup
```

### Expected Console Output:
```
🔄 Syncing Top 25 rankings for NCAAM...
  📋 Alias mappings loaded for NCAAM: 36 entries (sample: Florida St., Florida State, Florida St, ...)
  🧪 Testing alias lookup:
    "Florida State" → 3 variations: Florida State, Florida St., Florida St
    "Florida St." → 3 variations: Florida St., Florida State, Florida St
    "Florida" → 1 variations: Florida
  📊 Ranking #19: "Florida State" → stored under 3 variations: Florida State, Florida St., Florida St
✅ Loaded 25 Top 25 rankings for NCAAM
Found 150 games for NCAAM
  ✅ Matched away: "Florida St." → variation "Florida St." → normalized "florida st" → rank 19
✅ Updated 45 games with Top 25 rankings for NCAAM

🔄 Syncing Top 25 rankings for NCAAW...
...
```

**What This Does**:
1. Loads alias mappings from Firestore
2. Loads Top 25 rankings from `NCAAMStandings` and `NCAAWStandings` collections
3. Stores rankings under ALL alias variations (e.g., "Florida State" ranking stored under "florida state", "florida st", "florida st.")
4. Matches game teams to rankings using alias variations
5. Updates games in Firestore with `Home Team Ranking` and `Away Team Ranking` fields

---

## Step 5: Verify in Firestore

**Purpose**: Confirm rankings are attached to games.

1. Go to Firebase Console: https://console.firebase.google.com/
2. Navigate to Firestore Database
3. Go to collection: `artifacts/flashlive-daily-scraper/public/data/sportsGames`
4. Find a game with a ranked team (e.g., search for "Florida St.")
5. Check that the document has:
   - `Away Team Ranking`: 19 (or null)
   - `Home Team Ranking`: 19 (or null)
   - `Away Team Rank`: 19 (or null)
   - `Home Team Rank`: 19 (or null)

**Example**:
- Game: "Florida St. vs Syracuse"
- Should have: `Away Team Ranking: 19` (if Florida St. is ranked 19th)

---

## Step 6: Check Frontend

**Purpose**: Verify rankings display on your site.

1. Open your site: `index (1).html`
2. Navigate to a game with ranked teams
3. Verify rankings appear next to team names

**If rankings don't appear**:
- Check browser console for errors
- Verify Firestore has the ranking fields (Step 5)
- Check that `index (1).html` is reading from the correct Firestore collection

---

## Troubleshooting

### Issue: Rankings Not Matching

**Check**:
1. Are alias mappings loaded? (Step 1)
2. Are rankings scraped? (Step 2)
3. Check console logs from Step 4 - look for:
   - "No alias mappings found" → Run Step 1 again
   - "No rankings found" → Run Step 2 again
   - "No match" messages → Check alias mappings in Google Sheet

### Issue: Florida St. Not Getting Ranking

**Check**:
1. In Google Sheet, is "Florida St." in the same row as "Florida State"?
2. Run Step 1 again to reload mappings
3. Check console logs - does it show variations for "Florida St."?
4. Check if ranking exists in `NCAAMStandings` collection for "Florida State"

### Issue: Function Deployment Fails

**Check**:
1. Are you in the `channel-lookup-deploy` directory?
2. Do you have `service-account-key.json` in that directory?
3. Are dependencies installed? (`npm install`)
4. Check gcloud authentication: `gcloud auth list`

---

## Daily Workflow

Once set up, your daily workflow should be:

1. **Morning**: Run Step 2 (scrape rankings) - can be automated with cron/scheduler
2. **After games are scraped**: Run Step 4 (trigger function) - can be automated
3. **When updating aliases**: Run Step 1 (reload mappings)

---

## Automation (Optional)

### Set Up Cloud Scheduler for Daily Rankings Scrape

```bash
# Scrape NCAAM rankings daily at 6 AM ET
gcloud scheduler jobs create http scrape-ncaam-rankings \
  --schedule="0 6 * * *" \
  --time-zone="America/New_York" \
  --uri="YOUR_FUNCTION_URL_FOR_SCRAPING" \
  --http-method=POST \
  --location=us-central1

# Scrape NCAAW rankings daily at 6 AM ET
gcloud scheduler jobs create http scrape-ncaaw-rankings \
  --schedule="0 6 * * *" \
  --time-zone="America/New_York" \
  --uri="YOUR_FUNCTION_URL_FOR_SCRAPING" \
  --http-method=POST \
  --location=us-central1
```

### Set Up Cloud Scheduler for Channel Lookup + Ranking Sync

```bash
# Run channel lookup + ranking sync daily at 7 AM ET (after rankings are scraped)
gcloud scheduler jobs create http channel-lookup-daily \
  --schedule="0 7 * * *" \
  --time-zone="America/New_York" \
  --uri="https://us-central1-flashlive-daily-scraper.cloudfunctions.net/channel-lookup" \
  --http-method=POST \
  --location=us-central1
```

---

## Quick Reference

```bash
# 1. Load alias mappings
node load-supplemental-team-mappings.cjs

# 2. Scrape rankings
node scrape-ncaam-standings.cjs
node scrape-ncaaw-standings.cjs

# 3. Deploy function (first time or after changes)
cd channel-lookup-deploy
./deploy.sh

# 4. Trigger function
curl -X POST https://us-central1-flashlive-daily-scraper.cloudfunctions.net/channel-lookup
```

---

## Summary

The complete process is:
1. ✅ Load alias mappings → Firestore
2. ✅ Scrape Top 25 rankings → Firestore
3. ✅ Deploy channel-lookup function (includes ranking sync)
4. ✅ Trigger function → Syncs rankings to games
5. ✅ Verify in Firestore
6. ✅ Check frontend

That's it! Rankings should now appear on your site.
