# League-Wide Channel Feature Guide

## Overview
This feature allows you to set a default channel for an entire league. When a game is found for that league, it will automatically use the league-wide channel if no team-specific channel data exists.

This is useful for leagues like:
- ICC Test Series (World: Test Series)
- Formula One
- Boxing
- UFC
- Track & Field
- Any league where all games broadcast on the same channel

## How to Use

### 1. Create the Google Sheet Tab
In your upcoming schedule Google Sheets document (Sheet ID: `1gGY9dr485hf4WrdGkx01kC6Gw7oTuKeYYh_UQD5qkt4`):

1. Create a new tab named **`LeagueChannels`**
2. Add two columns:
   - **Column A**: `League` (the exact league name as it appears in FlashLive API)
   - **Column B**: `Channel` (the channel name to display)

### 2. Add League Channel Mappings
Example data for the `LeagueChannels` tab:

| League | Channel |
|--------|---------|
| World: Test Series | Willow |
| World: Twenty20 International | Willow |
| World: ICC World Cup Women | Willow |
| Formula 1 | ESPN |
| Boxing | DAZN |
| MMA | ESPN+ |

**Important**: The league name in column A must **exactly match** the league name from the FlashLive API (as it appears in the `League` field in Firestore).

### 3. Run the Import Script
Run the import script to load the league-wide channel mappings into Firestore:

```bash
node import-from-sheets.js
```

This will:
- Import the league-wide channel mappings to a `LeagueChannels` collection in Firestore
- Import all other league-specific schedule data as usual

### 4. Trigger Channel Lookup
Run the channel lookup function to apply the channels to today's games:

```bash
cd channel-lookup-deploy
gcloud functions deploy channel-lookup --runtime nodejs18 --trigger-http --allow-unauthenticated --source . --entry-point channelLookupHandler --region us-central1

curl -X POST https://us-central1-flashlive-daily-scraper.cloudfunctions.net/channel-lookup
```

## How It Works

### Priority Order
When matching channel data to games, the system checks in this order:

1. **Team-specific channel data** (from league-specific Google Sheets tabs like NFL, NBA, etc.)
   - Matches by: Home Team, Away Team, and Date
   
2. **League-wide channel data** (from the `LeagueChannels` tab)
   - Matches by: League name only
   - Used as a fallback if no team-specific channel is found

### Example Scenarios

**Scenario 1: Team-specific data exists**
- Game: Pakistan vs India in "World: Test Series"
- Team-specific data: Has Pakistan vs India with channel "Willow"
- League-wide data: "World: Test Series" → "Willow"
- **Result**: Uses team-specific channel "Willow"

**Scenario 2: No team-specific data**
- Game: Australia vs England in "World: Test Series"
- Team-specific data: Not found
- League-wide data: "World: Test Series" → "Willow"
- **Result**: Uses league-wide channel "Willow"

**Scenario 3: Neither exists**
- Game: Some game with no data
- **Result**: No channel displayed

## Finding League Names

To find the exact league name to use in the `LeagueChannels` tab:

1. Check the FlashLive API data in Firestore (`sportsGames` collection)
2. Look at the `League` field for a game in that league
3. Copy the exact text (including punctuation, spaces, etc.)

Common league names:
- `World: Test Series`
- `World: Twenty20 International`
- `World: ICC World Cup Women`
- `Formula 1`
- `Boxing`
- `MMA`
- `Track & Field`

## Troubleshooting

### Channels not appearing
1. Check that the league name in `LeagueChannels` exactly matches the FlashLive API league name
2. Verify the import ran successfully: `node import-from-sheets.js`
3. Check Firestore to ensure the `LeagueChannels` collection has data
4. Run the channel lookup function again

### Wrong channel appearing
1. Check if there's team-specific data that's overriding the league-wide channel
2. Verify the channel name is correct in the `LeagueChannels` tab

## Benefits

- **Less maintenance**: No need to manually enter every game for leagues with consistent channels
- **Automatic coverage**: New games in the league automatically get the correct channel
- **Fallback system**: Team-specific data still takes priority when it exists

