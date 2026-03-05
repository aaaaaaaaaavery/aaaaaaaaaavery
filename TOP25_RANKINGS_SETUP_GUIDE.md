# Top 25 Rankings Setup Guide

## Overview

This guide explains how to get Top 25 rankings properly attached to team names in games. The system uses alias mappings to match team name variations.

## The Process

### Step 1: Load Team Alias Mappings to Firestore

First, ensure your team alias mappings are loaded to Firestore:

```bash
node load-supplemental-team-mappings.cjs
```

This reads your Google Sheet and stores mappings in Firestore at:
`artifacts/flashlive-daily-scraper/public/data/supplementalTeamMappings`

**Important**: Make sure your Google Sheet has the correct alias mappings. For example:
- `NCAAM | Iowa State | Iowa St | Iowa St.`
- `NCAAM | Florida State | Florida St | Florida St. | FSU`
- `NCAAM | Florida | Florida` (separate from Florida State!)

### Step 2: Scrape Top 25 Rankings

Scrape the Top 25 rankings from the NCAA API and save to Firestore:

**For NCAAM:**
```bash
node scrape-ncaam-standings.cjs
```

**For NCAAW:**
```bash
node scrape-ncaaw-standings.cjs
```

**For NCAAF:**
```bash
node scrape-ncaaf-standings.cjs
```

This saves rankings to Firestore collections:
- `NCAAMStandings`
- `NCAAWStandings`
- `NCAAFStandings`

Each document has:
- `Team`: The team name from NCAA API (e.g., "Iowa State")
- `Top25Rank`: The ranking (1-25)
- `Top25Points`: Points received
- `Top25Previous`: Previous ranking

### Step 3: Sync Rankings to Games

Run the sync script to attach rankings to games:

```bash
node sync-top25-to-games.cjs
```

This script:
1. Loads rankings from Firestore standings collections
2. Builds a rankings map using alias mappings (stores rankings by ALL variations)
3. Matches game team names to rankings using canonical names from alias mappings
4. Updates games in Firestore with `Home Team Ranking` and `Away Team Ranking` fields

## How Matching Works

### Building the Rankings Map

When loading rankings, the system:
1. Gets the team name from Firestore (e.g., "Iowa State")
2. Gets canonical name from alias mappings (e.g., "Iowa State" → "Iowa State")
3. Gets ALL variations from alias mappings (e.g., ["Iowa State", "Iowa St", "Iowa St."])
4. Stores the ranking under ALL variations (both original and normalized)

### Matching Game Teams to Rankings

When matching a game team to rankings:
1. Gets the team name from game (e.g., "Iowa St.")
2. Gets canonical name from alias mappings (e.g., "Iowa St." → "Iowa State")
3. Normalizes the canonical name (e.g., "Iowa State" → "iowa state")
4. Looks up in rankings map using normalized canonical name
5. **Validates the match** to prevent false positives:
   - Prevents "Florida" from matching "Florida State"
   - Prevents "Michigan" from matching "Michigan State"
   - Only matches if both are short names OR both are long names (not mixed)

## Common Issues and Fixes

### Issue 1: Iowa State Not Showing Ranking

**Problem**: Ranking exists but doesn't appear on games.

**Solution**:
1. Check your alias mapping: `NCAAM | Iowa State | Iowa St | Iowa St.`
2. Make sure the ranking in Firestore has team name "Iowa State" (or one of the aliases)
3. Run `load-supplemental-team-mappings.cjs` to reload mappings
4. Run `sync-top25-to-games.cjs` to re-sync rankings

### Issue 2: Arkansas Ranking Showing on Kansas

**Problem**: "Kansas" is getting Arkansas' ranking (#17).

**Root Cause**: This shouldn't happen with the new matching logic, but if it does:
- Check if rankings map has wrong keys
- Verify team names in Firestore are correct
- Check if there's a typo in alias mappings

**Solution**:
1. Check Firestore `NCAAMStandings` collection - verify "Arkansas" and "Kansas" are separate documents
2. Check alias mappings - make sure "Arkansas" and "Kansas" are NOT in the same alias group
3. Run sync again: `node sync-top25-to-games.cjs`

### Issue 3: Florida and Florida State Both Getting Same Ranking

**Problem**: Both "Florida" and "Florida State" show ranking #19.

**Root Cause**: The matching logic wasn't preventing short names from matching long names.

**Solution**: The new code prevents this by:
- Checking if team name contains "St.", "State", "University", or "College"
- Only matching if both teams are short names OR both are long names
- "Florida" (short) will NOT match "Florida State" (long)

**To Fix**:
1. Make sure your alias mappings separate them:
   ```
   NCAAM | Florida State | Florida St | Florida St. | FSU
   NCAAM | Florida | Florida
   ```
2. Run `load-supplemental-team-mappings.cjs`
3. Run `sync-top25-to-games.cjs`

## Verification Steps

After running the sync, verify rankings are correct:

1. **Check Firestore Games**: Look at a few games and verify `Home Team Ranking` and `Away Team Ranking` fields
2. **Check Console Output**: The sync script logs matches - look for any warnings
3. **Check Frontend**: View games on the site and verify rankings appear correctly

## Debugging

If rankings aren't matching:

1. **Check Rankings Map**: Add console.log in `loadTop25Rankings()` to see what keys are in the map
2. **Check Canonical Names**: Add console.log to see what canonical names are being used
3. **Check Normalized Names**: Add console.log to see normalized names being matched

Example debug output:
```javascript
console.log('Rankings map keys:', Object.keys(rankingsMap).slice(0, 10));
console.log('Away team canonical:', awayCanonicalToUse);
console.log('Normalized canonical:', normalizedAwayCanonical);
console.log('Found in map?', rankingsMap[normalizedAwayCanonical] ? 'YES' : 'NO');
```

## Important Notes

1. **NCAAF Stays Hardcoded**: NCAAF rankings use hardcoded normalization (no alias mappings)
2. **Exact Matching Only**: The system uses exact matching on normalized canonical names - no substring matching
3. **Short vs Long Names**: The system prevents "Florida" from matching "Florida State" by checking if names contain "St.", "State", etc.
4. **Alias Mappings Required**: For NCAAM and NCAAW, you MUST have alias mappings in your Google Sheet for matching to work

## Complete Workflow

```bash
# 1. Update alias mappings in Google Sheet
# (Edit: https://docs.google.com/spreadsheets/d/1DiKJ1Hz1GZJ652pi74xKEY9Szm_p41IEPbfxFyQyTys/edit)

# 2. Load mappings to Firestore
node load-supplemental-team-mappings.cjs

# 3. Scrape Top 25 rankings
node scrape-ncaam-standings.cjs
node scrape-ncaaw-standings.cjs

# 4. Sync rankings to games
node sync-top25-to-games.cjs

# 5. Verify on frontend
# (Check games on your site)
```

## Troubleshooting Checklist

- [ ] Alias mappings loaded to Firestore?
- [ ] Rankings scraped and saved to Firestore?
- [ ] Rankings map built correctly (check console output)?
- [ ] Canonical names being used for matching?
- [ ] Short/long name validation working?
- [ ] Games updated in Firestore (check `Home Team Ranking` field)?
