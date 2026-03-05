# RSS Feed Service: Setup on Current Machine & Transfer Guide

This guide walks you through:
1. **Setting up on your current machine** (test it works)
2. **Transferring to your dedicated machine** (for 24/7 operation)

---

## PART 1: Setup on Current Machine (Testing)

### Step 1: Install Dependencies

```bash
cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service"
npm install
```

**What this does:** Installs all required packages (express, cheerio, better-sqlite3, etc.)

**Expected output:** Should complete without errors. Takes 1-2 minutes.

---

### Step 2: Test the Service Locally

```bash
cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service"
./start-local.sh
```

**What this does:** Starts the service on `http://localhost:8080` using SQLite (FREE, no cloud costs)

**Expected output:**
```
🚀 Starting RSS Feed Service locally (FREE - uses SQLite instead of Firestore)
Service will run on: http://localhost:8080
Background job runs every 15 minutes
[Service] Using LOCAL SQLite database (FREE)
RSS Feed Service running on port 8080
```

**Test it works:**
- Open a new terminal window
- Run: `curl http://localhost:8080/health`
- Should return: `{"status":"ok"}`

**Let it run for 15 minutes** to see the background job populate the database.

**To stop:** Press `Ctrl+C` in the terminal running the service.

---

### Step 3: Verify Background Job is Working

After 15 minutes, check if feeds are being cached:

```bash
# Check if database file was created
ls -lh "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/feed_items.db"

# Test a feed endpoint
curl http://localhost:8080/feeds/nfl-com.xml
```

**Expected:** Should return RSS XML with articles.

---

## PART 2: Transfer to Dedicated Machine

### Step 4: Prepare Files for Transfer

**Files you need to transfer:**

1. **The entire `rss-feed-service` folder:**
   ```bash
   # On current machine, create a transfer package
   cd "/Users/avery/Downloads/Copy of THPORTHINDEX"
   tar -czf rss-feed-service-transfer.tar.gz rss-feed-service/
   ```

2. **Transfer methods:**
   - **USB Drive:** Copy `rss-feed-service-transfer.tar.gz` to USB, transfer to dedicated machine
   - **Network/File Sharing:** Copy folder directly over network
   - **Cloud Storage:** Upload to Dropbox/Google Drive, download on dedicated machine

**Note:** You can skip `node_modules/` folder - it's faster to reinstall on the dedicated machine.

---

### Step 5: Setup on Dedicated Machine

**On the dedicated machine:**

1. **Extract the files:**
   ```bash
   # If you used tar.gz
   tar -xzf rss-feed-service-transfer.tar.gz
   cd rss-feed-service
   
   # Or if you copied the folder directly
   cd /path/to/rss-feed-service
   ```

2. **Install Node.js** (if not already installed):
   ```bash
   # Check if installed
   node --version
   
   # If not installed, download from https://nodejs.org/ (LTS version)
   # Or use Homebrew: brew install node
   ```

3. **Install dependencies:**
   ```bash
   cd /path/to/rss-feed-service
   npm install
   ```

4. **Test it works:**
   ```bash
   ./start-local.sh
   ```
   
   Test: `curl http://localhost:8080/health` should return `{"status":"ok"}`

---

### Step 6: Set Up Auto-Start on Dedicated Machine

**Create a launchd service** (macOS) so it starts automatically on boot:

```bash
# Find your username
whoami

# Create the plist file
nano ~/Library/LaunchAgents/com.rssfeed.service.plist
```

**Paste this** (REPLACE `[YOUR-USERNAME]` with your actual username):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rssfeed.service</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/[YOUR-USERNAME]/rss-feed-service/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/[YOUR-USERNAME]/rss-feed-service</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/[YOUR-USERNAME]/rss-feed-service/service.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/[YOUR-USERNAME]/rss-feed-service/service-error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>USE_LOCAL_DB</key>
        <string>true</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

**Load and start the service:**
```bash
launchctl load ~/Library/LaunchAgents/com.rssfeed.service.plist
launchctl start com.rssfeed.service
```

**Verify it's running:**
```bash
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

---

### Step 7: Set Up Cloudflare Tunnel (For Internet Access)

**Install Cloudflare Tunnel:**
```bash
brew install cloudflared
```

**Start tunnel:**
```bash
cloudflared tunnel --url http://localhost:8080
```

**You'll get a URL like:** `https://abc-123-def-456.trycloudflare.com`

**Copy this URL** - you'll need it for the frontend.

**Make tunnel auto-start** (optional but recommended):

```bash
nano ~/Library/LaunchAgents/com.rssfeed.tunnel.plist
```

**Paste this** (update paths if needed):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rssfeed.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloudflared</string>
        <string>tunnel</string>
        <string>--url</string>
        <string>http://localhost:8080</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/[YOUR-USERNAME]/rss-feed-service/tunnel.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/[YOUR-USERNAME]/rss-feed-service/tunnel-error.log</string>
</dict>
</plist>
```

**Find cloudflared path:**
```bash
which cloudflared
# Use that path in the plist file above
```

**Load and start:**
```bash
launchctl load ~/Library/LaunchAgents/com.rssfeed.tunnel.plist
launchctl start com.rssfeed.tunnel
```

---

### Step 8: Update Frontend to Use New URL

**In `index (1).html`, find and replace:**

**Find:**
```
https://rss-feed-service-124291936014.us-central1.run.app
```

**Replace with your Cloudflare Tunnel URL:**
```
https://abc-123-def-456.trycloudflare.com
```

**Or use the script:**
```bash
cd "/Users/avery/Downloads/Copy of THPORTHINDEX"
./update-rss-urls.sh https://abc-123-def-456.trycloudflare.com
```

---

### Step 9: Configure Power Settings (Dedicated Machine)

**System Preferences → Energy Saver:**

1. **Computer sleep:** Set to "Never" (or 3+ hours minimum)
2. **Display sleep:** Your choice (15 min is fine)
3. **Put hard disks to sleep:** OFF
4. **Prevent automatic sleep on power adapter:** ON

**IMPORTANT:** Keep the dedicated machine **plugged into power** at all times!

---

## Verification Checklist

After setup on dedicated machine:

- [ ] Service starts automatically: `curl http://localhost:8080/health` returns `{"status":"ok"}`
- [ ] Test a feed: `curl http://localhost:8080/feeds/nfl-com.xml` returns RSS XML
- [ ] Tunnel works: Use tunnel URL in browser, should see service
- [ ] Auto-start works: Restart computer, service should start automatically
- [ ] Logs are being written: `tail -f ~/rss-feed-service/service.log`
- [ ] Frontend can access feeds: Test on your website

---

## Quick Reference Commands

**Check if service is running:**
```bash
curl http://localhost:8080/health
```

**View service logs:**
```bash
tail -f ~/rss-feed-service/service.log
```

**Restart service:**
```bash
launchctl stop com.rssfeed.service
launchctl start com.rssfeed.service
```

**Check service status:**
```bash
launchctl list | grep rssfeed
```

**Stop service:**
```bash
launchctl unload ~/Library/LaunchAgents/com.rssfeed.service.plist
```

**Start service:**
```bash
launchctl load ~/Library/LaunchAgents/com.rssfeed.service.plist
launchctl start com.rssfeed.service
```

---

## What Happens If Computer Restarts?

**With auto-start set up:**
1. ✅ Computer boots up
2. ✅ launchd automatically starts the service (within 30-60 seconds)
3. ✅ Cloudflare Tunnel auto-starts (if set up)
4. ✅ Everything works automatically

**You don't need to do anything!**

---

## Troubleshooting

**Service won't start:**
```bash
# Check if port is in use
lsof -i :8080

# Check logs
tail -f ~/rss-feed-service/service-error.log

# Check launchd status
launchctl list | grep rssfeed
```

**Tunnel URL changes:**
- The free Cloudflare URL changes each time you restart the tunnel
- For a permanent URL, see `SIMPLE_CLOUDFLARE_SETUP.md` (requires Cloudflare account, but still free)

**Service stops after restart:**
```bash
# Reload launchd service
launchctl unload ~/Library/LaunchAgents/com.rssfeed.service.plist
launchctl load ~/Library/LaunchAgents/com.rssfeed.service.plist
launchctl start com.rssfeed.service
```

---

## Summary

**On Current Machine (Testing):**
1. Run `npm install`
2. Run `./start-local.sh`
3. Test: `curl http://localhost:8080/health`
4. Let it run 15 minutes to populate database

**On Dedicated Machine (24/7 Operation):**
1. Transfer `rss-feed-service` folder
2. Run `npm install`
3. Set up auto-start with launchd
4. Set up Cloudflare Tunnel
5. Update frontend URLs
6. Configure power settings

**Result:**
- ✅ Service runs 24/7 automatically
- ✅ Restarts automatically if it crashes
- ✅ Works after computer restarts
- ✅ FREE hosting (no cloud costs)
- ✅ All data stored locally in SQLite

