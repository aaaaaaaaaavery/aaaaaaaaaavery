# Guide: Importing Google Sheets Standings to Firestore

This guide explains how to create scrapers that read standings data from Google Sheets CSV URLs and write them to Firestore collections.

## Overview

The process is:
1. **Create a scraper** for each league that reads from Google Sheets CSV
2. **Write the data** to the corresponding Firestore collection
3. **Add the scraper** to `scrape-all-standings.cjs` to run automatically
4. **Frontend automatically** reads from Firestore (already configured!)

## Step 1: Create a Scraper for Each League

### Template File

I've created a template file: `scrape-standings-from-sheets-template.cjs`

### Example: PGA Tour Scraper

I've created an example: `scrape-pgatour-standings.cjs` - use this as a reference.

### How to Create a New Scraper

1. **Copy the template or example:**
   ```bash
   cp scrape-pgatour-standings.cjs scrape-lpgatour-standings.cjs
   ```

2. **Update the configuration:**
   - `LEAGUE_NAME`: The display name (e.g., 'LPGA Tour')
   - `COLLECTION_NAME`: The Firestore collection name (e.g., 'LPGATourStandings')
   - `GOOGLE_SHEETS_CSV_URL`: The CSV URL from your Google Sheet

3. **Get the Google Sheets CSV URL:**
   - Open your Google Sheet
   - File → Share → Publish to web
   - Select the specific sheet/tab
   - Choose "CSV" format
   - Copy the URL

4. **Update field mappings:**
   In the `saveToFirestore` function, map your CSV columns to Firestore fields:
   ```javascript
   const docData = {
     Rank: entry.Rank || entry.Rk || '',
     Team: entry.Team || entry.Player || entry.Name || '',
     Points: entry.Points || entry.Pts || '',
     // Add other fields as needed
     lastUpdated: admin.firestore.FieldValue.serverTimestamp()
   };
   ```

5. **Test the scraper:**
   ```bash
   node scrape-lpgatour-standings.cjs
   ```

## Step 2: Add to scrape-all-standings.cjs

Once your scraper works, add it to `scrape-all-standings.cjs`:

```javascript
console.log('\n⛳ Running LPGA Tour Standings Scraper...\n');
try {
  execSync('node scrape-lpgatour-standings.cjs', { stdio: 'inherit' });
} catch (error) {
  console.error('LPGA Tour scraper failed');
}
await delay(DELAY_BETWEEN_SCRAPERS);
```

## Step 3: League-to-Collection Mapping

Here's the mapping of leagues to their Firestore collections (already configured in frontend):

| League | Collection Name | Google Sheets URL (from index.html) |
|--------|----------------|-------------------------------------|
| PGA Tour | `PGATourStandings` | ✅ URL available |
| LPGA Tour | `LPGATourStandings` | ✅ URL available |
| UFC | `UFCStandings` | ✅ URL available |
| Boxing | `BoxingStandings` | ✅ URL available |
| NASCAR Cup Series | `NASCARCupSeriesStandings` | ✅ URL available |
| Tennis | `TennisStandings` | ✅ URL available |
| LIV Golf | `LIVGolfStandings` | ✅ URL available |
| IndyCar | `IndyCarStandings` | ✅ URL available |
| MotoGP | `MotoGPStandings` | ✅ URL available |
| Track and Field | `TrackAndFieldStandings` | ✅ URL available |
| FA Cup | `FACupStandings` | ✅ Scraper exists |
| Soccer | `SoccerStandings` | ❌ No URL yet |
| NCAA Baseball | `NCAABaseballStandings` | ❌ No URL yet |
| NCAA Softball | `NCAASoftballStandings` | ❌ No URL yet |
| World Cup U17 | `WorldCupU17Standings` | ❌ No URL yet |
| World Cup U17 Play Offs | `WorldCupU17PlayOffsStandings` | ❌ No URL yet |

## Step 4: Field Mapping Examples

### Golf (PGA Tour, LPGA Tour, LIV Golf)
```javascript
{
  Rank: entry.Rank || entry.Rk,
  Golfer: entry.Golfer || entry.Player || entry.Name,
  Points: entry.Points || entry.Pts || entry.Score
}
```

### Racing (NASCAR, IndyCar, MotoGP)
```javascript
{
  Rank: entry.Rank || entry.Rk,
  Driver: entry.Driver || entry.Rider || entry.Name,
  Points: entry.Points || entry.Pts
}
```

### Combat Sports (UFC, Boxing)
```javascript
{
  Rank: entry.Rank || entry.Rk,
  Fighter: entry.Fighter || entry.Name,
  Division: entry.Division || '',
  Record: entry.Record || ''
}
```

### Tennis
```javascript
{
  Rank: entry.Rank || entry.Rk,
  Player: entry.Player || entry.Name,
  Points: entry.Points || entry.Pts
}
```

## Step 5: Running the Scrapers

### Run a single scraper:
```bash
node scrape-pgatour-standings.cjs
```

### Run all scrapers:
```bash
node scrape-all-standings.cjs
```

## Step 6: Verify Data in Firestore

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Check the collection (e.g., `PGATourStandings`)
4. Verify documents are created with correct data

## Step 7: Frontend Will Automatically Use Firestore

The frontend is already configured to:
1. **First try** to load from Firestore
2. **Fall back** to Google Sheets CSV if Firestore is empty

Once your scrapers populate Firestore, the frontend will automatically use that data!

## Troubleshooting

### CSV Parsing Issues
- Make sure your Google Sheet is published as CSV
- Check that column headers match what you're expecting
- Use `console.log(csvData[0])` to see the first row structure

### Firestore Write Issues
- Verify `service-account-key.json` has write permissions
- Check that collection names match exactly (case-sensitive)
- Ensure field names don't contain special characters

### Data Not Showing on Frontend
- Verify the collection name matches what's in `collectionMap` in `index (1).html`
- Check browser console for errors
- Clear browser cache and localStorage

## Quick Reference: All Leagues Needing Scrapers

1. ✅ **FA Cup** - Scraper exists (`scrape-facup-standings.cjs`)
2. ⛳ **PGA Tour** - Example scraper created (`scrape-pgatour-standings.cjs`)
3. ⛳ **LPGA Tour** - Create from template
4. 🥊 **UFC** - Create from template
5. 🥊 **Boxing** - Create from template
6. 🏎️ **NASCAR Cup Series** - Create from template
7. 🎾 **Tennis** - Create from template
8. ⛳ **LIV Golf** - Create from template
9. 🏎️ **IndyCar** - Create from template
10. 🏍️ **MotoGP** - Create from template
11. 🏃 **Track and Field** - Create from template
12. ⚽ **Soccer** - Create from template (when URL available)
13. ⚾ **NCAA Baseball** - Create from template (when URL available)
14. 🥎 **NCAA Softball** - Create from template (when URL available)
15. ⚽ **World Cup U17** - Create from template (when URL available)
16. ⚽ **World Cup U17 Play Offs** - Create from template (when URL available)

## Notes

- **Formula One** has special handling (Driver/Constructor tabs) and already has scrapers
- **Tennis** may need special handling for ATP/WTA if they're separate sheets
- All scrapers should follow the same pattern: fetch CSV → parse → transform → save to Firestore
- Use the CFP scraper (`scrape-cfp-standings.cjs`) as the simplest reference example

