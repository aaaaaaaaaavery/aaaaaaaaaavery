# How to Add New Leagues to Team Name Aliases

## Overview

The team alias system automatically reads **ALL** leagues from your Google Sheets document. When you add a new league, you need to ensure:

1. **The league key in Column A matches what the frontend expects**
2. **The league key conversion logic in `getTeamDisplayName()` can convert your league display name to the league key**

## Step-by-Step Process

### Step 1: Add Team Aliases to Google Sheets

1. Open: https://docs.google.com/spreadsheets/d/1DiKJ1Hz1GZJ652pi74xKEY9Szm_p41IEPbfxFyQyTys/edit?gid=0#gid=0
2. Add rows with your team alias mappings:
   - **Column A**: League key (e.g., `NCAAM`, `NCAAW`, `NBA`, `NFL`, `MLS`, `PremierLeague`)
   - **Column B**: Display Name (canonical name you want to show)
   - **Columns C, D, E, F, etc.**: All variations/aliases

**Important**: Use the **league key** in Column A, not the display name (e.g., use `PremierLeague`, not `Premier League` or `England: Premier League`).

### Step 2: Determine the League Key

The league key is what goes in Column A of your Google Sheet. It should match what your code expects. Common league keys:

- `NCAAM` - NCAA Men's Basketball
- `NCAAW` - NCAA Women's Basketball
- `NCAAF` - NCAA Football
- `NBA` - NBA
- `NFL` - NFL
- `MLB` - MLB
- `NHL` - NHL
- `MLS` - MLS
- `NWSL` - NWSL
- `PremierLeague` - Premier League (no spaces!)
- `LaLiga` - La Liga
- `Bundesliga` - Bundesliga
- `SerieA` - Serie A
- `Ligue1` - Ligue 1
- `LigaMX` - Liga MX
- `UEFAChampionsLeague` - UEFA Champions League
- `UEFAEuropaLeague` - UEFA Europa League
- `UEFAConferenceLeague` - UEFA Conference League
- `DFBPokal` - DFB-Pokal (Germany)
- `CONCACAFChampionsCup` - CONCACAF Champions Cup (Column A can be this or "CONCACAF Champions Cup" / "Concacaf Champions Cup" / "North & Central America: Concacaf Champions Cup" – the sync script normalizes them)
- And more...

**For new leagues**: You can use any league key you want, but it must match what `getTeamDisplayName()` expects. See Step 3.

### Step 3: Ensure League Key Conversion Works

The frontend function `getTeamDisplayName()` converts league display names (like `"USA: NCAA"`) to league keys (like `"NCAAM"`). 

**Good news**: There's a fallback at the end that uses the league name directly as the league key if no match is found. This means:

- If your league display name matches exactly what's in Column A of Google Sheets → **It will work automatically!**
- If not, you may need to add league key conversion logic (see below)

**Check current conversion logic**: Look in `index (1).html` around line 41010-41106 in the `getTeamDisplayName()` function. If your league isn't there, you can:

**Option A (Recommended)**: Use a league key that matches your league display name exactly (e.g., if your league is displayed as `"MyLeague"`, use `"MyLeague"` in Column A)

**Option B**: Add conversion logic to `getTeamDisplayName()` function to map your league display name to the league key

### Step 4: Load Mappings to Firestore

After adding rows to Google Sheets, run:

```bash
node load-supplemental-team-mappings.cjs
```

This script:
- Reads ALL rows from the Google Sheet (including your new league)
- Stores mappings in Firestore at `artifacts/flashlive-daily-scraper/public/data/supplementalTeamMappings`
- Each league is stored as a separate document with the league key as the document ID

### Step 5: Verify It Works

The frontend automatically:
1. Loads mappings from Firestore on page load
2. Caches mappings for 5 minutes
3. Uses mappings in `getTeamDisplayName()` to convert team names

**To test**:
1. Add a team alias mapping to Google Sheets for your new league
2. Run `load-supplemental-team-mappings.cjs`
3. Refresh the frontend page (or wait 5 minutes for cache to expire)
4. The team name should now use the display name from Column B

## Examples

### Example 1: Adding "MyNewLeague"

**In Google Sheets:**
```
Column A: MyNewLeague
Column B: Denver Broncos
Column C: Denver
Column D: Broncos
Column E: DEN
```

**Result**: All variations (`Denver Broncos`, `Denver`, `Broncos`, `DEN`) will map to `Denver Broncos` when the league is `"MyNewLeague"`.

**Note**: If `getTeamDisplayName()` is called with league `"MyNewLeague"`, it will use that directly as the league key (due to the fallback at line 41105).

### Example 2: Adding "SuperLeague" with Display Name "Super League"

**In Google Sheets:**
```
Column A: SuperLeague
Column B: New York Giants
Column C: NY Giants
Column D: Giants
```

**In Code**: If your code calls `getTeamDisplayName(teamName, "Super League")`, you need to either:
- Add conversion logic: `else if (league === 'Super League') { leagueKey = 'SuperLeague'; }`
- OR use `"SuperLeague"` as the league name when calling `getTeamDisplayName()`

## How It Works Behind the Scenes

1. **Google Sheets** → You add rows with league keys in Column A
2. **Backend Script** (`load-supplemental-team-mappings.cjs`) → Reads ALL rows, groups by league key, stores in Firestore
3. **Frontend** (`index (1).html`) → Loads ALL mappings from Firestore into `window.teamAliasMappings`
4. **`getTeamDisplayName()`** → Converts league display name to league key, then looks up team name in `window.teamAliasMappings[leagueKey]`

## Important Notes

1. **The system reads ALL leagues from Google Sheets** - there's no hardcoded list of leagues to process
2. **The league key must match** - Column A should match what `getTeamDisplayName()` expects
3. **Case-insensitive matching** - Team names are matched case-insensitively
4. **Normalized matching** - Special characters and whitespace are normalized (e.g., `St.` = `St` = `St `)
5. **Cache** - Mappings are cached for 5 minutes on the frontend - refresh the page if you don't see changes immediately

## Troubleshooting

### Team Aliases Not Working for New League

1. **Check Firestore**: Verify mappings are stored at `artifacts/flashlive-daily-scraper/public/data/supplementalTeamMappings/{yourLeagueKey}`
2. **Check League Key**: Make sure Column A in Google Sheets matches what `getTeamDisplayName()` expects
3. **Check League Name**: If calling `getTeamDisplayName(teamName, "Your League Display Name")`, verify the conversion logic handles it
4. **Reload Mappings**: Run `load-supplemental-team-mappings.cjs` again
5. **Clear Cache**: Wait 5 minutes or refresh the page

### League Key Not Found

If `getTeamDisplayName()` can't convert your league display name to a league key:
- Check if there's conversion logic in `getTeamDisplayName()` (around line 41010-41106)
- Add conversion logic if needed, OR
- Use the league key directly when calling `getTeamDisplayName()` (e.g., `getTeamDisplayName(teamName, "NCAAM")` instead of `getTeamDisplayName(teamName, "USA: NCAA")`)

## Summary

✅ **To add a new league:**
1. Add rows to Google Sheets with league key in Column A
2. Run `load-supplemental-team-mappings.cjs`
3. Ensure league key conversion works (or use league key directly)
4. Refresh frontend page

The system is **dynamic** - it reads ALL leagues from Google Sheets automatically, just like `NCAAM` and `NCAAW`!