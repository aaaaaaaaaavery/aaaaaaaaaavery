# Local Cache Refresh Setup Guide

This guide shows you how to set up automatic cache refreshing for your RSS feed bundles using your local computer.

## How It Works

The refresh script pings your bundle URLs every X minutes to keep the cache warm. This ensures:
- Fresh content is always available
- No waiting for the first visitor to trigger a refresh
- Free (runs on your local machine)

## Refresh Rate Limits

**You can refresh as frequently as you want**, but here are some considerations:

- **Minimum recommended**: Every 15 minutes (matches cache TTL)
- **Maximum practical**: Every 1-5 minutes (very frequent, but safe)
- **YouTube rate limits**: YouTube doesn't have strict rate limits for RSS feeds, so you're safe to refresh frequently

**Recommended refresh rates:**
- **Conservative**: Every 15 minutes (matches cache expiration)
- **Moderate**: Every 5-10 minutes (keeps content very fresh)
- **Aggressive**: Every 1-2 minutes (maximum freshness, but uses more resources)

## Setup Instructions

### Option 1: Using Node.js Script (Recommended)

#### Step 1: Make the script executable

```bash
cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service"
chmod +x refresh-bundle.js
```

#### Step 2: Test the script manually

```bash
node refresh-bundle.js
```

You should see output like:
```
🔄 Starting bundle refresh at 2025-12-02T18:30:00.000Z
Refreshing 1 bundle(s)...

✅ [2025-12-02T18:30:01.123Z] Refreshed: ncaaw-videos (200)

📊 Summary: 1 succeeded, 0 failed
```

#### Step 3: Set up cron job (macOS/Linux)

Open your crontab:
```bash
crontab -e
```

Add one of these lines (choose your preferred refresh rate):

**Every 15 minutes:**
```bash
*/15 * * * * cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service" && /usr/local/bin/node refresh-bundle.js >> ~/rss-refresh.log 2>&1
```

**Every 5 minutes:**
```bash
*/5 * * * * cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service" && /usr/local/bin/node refresh-bundle.js >> ~/rss-refresh.log 2>&1
```

**Every 1 minute:**
```bash
* * * * * cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service" && /usr/local/bin/node refresh-bundle.js >> ~/rss-refresh.log 2>&1
```

**Note:** Replace `/usr/local/bin/node` with your actual Node.js path. Find it with:
```bash
which node
```

#### Step 4: Verify cron is running

Check your cron logs:
```bash
tail -f ~/rss-refresh.log
```

### Option 2: Using Bash Script (Simpler, no Node.js needed)

#### Step 1: Make the script executable

```bash
cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service"
chmod +x refresh-bundle.sh
```

#### Step 2: Test the script manually

```bash
./refresh-bundle.sh
```

#### Step 3: Set up cron job

Open your crontab:
```bash
crontab -e
```

Add one of these lines:

**Every 15 minutes:**
```bash
*/15 * * * * /bin/bash "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/refresh-bundle.sh" >> ~/rss-refresh.log 2>&1
```

**Every 5 minutes:**
```bash
*/5 * * * * /bin/bash "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/refresh-bundle.sh" >> ~/rss-refresh.log 2>&1
```

**Every 1 minute:**
```bash
* * * * * /bin/bash "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/refresh-bundle.sh" >> ~/rss-refresh.log 2>&1
```

### Option 3: Using macOS LaunchAgent (Runs even when not logged in)

#### Step 1: Create a LaunchAgent plist file

```bash
nano ~/Library/LaunchAgents/com.rssfeed.refresh.plist
```

#### Step 2: Add this content (adjust paths and refresh rate):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rssfeed.refresh</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/refresh-bundle.js</string>
    </array>
    <key>StartInterval</key>
    <integer>900</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/avery/rss-refresh.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/avery/rss-refresh-error.log</string>
</dict>
</plist>
```

**Note:** `StartInterval` is in seconds:
- `900` = 15 minutes
- `300` = 5 minutes
- `60` = 1 minute

#### Step 3: Load the LaunchAgent

```bash
launchctl load ~/Library/LaunchAgents/com.rssfeed.refresh.plist
```

#### Step 4: Verify it's running

```bash
launchctl list | grep rssfeed
```

#### Step 5: To stop it later

```bash
launchctl unload ~/Library/LaunchAgents/com.rssfeed.refresh.plist
```

## Adding More Bundles

To refresh additional bundles, edit the `BUNDLES_TO_REFRESH` array in `refresh-bundle.js` or the `BUNDLES` array in `refresh-bundle.sh`:

**In refresh-bundle.js:**
```javascript
const BUNDLES_TO_REFRESH = [
  'ncaaw-videos',
  'ncaam-videos',  // Add new bundles here
  'nfl-videos',
];
```

**In refresh-bundle.sh:**
```bash
BUNDLES=(
  "ncaaw-videos"
  "ncaam-videos"  # Add new bundles here
  "nfl-videos"
)
```

## Monitoring

Check the log file to see refresh activity:
```bash
tail -f ~/rss-refresh.log
```

## Troubleshooting

### Cron not running?
- Check if cron has permission: `crontab -l`
- Check system logs: `grep CRON /var/log/syslog` (Linux) or Console.app (macOS)

### Script not found?
- Use absolute paths in cron
- Check file permissions: `chmod +x refresh-bundle.js`

### Node.js not found?
- Find Node.js path: `which node`
- Use full path in cron: `/usr/local/bin/node` or `/opt/homebrew/bin/node`

## Cost

**100% FREE!** This runs on your local machine and just makes HTTP requests to your Cloud Run service. No additional costs.

