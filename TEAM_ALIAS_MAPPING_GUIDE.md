# Team Alias Mapping System Guide

## Overview

This system allows you to create site-wide team name "aliases" so that different variations of team names all map to the same canonical team. For example:
- `Colorado St.` = `Colorado State` = `Colorado St` (all map to `Colorado State`)
- But `Colorado` ≠ `Colorado State` (different teams)
- And `Colorado College` ≠ `Colorado State` (different teams)

## How It Works

1. **Google Sheets**: You maintain your team alias mappings in a Google Sheet
2. **Backend Script**: `load-supplemental-team-mappings.cjs` reads the Google Sheet and stores mappings in Firestore
3. **Frontend**: The HTML file (`index (1).html`) loads mappings from Firestore and uses them to match team names

## Google Sheet Format

Your Google Sheet should be located at: https://docs.google.com/spreadsheets/d/1DiKJ1Hz1GZJ652pi74xKEY9Szm_p41IEPbfxFyQyTys/edit

### Column Structure:
- **Column A**: League (e.g., `NCAAM`, `NCAAW`, `NCAAF`, `NBA`, `NFL`, `MLB`)
- **Column B**: Display Name (canonical name, e.g., `Colorado State`)
- **Column C, D, E, F, G, etc.**: All variations/aliases (you can use as many columns as needed!)

**Important**: The system reads ALL columns starting from Column C, so you can have as many variations as you need across multiple columns.

### Example Rows:

```
League  | Display Name      | Column C        | Column D       | Column E       | Column F
--------|-------------------|----------------|----------------|----------------|-------------
NCAAM   | Colorado State    | Colorado St.    | Colorado St    | CSU            | Colo State
NCAAM   | Houston           | Houston Cougars | UH             | Houston U      | 
NBA     | LA Clippers       | Los Angeles Clippers | L.A. Clippers | Clippers      | LAC
NCAAF   | Mississippi State | MS State       | Miss State     | MSU            | Mississippi St
```

**Note**: Empty cells are ignored, so you don't need to fill every column. Just add variations as needed!

### Important Notes:
- All variations in a row are considered equivalent
- Each variation maps to the display name (Column B)
- The display name itself should be included in the variations if it appears differently elsewhere
- Case-insensitive matching is supported
- Special characters are normalized (e.g., `St.` = `St` = `St `)

## Setup Instructions

### Step 1: Add Your Mappings to Google Sheets

1. Open the Google Sheet: https://docs.google.com/spreadsheets/d/1DiKJ1Hz1GZJ652pi74xKEY9Szm_p41IEPbfxFyQyTys/edit
2. Add rows with your team alias mappings following the format above
3. Make sure Column A has the correct league key (e.g., `NCAAM`, `NCAAW`, `NCAAF`, `NBA`, etc.)

### Step 2: Load Mappings to Firestore

Run the loader script to sync mappings from Google Sheets to Firestore:

```bash
node load-supplemental-team-mappings.cjs
```

This script:
- Reads the Google Sheet
- Processes all rows and creates bidirectional mappings
- Stores mappings in Firestore at `artifacts/flashlive-daily-scraper/public/data/supplementalTeamMappings`

### Step 3: Frontend Automatically Uses Mappings

The HTML file (`index (1).html`) automatically:
- Loads mappings from Firestore on page load
- Caches mappings for 5 minutes
- Uses mappings in the `normalizeTeamName()` function
- Provides helper functions for matching team names

## Available Functions

### In Frontend (HTML):

```javascript
// Get canonical name for a team
const canonical = await getCanonicalTeamName('Colorado St.', 'NCAAM');
// Returns: 'Colorado State'

// Check if two team names match
const matches = await doTeamNamesMatch('Colorado St.', 'Colorado State', 'NCAAM');
// Returns: true

// Get all variations for a team
const variations = await getAllTeamNameVariations('Colorado State', 'NCAAM');
// Returns: ['Colorado State', 'Colorado St.', 'Colorado St', 'CSU']
```

### In Backend (Node.js):

Use the utility module:

```javascript
const { 
  getDisplayNameFromSupplemental, 
  doTeamNamesMatch, 
  getAllTeamNameVariations 
} = require('./supplemental-team-mappings-util.cjs');

// Get display name for a team
const displayName = await getDisplayNameFromSupplemental('Colorado St.', 'NCAAM');
// Returns: 'Colorado State'

// Check if two team names match
const matches = await doTeamNamesMatch('Colorado St.', 'Colorado State', 'NCAAM');
// Returns: true
```

## League Keys

Make sure you use the correct league keys in Column A. Common league keys:

- `NCAAM` - NCAA Men's Basketball
- `NCAAW` - NCAA Women's Basketball
- `NCAAF` - NCAA Football
- `NBA` - NBA
- `NFL` - NFL
- `MLB` - MLB
- `NHL` - NHL
- `PremierLeague` - Premier League
- `Bundesliga` - Bundesliga
- `Ligue1` - Ligue 1
- And more...

## Best Practices

1. **Include All Variations**: Add all variations you encounter from different data sources (ESPN API, NCAA API, Google Sheets, etc.). You can use as many columns (C, D, E, F, G, etc.) as needed - there's no limit!

2. **Use Display Name**: The display name (Column B) should be the "canonical" name you want to show on the site

3. **Be Specific**: Don't include variations that could match multiple teams. For example:
   - ✅ `Colorado State` with variations `Colorado St.`, `Colorado St`, `CSU`
   - ❌ Don't add `Colorado` as a variation (it's too generic and could match other Colorado teams)

4. **Case Sensitivity**: Matching is case-insensitive, so `Colorado St.` = `colorado st.` = `COLORADO ST.`

5. **Special Characters**: Special characters are normalized, so `St.` = `St` = `St ` (all match)

6. **Update Regularly**: When you encounter new team name variations, add them to the Google Sheet and reload to Firestore

## Troubleshooting

### Mappings Not Working?

1. **Check Firestore**: Verify mappings are in Firestore at `artifacts/flashlive-daily-scraper/public/data/supplementalTeamMappings`
2. **Check League Key**: Make sure the league key in Column A matches what you're using in code
3. **Reload Mappings**: Run `load-supplemental-team-mappings.cjs` again
4. **Clear Cache**: The frontend caches mappings for 5 minutes - wait or refresh the page

### Team Names Still Not Matching?

1. **Check Exact Spelling**: Make sure variations match exactly (case-insensitive, but spelling must match)
2. **Check Normalization**: The system normalizes special characters and whitespace
3. **Check League**: Make sure you're using the correct league key

## Example Use Cases

### Use Case 1: NCAA Team Names

**Problem**: ESPN API returns `Colorado St.`, NCAA API returns `Colorado State`, Google Sheets has `Colorado St`

**Solution**: Add to Google Sheet:
```
NCAAM | Colorado State | Colorado St. | Colorado St | CSU
```

All three variations will now map to `Colorado State` and match each other.

### Use Case 2: NBA Team Names

**Problem**: Different sources use `LA Clippers`, `Los Angeles Clippers`, `L.A. Clippers`

**Solution**: Add to Google Sheet:
```
NBA | LA Clippers | Los Angeles Clippers | L.A. Clippers | Clippers
```

All variations will map to `LA Clippers`.

## Maintenance

1. **Add New Mappings**: Edit the Google Sheet to add new team name variations
2. **Reload Mappings**: Run `load-supplemental-team-mappings.cjs` after making changes
3. **Cache**: Mappings are cached in Firestore and frontend (5 minutes) to reduce API calls

## Integration Points

The team alias system is integrated into:
- `normalizeTeamName()` function in `index (1).html` - automatically uses aliases
- `sync-top25-to-games.cjs` - For matching Top 25 rankings with games
- `index.js` - For matching NCAA API games with FlashLive games
- Any script that uses `supplemental-team-mappings-util.cjs`
