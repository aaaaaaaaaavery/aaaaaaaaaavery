# YouTube API Setup Guide

## Overview

The RSS feed service now uses YouTube Data API v3 to generate RSS feeds from YouTube channels and playlists. This provides more reliable and feature-rich feeds compared to scraping.

## Setup Instructions

### Step 1: Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable **YouTube Data API v3**:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### Step 2: Set Environment Variable

**Option 1: Environment Variable (Recommended for Production)**
```bash
export YOUTUBE_API_KEY="YOUR_API_KEY_HERE"
```

**Option 2: .env File (For Local Development)**
Create a `.env` file in the `rss-feed-service` directory:
```
YOUTUBE_API_KEY=YOUR_API_KEY_HERE
```

**Option 3: Update start-service.sh**
Add to `start-service.sh`:
```bash
export YOUTUBE_API_KEY="YOUR_API_KEY_HERE"
```

### Step 3: Restart Service

Restart the RSS feed service for the changes to take effect:
```bash
# If using launchd
launchctl unload ~/Library/LaunchAgents/com.rssfeedservice.plist
launchctl load ~/Library/LaunchAgents/com.rssfeedservice.plist

# Or if running manually
# Stop the service (Ctrl+C) and restart
node index.js
```

## API Quota Limits

**Free Tier:**
- **10,000 units per day** (default)
- Each search = 100 units
- Each playlistItems request = 1 unit
- Each videos request = 1 unit
- **= ~100 channel/playlist requests per day**

**For 35+ YouTube feeds:**
- Each feed refresh = 2 API calls (playlistItems + videos)
- = 70+ API calls per refresh
- With 30-minute cache = ~48 refreshes/day
- = ~3,360 API calls/day
- **Well within the 10,000 unit limit!**

**If you need more:**
- Request quota increase (free) from Google Cloud Console
- Go to "APIs & Services" > "Quotas"
- Request increase for "Queries per day"

## How It Works

### Without API Key (Fallback)
- Uses YouTube's native RSS feeds
- Works but limited metadata
- No API quota used

### With API Key (Preferred)
- Uses YouTube Data API v3
- Rich metadata (views, likes, duration, etc.)
- Better error handling
- More reliable

## Available YouTube Feeds

### Channels (20 feeds)
- Tennis Channel (`youtube-tennischannel`)
- WTA (`youtube-wta`)
- ATP Tour (`youtube-atptour`)
- TennisTV (`youtube-tennistv`)
- Ring Magazine (`youtube-ringmagazine`)
- Premier Boxing Champions (`youtube-premierboxingchampions`)
- Matchroom Boxing (`youtube-matchroomboxing`)
- Top Rank (`youtube-toprank`)
- DAZN Boxing (`youtube-daznboxing`)
- NBA (`youtube-nba`)
- Formula 1 (`youtube-formula1`)
- CBS Sports CFB (`youtube-cbssportscfb`)
- CFB on FOX (`youtube-cfbonfox`)
- ESPN CFB (`youtube-espncfb`)
- NWSL (`youtube-nwsl`)
- Ligue 1 (`youtube-ligue1`)
- Bundesliga (`youtube-bundesliga`)
- Serie A (`youtube-seriea`)
- La Liga (`youtube-laliga`)
- NHL (`youtube-nhl`)
- NFL (`youtube-nfl`)
- MLB (`youtube-mlb`)

### Playlists (10 feeds)
- NCAAF Playlist 1-6 (`youtube-ncaaf-playlist-1` through `youtube-ncaaf-playlist-6`)
- Premier League Playlist 1-3 (`youtube-premierleague-playlist-1` through `youtube-premierleague-playlist-3`)
- MLB Playlist (`youtube-mlb-playlist`)

## Feed URLs

All YouTube feeds are accessible via:
- **Channel**: `/feeds/youtube-{channelname}.xml`
- **Playlist**: `/feeds/youtube-{playlistname}.xml`

Or directly via YouTube router:
- **Channel**: `/youtube/channel/{handle}.xml`
- **Playlist**: `/youtube/playlist/{playlistId}.xml`

## Testing

Test a feed:
```bash
curl http://localhost:8080/feeds/youtube-nba.xml
```

Or in browser:
```
http://localhost:8080/feeds/youtube-nba.xml
```

## Troubleshooting

### "YouTube API key not configured"
- Make sure `YOUTUBE_API_KEY` environment variable is set
- Restart the service after setting the variable

### "Channel not found"
- Channel handle may be incorrect
- Try accessing the channel URL directly to verify the handle

### "Quota exceeded"
- You've hit the daily API limit
- Wait 24 hours or request quota increase
- Service will fall back to native RSS feeds

### API Key Security
- **Never commit API key to git**
- Use environment variables or `.env` file (add to `.gitignore`)
- Restrict API key in Google Cloud Console:
  - Go to "APIs & Services" > "Credentials"
  - Click on your API key
  - Under "API restrictions", select "Restrict key"
  - Choose "YouTube Data API v3"

## Cost

**FREE** ✅
- YouTube Data API v3 is free
- 10,000 units/day (default)
- More than enough for RSS feeds

