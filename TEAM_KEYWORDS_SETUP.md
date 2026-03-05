# Team Keywords Setup Guide

This system allows you to manage team keywords in Google Sheets and automatically match content (news, social posts, videos) to games.

## How It Works

1. **Google Sheets Structure**: Each league is a tab, each team is a column, keywords are in rows
2. **Import Process**: Keywords are imported from Google Sheets into Firestore
3. **Auto-Matching**: When a game is clicked, the system:
   - Extracts Home Team and Away Team from the game
   - Fetches keywords for both teams from Firestore
   - Searches content (news/social/media) for matching keywords
   - Displays matching content in the respective columns

## Setup Steps

### 1. Create Google Sheets Document

Create a new Google Sheet with this structure:

**Tab: NHL**
| Pittsburgh Penguins | Detroit Red Wings | ... |
|---------------------|-------------------|-----|
| Pittsburgh          | Detroit           |     |
| Penguins            | Red Wings         |     |
| Sidney Crosby       | Dylan Larkin      |     |
| Evgeni Malkin       | Lucas Raymond     |     |
| ...                 | ...               |     |

**Tab: NFL**
| Dallas Cowboys | ... |
|----------------|-----|
| Dallas         |     |
| Cowboys        |     |
| Dak Prescott   |     |
| ...            |     |

**Rules:**
- First row = Team names (column headers)
- Each row below = One keyword per team
- Empty cells are ignored
- League tabs can be named: NHL, NFL, NBA, MLB, WNBA, MLS, NCAA, NCAAF, NCAAM, NCAAW

### 2. Share Sheet with Service Account

1. Get your service account email from Google Cloud Console:
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Find your service account (e.g., `flashlive-daily-scraper@appspot.gserviceaccount.com`)
   - Copy the email address

2. Share the Google Sheet with this service account email:
   - Open your Google Sheet
   - Click "Share" button
   - Paste the service account email
   - Give it "Viewer" access
   - Click "Send"

### 3. Configure Import Script

Edit `import-team-keywords.js`:

```javascript
const KEYWORDS_SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
// Get the ID from the Google Sheets URL:
// https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

Also update the leagues list if needed:
```javascript
const LEAGUES_TO_IMPORT = ['NHL', 'NFL', 'NBA', 'MLB', 'WNBA', 'MLS', 'NCAA', 'NCAAF', 'NCAAM', 'NCAAW'];
```

### 4. Run Import

Run the script directly:

```bash
# Set environment variables
export KEYWORDS_SPREADSHEET_ID="your_spreadsheet_id"
export FIREBASE_PROJECT_ID="flashlive-daily-scraper"

# Run the import
node import-team-keywords.js
```

**Or edit the script directly** to set the spreadsheet ID:
```javascript
const KEYWORDS_SPREADSHEET_ID = 'your_spreadsheet_id_here';
```

Then just run:
```bash
node import-team-keywords.js
```

### 5. Verify in Firestore

Check that keywords were imported:
1. Go to: https://console.cloud.google.com/firestore
2. Navigate to: `teamKeywords` → `{league}` → `teams` → `{teamName}`
3. You should see:
   ```json
   {
     "league": "NHL",
     "teamName": "Pittsburgh Penguins",
     "keywords": ["Pittsburgh", "Penguins", "Sidney Crosby", ...],
     "lastUpdated": <timestamp>
   }
   ```

## How It Works on Frontend

1. User clicks a game (e.g., "Penguins vs Red Wings")
2. System reads game document → gets Home Team, Away Team, League
3. System fetches keywords for both teams from Firestore
4. System searches content collections for articles/posts/videos containing any keywords
5. Matching content is displayed in News/Social/Media columns

## Updating Keywords

1. Update your Google Sheet
2. Re-run the import (same process as Step 4)
3. Changes will be reflected immediately (no restart needed)

## Troubleshooting

**"No keywords found for teams" error:**
- Verify the sheet is shared with the service account
- Check that team names in the sheet exactly match team names in game documents
- Run the import and check Firestore to see what was imported
- Check console logs for any errors during import

**Team names don't match:**
- Game documents might use "Pittsburgh Penguins" but sheet uses "Penguins"
- Solution: Either update the sheet to match exactly, or add both variations as keywords

**No content matching:**
- Verify keywords are in the content (check if title/description contains the keyword)
- Verify content exists in Firestore collection `perspectives/content`
- Check that content has `contentType` field set correctly ('article', 'social', 'video')

