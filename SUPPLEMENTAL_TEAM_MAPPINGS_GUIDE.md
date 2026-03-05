# Supplemental Team Name Mappings Guide

## Overview

This system provides a supplemental team name mapping solution that works alongside the existing team name matching system. It's designed to handle team name variations that aren't currently working with the existing system.

## Google Sheet Structure

The mappings are stored in a Google Sheet: https://docs.google.com/spreadsheets/d/1DiKJ1Hz1GZJ652pi74xKEY9Szm_p41IEPbfxFyQyTys/edit?gid=0#gid=0

### Column Structure:
- **Column A**: League (e.g., `NCAAM`, `NCAAW`, `NCAAF`)
- **Column B**: Display name (how the team name should display on site, e.g., `Houston`)
- **Column C+**: Variations (any team name variation that should map to all other variations in this row)

### Example:
```
League    | Display Name | Variation 1      | Variation 2      | Variation 3
----------|--------------|------------------|------------------|-------------
NCAAM     | Houston      | Houston Cougars  | UH               | Houston U
NCAAM     | Purdue       | Purdue Boilermakers | #1 Purdue    | 1 Purdue
```

## How It Works

1. **Loading Mappings**: The `load-supplemental-team-mappings.cjs` script reads the Google Sheet and stores mappings in Firestore
2. **Using Mappings**: The `supplemental-team-mappings-util.cjs` utility provides functions to:
   - Get display name for a team name
   - Check if two team names match
   - Get all variations for a team name

## Setup Instructions

### 1. Load Mappings from Google Sheets

Run the loader script to sync mappings from Google Sheets to Firestore:

```bash
node load-supplemental-team-mappings.cjs
```

This script:
- Reads the Google Sheet
- Processes all rows and creates bidirectional mappings
- Stores mappings in Firestore at `artifacts/flashlive-daily-scraper/public/data/supplementalTeamMappings`

### 2. Use in Your Scripts

The utility module is already integrated into:
- `sync-top25-to-games.cjs` - For matching Top 25 rankings with games
- `index.js` - For matching NCAA API games with FlashLive games

To use in other scripts, import the utility:

```javascript
const { 
  getDisplayNameFromSupplemental, 
  doTeamNamesMatch, 
  getAllTeamNameVariations 
} = require('./supplemental-team-mappings-util.cjs');

// Get display name for a team
const displayName = await getDisplayNameFromSupplemental('Houston Cougars', 'NCAAM');
// Returns: 'Houston'

// Check if two team names match
const matches = await doTeamNamesMatch('Houston Cougars', 'UH', 'NCAAM');
// Returns: true

// Get all variations
const variations = await getAllTeamNameVariations('Houston', 'NCAAM');
// Returns: ['Houston', 'Houston Cougars', 'UH', 'Houston U']
```

## Use Cases

### 1. Top 25 Rankings (NCAA API → FlashLive)
The system helps match Top 25 rankings from the NCAA API with games from FlashLive API by mapping team name variations.

### 2. Live Games Data (FlashLive)
When FlashLive API returns team names in different formats, the mappings help normalize them to the display name.

### 3. Manual Entry (Google Sheets → FlashLive)
When manually entering games in Google Sheets, team names can be matched with FlashLive API data using the mappings.

## Maintenance

1. **Add New Mappings**: Edit the Google Sheet to add new team name variations
2. **Reload Mappings**: Run `load-supplemental-team-mappings.cjs` after making changes
3. **Cache**: Mappings are cached in Firestore for 5 minutes to reduce API calls

## Notes

- Mappings are league-specific (e.g., `NCAAM` mappings won't apply to `NCAAW`)
- The system works as a supplement to existing matching logic, not a replacement
- All variations in a row are considered equivalent and will map to the display name
- Case-insensitive matching is supported
- Normalized matching (removing special characters) is also supported

