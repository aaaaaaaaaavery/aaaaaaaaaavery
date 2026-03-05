# Google Apps Script Setup Guide

## Overview
This setup will automatically sync your Google Sheets standings data to Firestore every 24 hours.

## Step 1: Set Up Google Apps Script

1. **Open Google Apps Script**: Go to [script.google.com](https://script.google.com)
2. **Create New Project**: Click "New Project"
3. **Copy the Code**: Copy the contents of `standings-sync.js` into the editor
4. **Update Configuration**: Modify the `FIREBASE_CONFIG` and `SHEETS_CONFIG` sections

## Step 2: Configure Firebase Authentication

You'll need to set up Firebase service account authentication:

1. **Go to Firebase Console**: [console.firebase.google.com](https://console.firebase.google.com)
2. **Select Your Project**: `flashlive-daily-scraper`
3. **Go to Project Settings** → **Service Accounts**
4. **Generate New Private Key**: Download the JSON file
5. **Add to Apps Script**: Store the service account key in the script

## Step 3: Set Up Your Google Sheets

Create sheets with these names in your spreadsheet:
- **NFL Standings**
- **MLB Standings** 
- **NBA Standings**
- **NHL Standings**
- **WNBA Standings**

### Required Columns:
- **Rank** (or position number)
- **Team** (team name)
- **MP** or **Matches Played** (games played)
- **W** or **Wins** (wins)
- **L** or **Losses** (losses)
- **D** or **Draws** (draws - for soccer leagues)
- **Points** (points/score)
- **Conference** (for NFL/NBA divisions)
- **Division** (for NFL/NBA divisions)

## Step 4: Deploy the Script

1. **Save the Script**: Ctrl+S
2. **Deploy as Web App**: 
   - Click "Deploy" → "New Deployment"
   - Choose "Web app" as type
   - Set access to "Anyone"
   - Click "Deploy"

## Step 5: Set Up Triggers

1. **Go to Triggers**: Click the clock icon in Apps Script
2. **Add Trigger**:
   - Function: `syncAllStandings`
   - Event source: Time-driven
   - Type: Day timer
   - Time: Choose when to run (e.g., 6 AM daily)

## Step 6: Test the Setup

1. **Run Test Function**: In Apps Script, run `testSync()`
2. **Check Logs**: View execution logs to see if it works
3. **Verify Firestore**: Check your Firestore database for the data

## Step 7: Update Standings Fetcher

The backend service will be updated to:
- Check if data is fresh (less than 24 hours old)
- Only fetch from Google Sheets if data is stale
- Serve cached data from Firestore otherwise

## Troubleshooting

### Common Issues:
1. **Permission Errors**: Make sure the service account has Firestore access
2. **Sheet Not Found**: Verify sheet names match exactly
3. **Data Format**: Ensure your Google Sheets has the required columns
4. **Authentication**: Double-check Firebase service account setup

### Testing:
- Use the `testSync()` function to test individual leagues
- Check Apps Script execution logs for errors
- Verify data appears in Firestore console

## Benefits:
- ✅ **Manual Control**: You control the data in Google Sheets
- ✅ **Automatic Sync**: Data syncs to Firestore automatically
- ✅ **Cost Effective**: 24-hour caching prevents excessive API calls
- ✅ **Reliable**: No dependency on external APIs for NFL/MLB
- ✅ **Flexible**: Easy to add new leagues or modify data structure
