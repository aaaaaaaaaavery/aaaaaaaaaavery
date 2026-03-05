# NCAAM and NCAAW Games Source Analysis - Yesterday Tab

## Where Games Come From

### 1. **Data Source: NCAA API**
   - **Location**: `index.js` lines 4560-4946
   - **API Endpoint**: 
     - NCAAM: `https://ncaa-api.henrygd.me/scoreboard/basketball-men/d1/{date}`
     - NCAAW: `https://ncaa-api.henrygd.me/scoreboard/basketball-women/d1/{date}`
   - **When Fetched**: 
     - During `pollESPNLiveDataHandler` (polling runs)
     - Fetches for both "today" and "yesterday" dates (line 4552-4553)
     - During morning run (`initialScrapeAndStartPollingHandler`)

### 2. **Storage Location: Firestore `sportsGames` Collection**
   - **Location**: `index.js` lines 5400-5406
   - Games are stored with `Game ID` as the document ID
   - Game ID format: `ncaa-ncaam-{numericId}` or `ncaa-ncaaw-{numericId}`
   - If numeric ID not available: Uses deterministic ID: `ncaa-ncaam-{team1}-{team2}-{date}`

### 3. **Moving to YesterdayScores Collection**
   - **Location**: `index.js` lines 1534-1572
   - **Process**:
     1. Queries `sportsGames` for games with `gameDate == yesterday` and `Match Status IN ['FINAL', 'FINISHED']`
     2. Uses Game ID as document ID in `yesterdayScores` collection
     3. Deduplicates by Game ID using a Set (line 1551-1561)
   
### 4. **Frontend Display: Yesterday Tab**
   - **Location**: `index (1).html` lines 46875-47017
   - **Endpoint**: `/data/yesterday.json` (line 46900)
   - **Backend Handler**: `index.js` lines 6440-6480
   - Fetches from `yesterdayScores` collection
   - Deduplicates by Game ID (line 6452-6466)

## Duplication Issue Analysis

### Potential Causes of Duplication:

1. **Same Game Stored with Different Game IDs**
   - If a game is fetched when it has a numeric ID → stored as `ncaa-ncaam-12345`
   - If same game fetched later without numeric ID → stored as `ncaa-ncaam-team1-team2-date`
   - Both would be moved to `yesterdayScores` as separate documents

2. **Date Conversion Issues**
   - NCAA API provides games by date (line 4562)
   - Game's actual `gameDate` is calculated from start time (UTC → Eastern) (lines 4628-4631)
   - If a game appears in both "today" and "yesterday" scoreboards due to timezone conversion:
     - Might get stored twice if the date filtering (lines 4635-4642) doesn't catch it
     - However, deduplication by `gameKey` (line 4747-4753) should prevent this within same fetch

3. **Multiple Fetch Runs**
   - Games fetched during morning run vs polling run
   - If Game ID generation is inconsistent between runs, same game could get different IDs
   - Both would then be moved to `yesterdayScores`

4. **Missing canonicalGameKey** ⚠️ **CONFIRMED ISSUE**
   - NCAA games do NOT have `canonicalGameKey` field (lines 4719-4744 for NCAAM, 4905-4929 for NCAAW)
   - They use `gameKey` for deduplication during fetch (lines 4747, 4932), but this is NOT stored in the game data
   - The deduplication logic in `pollESPNLiveDataHandler` (lines 5276-5323) uses `canonicalGameKey` for matching existing games
   - Without `canonicalGameKey`, games with different Game IDs but same teams/date cannot be matched
   - **This is likely the root cause**: Same game stored with different Game IDs (numeric vs deterministic) cannot be deduplicated later

### Current Deduplication Mechanisms:

1. **During Fetch** (line 4747-4753):
   - Uses `getGameKey('NCAAM', homeTeamName, awayTeamName, gameDateForStorage)`
   - Prevents duplicates within the same fetch run

2. **When Moving to YesterdayScores** (line 1551-1561):
   - Uses Game ID Set to prevent duplicates
   - Only works if Game IDs are identical

3. **In Frontend** (line 6452-6466):
   - Deduplicates by Game ID when generating JSON
   - Only works if Game IDs are identical

## Root Cause Identified ✅

**NCAA games are missing `canonicalGameKey` field**, which is critical for deduplication when:
- Same game gets different Game IDs (numeric vs deterministic)
- Games are fetched at different times
- Games need to be matched when moving to yesterdayScores

## Recommendations

1. **Add canonicalGameKey to NCAA Games** ⚠️ **CRITICAL FIX**
   - Add `canonicalGameKey` field when storing NCAA games (similar to ESPN games at lines 3881, 4484)
   - Use `getGameKey('NCAAM', homeTeamName, awayTeamName, gameDateForStorage)` (already calculated at line 4747)
   - Store it in `gameData` object before pushing to `allGames`
   - This will allow deduplication even when Game IDs differ

2. **Improve Deduplication When Moving to YesterdayScores**
   - Use `canonicalGameKey` or `gameKey` in addition to Game ID
   - Check for games with same teams/date even if Game IDs differ

3. **Consistent Game ID Generation**
   - Always prefer numeric ID from API
   - If numeric ID not available, ensure deterministic ID is consistent
   - Log when deterministic ID is used vs numeric ID

4. **Debug Logging**
   - Log Game IDs when moving to yesterdayScores
   - Log when duplicates are detected
   - Check if same game appears with different Game IDs
