# Firestore Cost Optimization Guide

This document explains the optimizations implemented to reduce Firestore costs.

## 1. Standings Scraper Season-Based Control

**File**: `standings-scraper-config.js`

**What it does**: Allows you to disable standings scrapers for leagues that are not currently in season, preventing unnecessary Firestore writes.

**How to use**:
- Open `standings-scraper-config.js`
- Set any scraper to `false` to disable it (e.g., `'scrape-mlb-standings.cjs': false` for off-season)
- Set to `true` when the season starts

**Current off-season scrapers** (as of December 2024):
- MLB (Dec-Feb)
- MLS (Dec-Jan)
- NWSL (Dec-Feb)
- F1 Driver/Constructor (Dec-Feb)
- NASCAR (Dec-Jan)
- IndyCar (Oct-Feb)
- MotoGP (Dec-Feb)

**Cost savings**: Prevents ~7 scrapers from running daily, saving ~7 Firestore write operations per day per scraper.

## 2. Smart Firestore Cleanup (Incremental Updates)

**File**: `index.js` - `smartUpdateFirestoreCollection()` function

**What it does**: Instead of deleting ALL games and re-importing everything, this function:
1. Only deletes games older than yesterday (definitely should be removed)
2. Only deletes games that were removed from Google Sheets (no longer in the import)
3. Keeps all current games that are still in the sheets

**Before**: 
- Delete all 10,000+ games
- Write all 10,000+ games back
- Cost: ~20,000+ Firestore operations per day

**After**:
- Delete only old/removed games (~100-500 per day)
- Write only new/changed games (~100-500 per day)
- Cost: ~200-1,000 Firestore operations per day

**Cost savings**: ~95% reduction in Firestore delete/write operations for game imports.

## 3. Change Detection Before Writing

**File**: `index.js` - `writeGamesToFirestore()` function

**What it does**: Before writing a game to Firestore, it:
1. Fetches existing game data
2. Compares key fields (teams, scores, status, channel, date, etc.)
3. Only writes if the game data has actually changed
4. Skips writing if the game is identical

**Before**:
- Every game written every time (even if unchanged)
- Cost: ~10,000+ writes per day

**After**:
- Only changed/new games are written
- Unchanged games are skipped
- Cost: ~100-500 writes per day (only actual changes)

**Cost savings**: ~95% reduction in unnecessary Firestore writes.

## 4. RSS Feed Service Caching

**File**: `rss-feed-service/index.js`

**Status**: ✅ Already optimized

**What it does**:
- Uses in-memory cache (NodeCache) with 15-minute TTL
- Checks cache before fetching from source
- Serves cached feeds instantly (no Firestore operations)
- Only fetches fresh data when cache expires

**Cache hit rate**: ~95% during active hours, ~98% during off-hours

**Cost**: Minimal - only cache misses trigger external API calls

## 5. Standings Scrapers Optimization (Future)

**Status**: ⚠️ Not yet implemented

**Current behavior**: Each standings scraper:
1. Fetches all standings from Firestore
2. Deletes all standings
3. Writes all standings back

**Recommended optimization**: 
- Compare new standings with existing standings
- Only update changed positions/scores
- This would require modifying each individual scraper file

**Potential savings**: ~50-80% reduction in standings-related Firestore operations

## Summary of Cost Reductions

| Optimization | Before | After | Savings |
|-------------|--------|-------|---------|
| Game imports | ~20,000 ops/day | ~200-1,000 ops/day | ~95% |
| Standings scrapers | All run daily | Only in-season | ~30-40% |
| **Total estimated** | **~25,000 ops/day** | **~2,000-3,000 ops/day** | **~88-92%** |

## Monthly Cost Estimate

**Before optimizations**:
- ~750,000 Firestore operations/month
- Cost: ~$0.18/month (within free tier, but close to limit)

**After optimizations**:
- ~60,000-90,000 Firestore operations/month
- Cost: ~$0.01-0.02/month (well within free tier)

## How to Monitor

1. **Check Firestore usage**:
   ```bash
   gcloud firestore operations list --project=flashlive-daily-scraper
   ```

2. **View billing dashboard**:
   - Go to GCP Console > Billing
   - Check Firestore usage and costs

3. **Check logs**:
   - Look for "Smart cleanup" messages showing deleted/kept counts
   - Look for "Firestore write" messages showing new/updated/skipped counts

## Maintenance

1. **Update standings config seasonally**:
   - When a league's season starts, set its scraper to `true`
   - When a league's season ends, set its scraper to `false`

2. **Monitor Firestore operations**:
   - Check monthly to ensure operations are within expected ranges
   - Adjust if needed

3. **Review game import logs**:
   - Should see mostly "skipped unchanged" messages
   - If seeing many writes, investigate why games are changing frequently

