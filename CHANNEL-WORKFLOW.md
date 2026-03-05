# Channel Data Workflow Guide

## Overview

This document explains how TV channel information flows from Google Sheets to your live games display.

## The Complete Workflow

```
Google Sheets (with Channel column)
         ↓
   import-from-sheets.js
         ↓
Firestore (NFL, NBA, MLB collections)
         ↓
   index.js (FlashLive scraper)
         ↓
Firestore (sportsGames collection)
         ↓
   Frontend (index.html)
         ↓
   Display with channel info
```

## Step-by-Step Process

### 1. Add Channel Data to Google Sheets

In your Google Sheets document for upcoming schedules, add a **Channel** column:

**Example for NBA sheet:**
| Date | Time | Away Team | Home Team | Channel |
|------|------|-----------|-----------|---------|
| 2025-10-08 | 7:00 PM | Warriors | Lakers | ESPN |
| 2025-10-08 | 8:00 PM | Heat | Celtics | TNT |

**Important:**
- Column name must be exactly **"Channel"**
- Add this column to: NFL, NBA, MLB sheets (and any other leagues you want)
- Team names should match how they appear in FlashLive (can be partial, e.g., "Lakers" works)

### 2. Push to Firestore

Run the import script to push your Google Sheets data (including channel) to Firestore:

```bash
node import-from-sheets.js
```

This will:
- Read data from your Google Sheets
- Create/update documents in Firestore collections (NFL, NBA, MLB, etc.)
- Each document will now have a `channel` field

### 3. FlashLive Scraper Runs

When `index.js` runs (via Cloud Scheduler or manually):

1. **Fetches today's games** from FlashLive API
2. **Queries upcoming schedule collections** (NFL, NBA, MLB, etc.) for channel data
3. **Matches games** by:
   - Date (must match exactly)
   - Home team name (fuzzy matching)
   - Away team name (fuzzy matching)
4. **Adds channel field** to matched games
5. **Writes to `sportsGames`** collection with channel data included

### 4. Frontend Displays Channel

The channel data is now available in your game objects when the frontend queries Firestore.

## Configuration

### Supported Leagues

The following leagues are configured for channel lookup in `index.js`:

```javascript
'USA: NFL': 'NFL',
'USA: NBA': 'NBA',
'USA: NBA - Pre-season': 'NBA',
'USA: MLB': 'MLB',
'USA: NHL': 'NHL',
'USA: NHL - Pre-season': 'NHL',
'USA: MLS': 'MLS',
'England: Premier League': 'PremierLeague'
```

### Adding More Leagues

To add channel support for more leagues:

1. **In `import-from-sheets.js`**: Add `channel: 'Channel'` to the league config
2. **In `index.js`**: Add the league to `LEAGUE_TO_COLLECTION_MAP`

Example:
```javascript
// In index.js
const LEAGUE_TO_COLLECTION_MAP = {
  // ... existing mappings
  'USA: NHL': 'NHL',  // Add this line
};
```

## Logs and Debugging

When `index.js` runs, you'll see logs like:

```
Found 15 upcoming games with channel data in NBA
Total channel entries found: 15
✅ Added channel "ESPN" to Warriors @ Lakers
✅ Added channel "TNT" to Heat @ Celtics
Successfully wrote 25 games to Firestore (15 with channel data).
```

## Troubleshooting

### Channel not appearing?

1. **Check Google Sheets**: Verify the Channel column exists and has data
2. **Check Firestore**: Look at the upcoming schedule collection (e.g., `NBA`) - does the document have a `channel` field?
3. **Check date format**: Date in Google Sheets must be `YYYY-MM-DD` format
4. **Check team names**: Make sure team names are similar between Google Sheets and FlashLive
5. **Check logs**: Look at Cloud Function logs to see if channel was found and added

### Team name matching issues

The matching is fuzzy, so:
- "Lakers" will match "Los Angeles Lakers" ✅
- "LA Lakers" will match "Los Angeles Lakers" ✅
- "L.A. Lakers" will match "Los Angeles Lakers" ✅

If still not matching, try using the exact team name from FlashLive.

## Benefits of This Approach

✅ **Single source of truth**: Google Sheets for all upcoming game data  
✅ **Automatic sync**: Channel data flows automatically when scraper runs  
✅ **No manual Firestore edits**: All changes happen via Google Sheets  
✅ **Flexible**: Easy to update channel info by editing Google Sheets  
✅ **Scalable**: Works for any number of games and leagues  

## Maintenance

### Daily Workflow

1. **Morning**: Update Google Sheets with today's channel info
2. **Run import**: `node import-from-sheets.js`
3. **Scraper runs**: Automatically via Cloud Scheduler (or run manually)
4. **Channel data appears**: On your website automatically

### Automation Options

You can automate step 2 (import from sheets) by:
- Creating a Cloud Function for `import-from-sheets.js`
- Scheduling it to run before the FlashLive scraper
- Or combining both into a single Cloud Function

## Example: Complete Flow for NBA Game

1. **Google Sheets (NBA tab)**:
   ```
   2025-10-08 | 7:00 PM | Warriors | Lakers | ESPN
   ```

2. **After `import-from-sheets.js`**:
   ```
   Firestore > NBA collection > document:
   {
     date: "2025-10-08",
     time: "7:00 PM",
     away: "Warriors",
     home: "Lakers",
     channel: "ESPN"
   }
   ```

3. **After `index.js` scraper**:
   ```
   Firestore > sportsGames collection > document:
   {
     "Game ID": "12345",
     "League": "USA: NBA",
     "Home Team": "Los Angeles Lakers",
     "Away Team": "Golden State Warriors",
     "gameDate": "2025-10-08",
     "channel": "ESPN",  ← Added by scraper
     ... other fields
   }
   ```

4. **Frontend displays**: "Warriors @ Lakers - ESPN"
