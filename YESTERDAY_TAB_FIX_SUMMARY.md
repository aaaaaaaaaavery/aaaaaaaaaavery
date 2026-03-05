# Yesterday Tab Fix Summary

## Problem Identified
NCAAM and NCAAW games were appearing duplicated (twice each game) in the Yesterday tab because:
1. NCAA games were missing `canonicalGameKey` field (unlike ESPN games)
2. Deduplication when moving games to `yesterdayScores` only used Game ID
3. If the same game had different Game IDs (numeric vs deterministic), both would be moved
4. Deduplication in `/yesterday.json` endpoint also only used Game ID

## Changes Made

### 1. Added `canonicalGameKey` to NCAAM Games (Line ~4749)
- **Location**: `index.js` around line 4719-4749
- **Change**: Added `canonicalGameKey` field to `gameData` object for NCAAM games
- **Pattern**: Matches ESPN games pattern - uses `getGameKey(leagueDisplayName, homeTeamName, awayTeamName, gameDateForStorage)`
- **Impact**: Allows deduplication even when Game IDs differ

### 2. Added `canonicalGameKey` to NCAAW Games (Line ~4938)
- **Location**: `index.js` around line 4905-4938
- **Change**: Added `canonicalGameKey` field to `gameData` object for NCAAW games
- **Pattern**: Same as NCAAM - matches ESPN games pattern
- **Impact**: Allows deduplication even when Game IDs differ

### 3. Improved Deduplication When Moving to yesterdayScores (Lines 1551-1575)
- **Location**: `index.js` in `initialScrapeAndStartPollingHandler` function
- **Change**: 
  - Added `canonicalKeySet` to track canonicalGameKeys
  - Check both Game ID AND canonicalGameKey before moving games
  - Skip duplicates found by either method
- **Impact**: Prevents duplicate games from being moved to `yesterdayScores` collection

### 4. Improved Deduplication in `/yesterday.json` Endpoint (Lines 6469-6488)
- **Location**: `index.js` in `generateYesterdayGamesJSON` function
- **Change**:
  - Added `canonicalKeySet` to track canonicalGameKeys
  - Check both Game ID AND canonicalGameKey when building JSON response
  - Skip duplicates found by either method
- **Impact**: Prevents duplicate games from appearing in the Yesterday tab

## How It Works

### canonicalGameKey Format
- Format: `"league|hometeam|awayteam|date"` (all lowercase, trimmed)
- Example: `"usa: ncaa|duke|north carolina|2026-01-15"`
- Purpose: Uniquely identifies a game by teams and date, regardless of Game ID format

### Deduplication Logic
1. **When storing games**: `canonicalGameKey` is calculated and stored with each game
2. **When moving to yesterdayScores**: Check both Game ID and canonicalGameKey
   - If Game ID matches → skip (duplicate)
   - If canonicalGameKey matches → skip (same game, different ID)
3. **When serving yesterday.json**: Same dual-check logic

## Testing Recommendations

1. **Verify no duplicates**: Check Yesterday tab after next 3:55 AM EST run
2. **Check logs**: Look for "Skipping duplicate game" messages in Cloud Functions logs
3. **Verify canonicalGameKey**: Check Firestore documents to ensure NCAA games have `canonicalGameKey` field
4. **Test edge cases**: 
   - Games with numeric Game IDs
   - Games with deterministic Game IDs
   - Games that transition from numeric to deterministic (or vice versa)

## Expected Behavior After Fix

- ✅ Each NCAAM/NCAAW game appears only once in Yesterday tab
- ✅ Games with different Game IDs but same teams/date are deduplicated
- ✅ No impact on rankings or channel data (they use different matching logic)
- ✅ Consistent with how ESPN games are handled

## Notes

- Changes are backward compatible - existing games without `canonicalGameKey` will still work
- New games will have `canonicalGameKey` and benefit from improved deduplication
- The fix applies to both the morning run (3:55 AM EST) and the `/yesterday.json` endpoint
