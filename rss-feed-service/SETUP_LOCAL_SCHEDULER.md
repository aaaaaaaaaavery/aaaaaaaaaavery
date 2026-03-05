# Local RSS Feed Refresh Scheduler Setup

This guide shows you how to set up a local scheduler to run the RSS feed refresh script every 15 minutes.

The script automatically handles different refresh intervals:
- **Direct RSS feeds** (already XML/RSS): Refreshed every 15 minutes
- **Scraped feeds** (website scraping): Refreshed every 3 hours (180 minutes)

## Option 1: Using Cron (Recommended - Simple)

### Step 1: Make the script executable (if using bash script)
```bash
chmod +x refresh-bundle.sh
```

### Step 2: Open your crontab
```bash
crontab -e
```

### Step 3: Add this line to run every 15 minutes
```cron
*/15 * * * * cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service && /usr/local/bin/node refresh-bundle.js >> /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service/refresh.log 2>&1
```

**Or if you prefer the bash script:**
```cron
*/15 * * * * cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service && /bin/bash refresh-bundle.sh >> /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service/refresh.log 2>&1
```

**Note:** The script checks which feeds need refreshing based on their type:
- Direct RSS feeds are refreshed if it's been 15+ minutes since last refresh
- Scraped feeds are refreshed if it's been 3+ hours since last refresh

### Step 4: Find your Node.js path (if needed)
If the above doesn't work, find where Node.js is installed:
```bash
which node
```

Then replace `/usr/local/bin/node` with the path you get.

### Step 5: Verify cron is running
```bash
# Check if cron is running
ps aux | grep cron

# View your crontab
crontab -l

# Check the log file
tail -f /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service/refresh.log
```

## Option 2: Using launchd (macOS Native - More Robust)

### Step 1: Create a plist file
Create `/Users/avery/Library/LaunchAgents/com.rssfeed.refresh.plist`:

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
    <key>WorkingDirectory</key>
    <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service</string>
    <key>StartInterval</key>
    <integer>900</integer>
    <key>StandardOutPath</key>
    <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/refresh.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/refresh-error.log</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

**Note:** `StartInterval` is in seconds (900 = 15 minutes). The script automatically handles different refresh intervals for different feed types.

### Step 2: Load the launchd job
```bash
launchctl load ~/Library/LaunchAgents/com.rssfeed.refresh.plist
```

### Step 3: Check if it's running
```bash
launchctl list | grep rssfeed
```

### Step 4: Unload (if you need to stop it)
```bash
launchctl unload ~/Library/LaunchAgents/com.rssfeed.refresh.plist
```

## Testing the Script Manually

Before setting up the scheduler, test it manually:

```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service
node refresh-bundle.js
```

## Troubleshooting

1. **Cron not running**: Make sure cron has permission to run. On macOS, you may need to grant Full Disk Access to Terminal/iTerm in System Preferences > Security & Privacy > Privacy > Full Disk Access.

2. **Node not found**: Use `which node` to find the path, or use the full path to node.

3. **Permission denied**: Make sure the script is executable: `chmod +x refresh-bundle.js`

4. **Check logs**: The refresh.log file will show you what's happening.

## Quick Setup Commands (Copy-Paste Ready)

For **cron** (Node.js script):
```bash
# Find node path
NODE_PATH=$(which node)

# Add to crontab
(crontab -l 2>/dev/null; echo "0 * * * * cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service && $NODE_PATH refresh-bundle.js >> /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service/refresh.log 2>&1") | crontab -

# Verify
crontab -l
```

For **launchd** (more robust):
```bash
# Create plist file
cat > ~/Library/LaunchAgents/com.rssfeed.refresh.plist << 'EOF'
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
    <key>WorkingDirectory</key>
    <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service</string>
    <key>StartInterval</key>
    <integer>900</integer>
    <key>StandardOutPath</key>
    <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/refresh.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/refresh-error.log</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF

# Load it
launchctl load ~/Library/LaunchAgents/com.rssfeed.refresh.plist

# Check status
launchctl list | grep rssfeed
```

