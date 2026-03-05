# GCP Cost Analysis - $19 to $69 Increase

## Problem Identified

**Main Cost Driver: `live-polling` scheduler job**

The `live-polling` job runs **every 2 minutes** and:
1. Fetches games for **50+ leagues** from ESPN API
2. Fetches **7 days** of data for each league
3. Makes **hundreds of API calls** per run
4. Writes/reads from Firestore on every run

## Cost Calculation

### Per Poll (Every 2 Minutes):
- **50+ leagues** × **7 days** = **350+ ESPN API calls**
- Firestore reads: ~50-100 (checking existing games)
- Firestore writes: ~100-500 (updating game data)

### Daily Cost:
- Polls per day: **720 polls** (every 2 minutes = 30/hour × 24 hours)
- ESPN API calls per day: **720 × 350 = 252,000 calls/day** (if all leagues have games)
- Firestore reads per day: **720 × 75 = 54,000 reads/day**
- Firestore writes per day: **720 × 300 = 216,000 writes/day**

### Why Costs Increased:
1. **Testing shadow.html** - If you're actively using it, real-time Firestore listeners (`.onSnapshot()`) create additional reads on every document change
2. **Both index.html and shadow.html** - If both are open, you're doubling Firestore reads
3. **Live polling every 2 minutes** - This is the BIGGEST cost driver

## Solutions

### Option 1: Reduce Polling Frequency (RECOMMENDED)
Change `live-polling` from every 2 minutes to every 5-10 minutes:

```bash
gcloud scheduler jobs update live-polling \
  --schedule="*/5 * * * *" \
  --location=us-central1
```

This reduces costs by **60-80%**.

### Option 2: Only Poll Active Leagues
Modify `pollESPNLiveData` to only fetch leagues that have games today (skip off-season leagues).

### Option 3: Reduce Days Fetched
Change from 7 days to 3 days for non-live polls.

### Option 4: Pause During Off-Hours
Only poll during active hours (7 AM - 11 PM):

```bash
gcloud scheduler jobs update live-polling \
  --schedule="*/2 7-23 * * *" \
  --location=us-central1
```

### Option 5: Pause Live Polling Temporarily
```bash
gcloud scheduler jobs pause live-polling --location=us-central1
```

## Immediate Action

**PAUSE THE LIVE POLLING JOB NOW:**
```bash
gcloud scheduler jobs pause live-polling --location=us-central1 --project=flashlive-daily-scraper
```

This will stop the cost bleeding immediately while you decide on a permanent solution.

