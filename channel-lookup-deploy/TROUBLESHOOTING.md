# Channel Lookup Troubleshooting Guide

## The Process Flow

1. **Games are fetched from NCAA API** → Stored in Firestore `sportsGames` collection with `gameDate` field
2. **You add channel data to Google Sheets** → NCAAM tab with Date, Home Team, Away Team, Channel columns
3. **Deploy and trigger channel-lookup function** → Reads from Google Sheets and matches to games in Firestore
4. **Function updates Firestore** → Adds `channel` field to matching games
5. **Frontend displays** → Reads from Firestore and shows channel info

## Common Issues & Solutions

### Issue 1: Game doesn't exist in Firestore yet

**Symptom**: Channel lookup runs but finds 0 games to update

**Solution**: 
- Games must be fetched from NCAA API first
- Check if the game exists in Firestore: Look in `sportsGames` collection for today's date
- If game doesn't exist, the NCAA API polling function needs to run first

### Issue 2: Date format mismatch

**Symptom**: Channel data in Google Sheets but not matching

**Check**:
- Google Sheet date: `1/13/2026` (MM/DD/YYYY)
- Firestore `gameDate`: Should be `2026-01-13` (YYYY-MM-DD)
- Function uses UTC date for "today" - check logs to see what date it's using

**Solution**:
- Make sure the date in Google Sheets matches the actual game date
- The function processes dates matching `todayStr` OR any game dates found in Firestore
- Check function logs to see what dates are being compared

### Issue 3: Team name mismatch

**Symptom**: Game exists but channel not matching

**Check**:
- Google Sheet: `Villanova` vs `Providence`
- Firestore: Check exact team names in the game document
- Function normalizes team names (lowercase, removes special chars)

**Solution**:
- Team names don't need to match exactly (function does fuzzy matching)
- But check logs to see normalized team names
- Example: `"Villanova"` → `"villanova"`, `"Providence"` → `"providence"`

### Issue 4: League/Sport not matching

**Symptom**: Game exists but function says "No collection mapping"

**Check**:
- Firestore game: `League` field should be `"USA: NCAA"` and `Sport` should be `"Basketball"`
- Function checks: `getSheetMapping(game.League, game.Sport)`

**Solution**:
- Verify the League and Sport fields in Firestore match what the function expects
- For NCAAM: League=`"USA: NCAA"`, Sport=`"Basketball"`
- For NCAAW: League=`"USA: NCAA Women"`, Sport=`"Basketball"`

## Debugging Steps

1. **Check function logs** after triggering:
   ```bash
   curl -X POST https://us-central1-flashlive-daily-scraper.cloudfunctions.net/channel-lookup
   ```
   
   Look for:
   - `✅ Found X games for today`
   - `📋 X games need channel lookup from Google Sheets`
   - `✅ Processed X channel entries from NCAAM`
   - `✅ Added channel "FS1" to Villanova @ Providence`

2. **Check Firestore**:
   - Go to Firestore console
   - Navigate to `artifacts/flashlive-daily-scraper/public/data/sportsGames`
   - Find the game document
   - Check: `gameDate`, `League`, `Sport`, `Home Team`, `Away Team`, `channel`

3. **Check Google Sheets**:
   - Verify the NCAAM tab exists
   - Verify columns: Date, Home Team, Away Team, Channel
   - Verify the row has data: `1/13/2026`, `Providence`, `Villanova`, `FS1`
   - Verify sheet ID matches `SHEET_ID_3` in the function

4. **Verify date**:
   - Google Sheet date: `1/13/2026`
   - Function parses to: `2026-01-13`
   - Firestore `gameDate`: Should be `2026-01-13`
   - Today's date (UTC): Check function logs

## Expected Log Output

When working correctly, you should see:

```
🚀 Starting channel lookup process from Google Sheets...
Today's date (UTC): 2026-01-13
✅ Found 50 games for today
✅ Game needs channel lookup: Villanova @ Providence (League: "USA: NCAA", Sport: "Basketball")
📋 1 games need channel lookup from Google Sheets
📋 Reading channel data from sheet: NCAAM (1Kbkg7jZOoiynLX5QPnM-T6M3gSYRZxMgOyJ5xxfHN4Q)
✅ Sheet NCAAM columns: Date=0, Home=3, Away=2, Channel=4
📅 Processing row 2: Villanova @ Providence on 2026-01-13 → Channel: FS1
✅ Processed 1 channel entries from NCAAM
📊 Channel map size: 2
✅ Added channel "FS1" to Villanova @ Providence (USA: NCAA)
🎉 Successfully updated 1 games with channel data from Google Sheets
```

## Quick Checklist

- [ ] Game exists in Firestore `sportsGames` collection
- [ ] Game has `gameDate` matching today (or the date in Google Sheets)
- [ ] Game has `League` = `"USA: NCAA"` and `Sport` = `"Basketball"`
- [ ] Google Sheet NCAAM tab has the game row
- [ ] Google Sheet has columns: Date, Home Team, Away Team, Channel
- [ ] Date in Google Sheet matches `gameDate` in Firestore (after parsing)
- [ ] Team names in Google Sheet match team names in Firestore (fuzzy matching OK)
- [ ] Function deployed and triggered successfully
- [ ] Check function logs for errors
