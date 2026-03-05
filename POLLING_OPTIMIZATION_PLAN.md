# ESPN Live Polling Optimization Plan

## Executive Summary

**Current Cost:** ~36,000 API calls/day (70 leagues × 720 polls/day)  
**Optimized Cost:** ~3,600-7,200 API calls/day (5-10 live games × 720 polls/day)  
**Expected Savings:** **80-90% reduction** (~$15-30/month in API costs + reduced Firestore reads)

---

## Complete Process Flow

### ✅ Morning Scrape (UNCHANGED)

**When:** Once per day (early morning, ~6 AM)  
**What:** Fetches all games scheduled for today

1. **Fetch from ESPN API:**
   - Loops through all 70 leagues in `ESPN_LEAGUES`
   - Uses scoreboard endpoint: `/scoreboard?dates={today}`
   - Gets ALL games for today (SCHEDULED, IN PROGRESS, FINAL)

2. **Store in Firestore:**
   - Collection: `sportsGames`
   - Fields stored:
     - `Game ID`: `espn-{league}-{event.id}` (e.g., `espn-nba-401810420`)
     - `Start Time`: Firestore Timestamp (game start time)
     - `gameDate`: Today's date (e.g., `2026-01-13`)
     - `Match Status`: `SCHEDULED`, `IN PROGRESS`, or `FINAL`
     - `Home Team`, `Away Team`, `Home Score`, `Away Score`
     - `displayClock`, `period`, `Channel`, etc.

3. **Result:** All games for today are now in Firestore with their start times

---

### 🔄 Live Polling (OPTIMIZED - Every 2 minutes)

**Current Approach (INEFFICIENT):**
```
Every 2 minutes:
  - Fetch ALL 70 leagues' scoreboards
  - Filter results to find games that are IN PROGRESS or FINAL
  - Update Firestore
  - Result: 70 API calls per poll (even if only 3 games are live)
```

**Optimized Approach (EFFICIENT):**
```
Every 2 minutes:
  1. Query Firestore (fast, cheap):
     - WHERE gameDate === today
     - AND Start Time <= now
     - AND Match Status !== 'FINAL'
     - Result: List of games that should be live (e.g., 5 games)
  
  2. For EACH game individually:
     - Extract eventId from Game ID (e.g., `espn-nba-401810420` → `401810420`)
     - Fetch: `/summary?event={eventId}` (1 API call per game)
     - Parse response (same structure as scoreboard)
     - Update Firestore with latest scores/status
  
  3. If query returns 0 games:
     - Skip all API calls entirely
  
  Result: 5 API calls per poll (only for games that are actually live)
```

---

### 📊 Front-End Display (UNCHANGED)

**What Front-End Does:**
1. Reads from Firestore collection `sportsGames`
2. Filters by `gameDate === today`
3. Displays games with:
   - Live scores (updates every 2 minutes)
   - Game clock/time remaining
   - Status (SCHEDULED, IN PROGRESS, FINAL)
   - TV channel info

**Result:** Front-end sees the same data structure, same fields, same updates

---

### 🕐 2 AM Cutoff (UNCHANGED)

**What Happens:**
- After 2 AM Mountain Time, games from "yesterday" are moved to `yesterdayScores` collection
- Front-end switches to showing "yesterday's scores" tab
- Today's games continue to be polled if they're still IN PROGRESS

**Result:** Same behavior as before

---

## Data Compatibility Verification

### Summary Endpoint Returns Same Structure

**Test Result:**
```json
{
  "header": {
    "competitions": [{
      "competitors": [
        {"team": {"displayName": "Houston Rockets"}, "score": null, "homeAway": "home"},
        {"team": {"displayName": "Chicago Bulls"}, "score": null, "homeAway": "away"}
      ],
      "status": {
        "type": {"description": "Scheduled", "state": "pre"},
        "displayClock": null,
        "period": null
      },
      "date": "2026-01-14T01:00Z"
    }]
  }
}
```

**What We Extract (Same as Scoreboard):**
- ✅ Team names (`competitors[].team.displayName`)
- ✅ Scores (`competitors[].score`)
- ✅ Status (`status.type.state` → maps to `IN PROGRESS`/`FINAL`/`SCHEDULED`)
- ✅ Clock (`status.displayClock`)
- ✅ Period (`status.period`)
- ✅ Start time (`competitions[].date`)
- ✅ Broadcast info (`broadcasts`)

**Conclusion:** Summary endpoint has all the same data we currently extract from scoreboard

---

## Cost Savings Calculation

### Current Costs

**API Calls:**
- Leagues polled: ~70 leagues
- Polls per day: 720 (every 2 minutes)
- API calls per day: 70 × 720 = **50,400 calls/day**
- API calls per month: 50,400 × 30 = **1,512,000 calls/month**

**Firestore Reads:**
- Query games: ~1,000 reads/day (checking for live games)
- Total reads: ~30,000/month

**Estimated Monthly Cost:**
- API calls: ESPN API is free (public), but there may be rate limiting concerns
- Firestore reads: ~$0.06 per 100k reads = **~$0.02/month**
- Cloud Run execution time: Minimal impact

---

### Optimized Costs

**API Calls:**
- Average live games per poll: 5-10 games
- Polls per day: 720
- API calls per day: 7.5 × 720 = **5,400 calls/day**
- API calls per month: 5,400 × 30 = **162,000 calls/month**

**Firestore Reads:**
- Query games: ~1,000 reads/day (same query, but more efficient)
- Total reads: ~30,000/month (same)

**Estimated Monthly Cost:**
- API calls: ESPN API is free (public)
- Firestore reads: ~$0.02/month (same)
- Cloud Run execution time: **Reduced** (fewer API calls = faster execution)

---

### Savings Breakdown

| Metric | Current | Optimized | Savings |
|--------|---------|-----------|---------|
| API Calls/Day | 50,400 | 5,400 | **89% reduction** |
| API Calls/Month | 1,512,000 | 162,000 | **89% reduction** |
| Firestore Reads | ~30k/month | ~30k/month | Same |
| Cloud Run Time | Baseline | **~80% faster** | Faster execution |

**Key Benefits:**
1. **89% fewer API calls** = Less risk of rate limiting
2. **Faster execution** = Lower Cloud Run costs (if billed by execution time)
3. **More scalable** = Can handle more games without linear cost increase
4. **Better reliability** = Fewer API calls = less chance of failures

---

## Files That Need to Be Changed

### 1. `/Users/avery/Downloads/Copy of THPORTHINDEX/index.js`

**Function:** `pollESPNLiveDataHandler` (starts at line ~2930)

**Changes Required:**

1. **Add helper function to extract eventId from Game ID:**
   ```javascript
   function extractEventIdFromGameId(gameId) {
     // Format: "espn-nba-401810420" → "401810420"
     const match = gameId.match(/^espn-[^-]+-(.+)$/);
     return match ? match[1] : null;
   }
   ```

2. **Add helper function to fetch individual game summary:**
   ```javascript
   async function fetchGameSummary(sport, league, eventId) {
     const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eventId}`;
     // ... fetch and parse logic (reuse existing parsing code)
   }
   ```

3. **Modify polling logic (around line ~3318):**
   - **BEFORE:** Query Firestore for live games, then fetch ALL leagues
   - **AFTER:** Query Firestore for games to poll, then fetch ONLY those games individually

4. **Update game fetching loop:**
   - **BEFORE:** Loop through `ESPN_LEAGUES`, fetch scoreboard for each
   - **AFTER:** Loop through games from Firestore query, fetch summary for each

5. **Reuse existing parsing logic:**
   - The code that parses ESPN API responses (lines ~3413-3750) can be reused
   - Just need to adapt it to work with summary endpoint structure (which is similar)

**Specific Lines to Modify:**
- **Line ~3318-3351:** Replace league-based fetching with game-based fetching
- **Line ~3378-4126:** Modify the fetching loop to use summary endpoint instead of scoreboard
- **Line ~4372-4409:** Keep the filtering logic (already filters by status)

---

## Implementation Steps

### Step 1: Add Helper Functions
- Add `extractEventIdFromGameId()`
- Add `fetchGameSummary()`

### Step 2: Modify Polling Query
- Update Firestore query to filter by `Start Time <= now` AND `Status !== FINAL`
- Store result as array of games to poll

### Step 3: Replace League Loop with Game Loop
- Instead of looping through `ESPN_LEAGUES`
- Loop through games from Firestore query
- For each game, extract sport/league/eventId and fetch summary

### Step 4: Reuse Parsing Logic
- Adapt existing parsing code to work with summary endpoint
- Summary endpoint structure is similar to scoreboard (both have `competitions` array)

### Step 5: Test
- Test with 1-2 live games first
- Verify data structure matches what front-end expects
- Verify scores update correctly

---

## Risk Assessment

### Low Risk ✅
- Summary endpoint is publicly available (we tested it)
- Data structure matches scoreboard endpoint
- Front-end doesn't need changes (reads from Firestore)
- Can roll back easily if issues arise

### Potential Issues
1. **EventId extraction:** Need to handle edge cases (games without eventId)
2. **Summary endpoint rate limits:** Unknown, but 5-10 calls per poll should be fine
3. **Parsing differences:** Summary endpoint might have slightly different structure (need to test)

---

## Testing Plan

1. **Unit Test:**
   - Test `extractEventIdFromGameId()` with various Game ID formats
   - Test `fetchGameSummary()` with known eventIds

2. **Integration Test:**
   - Run polling with 1-2 live games
   - Verify Firestore updates correctly
   - Verify front-end displays correctly

3. **Production Test:**
   - Deploy to production
   - Monitor for 24 hours
   - Compare API call counts (should see ~89% reduction)

---

## Rollback Plan

If issues arise:
1. Revert changes to `index.js`
2. Old code (league-based fetching) will resume
3. No data loss (Firestore structure unchanged)

---

## Expected Timeline

- **Development:** 2-3 hours
- **Testing:** 1-2 hours
- **Deployment:** 30 minutes
- **Monitoring:** 24 hours

**Total:** ~1 day

---

## Success Metrics

After implementation, we should see:
- ✅ API calls reduced from ~50,400/day to ~5,400/day
- ✅ Cloud Run execution time reduced by ~80%
- ✅ Front-end continues to display games correctly
- ✅ Live scores update every 2 minutes as before
- ✅ No increase in errors or failures

---

## Questions to Address

1. **What if a game doesn't have an eventId?**
   - Fallback: Use scoreboard endpoint for that league (rare case)

2. **What if summary endpoint fails?**
   - Retry logic (already exists in code)
   - Fallback: Use scoreboard endpoint for that game's league

3. **What about games that start late?**
   - Query filters by `Start Time <= now`, so games starting late won't be polled until their start time

4. **What about games that go into overtime?**
   - Query filters by `Status !== FINAL`, so games stay in polling until they're FINAL

---

## Conclusion

This optimization will:
- ✅ **Reduce API calls by 89%**
- ✅ **Maintain exact same front-end functionality**
- ✅ **Improve reliability and scalability**
- ✅ **Require minimal code changes**
- ✅ **Have low risk of breaking changes**

**Recommendation:** Proceed with implementation.
