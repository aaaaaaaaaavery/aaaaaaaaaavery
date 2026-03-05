# Channel Data Sync Guide

This guide explains how to add TV channel information to your Firestore games database from Google Sheets.

## Setup

### 1. Create Google Sheet

Create a Google Sheet with the following columns:

| Date | Time | Home Team | Away Team | Channel |
|------|------|-----------|-----------|---------|
| October 8 | 7:00 PM | Lakers | Warriors | ESPN |
| October 8 | 8:00 PM | Celtics | Heat | TNT |

**Column Details:**
- **Date**: Format as "October 8" or "10/8/2025"
- **Time**: Game time (optional, not used for matching)
- **Home Team**: Home team name (can be partial, e.g., "Lakers" instead of "Los Angeles Lakers")
- **Away Team**: Away team name (can be partial)
- **Channel**: TV channel (e.g., "ESPN", "TNT", "ABC", "NBA TV")

### 2. Get Google Sheet ID

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/1ABC123XYZ456/edit
                                      ^^^^^^^^^^^^
                                      This is your Sheet ID
```

### 3. Configure the Script

Edit `sync-channel-data.js`:

```javascript
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace with your Sheet ID
const SHEET_NAME = 'Channels'; // Name of your sheet tab
```

### 4. Share Google Sheet

Share your Google Sheet with the service account email found in `service-account-key.json`:
- Look for the `client_email` field in the JSON file
- Share the sheet with that email address (Viewer access is sufficient)

## Usage

### Run the Sync

```bash
node sync-channel-data.js
```

### What It Does

1. Reads channel data from your Google Sheet
2. Finds matching games in Firestore by:
   - Date (must match exactly)
   - Team names (fuzzy matching - partial names work)
3. Updates each game document with:
   - `channel`: The TV channel name
   - `channelUpdatedAt`: Timestamp of when it was updated

### Output Example

```
Starting channel data sync...

Read 15 channel entries from Google Sheets
✅ Updated: Warriors @ Lakers - Channel: ESPN
✅ Updated: Heat @ Celtics - Channel: TNT
❌ No match found: Knicks @ Nets on October 9

=== Sync Complete ===
Updated: 13 games
Not found: 2 games

Sync completed successfully!
```

## Display Channel in Frontend

The channel data is now in your Firestore documents. To display it in your HTML:

### Option 1: Show in Games Column

Find where games are rendered (around line 4600-4700 in index.html) and add:

```javascript
// After rendering team names and scores
if (game.channel) {
    const channelSpan = document.createElement('span');
    channelSpan.textContent = game.channel;
    channelSpan.style.color = '#9ca3af';
    channelSpan.style.fontSize = '10px';
    channelSpan.style.marginLeft = '5px';
    // Append to appropriate element
}
```

### Option 2: Show in TV Listings

The channel field will automatically be available in the game data when you query Firestore.

## Automation

### Run Daily

To automatically sync channel data daily, you can:

1. **Cloud Scheduler** (if using Google Cloud):
   - Create a Cloud Function that runs this script
   - Schedule it to run daily at a specific time

2. **Cron Job** (if running locally):
   ```bash
   # Add to crontab to run daily at 6 AM
   0 6 * * * cd /path/to/project && node sync-channel-data.js
   ```

## Troubleshooting

### "No match found" errors

If games aren't matching:

1. **Check date format**: Make sure dates in Google Sheets match the format
2. **Check team names**: Try using shorter team names (e.g., "Lakers" instead of "Los Angeles Lakers")
3. **Check Firestore**: Verify the game exists in Firestore for that date

### Script errors

- Make sure `service-account-key.json` exists
- Verify Google Sheet is shared with service account
- Check that Sheet ID and Sheet Name are correct

## Tips

- You can run the script multiple times - it will update existing channel data
- Team name matching is fuzzy, so "Lakers" will match "Los Angeles Lakers"
- Date must match exactly (YYYY-MM-DD format in Firestore)
- You can add channel data for future games before they're in Firestore
