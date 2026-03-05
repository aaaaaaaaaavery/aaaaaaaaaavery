# Setting Up RSS Feed Service on Your Other Computer

## Quick Setup Guide for MacBook Pro 2015

This guide will help you set up the RSS feed service on your other computer (the 2015 MacBook Pro).

---

## Step 1: Transfer Files to Other Computer

### Option A: Using USB Drive / External Drive

1. **Copy the entire project folder:**
   - Copy: `/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service`
   - To your USB drive or external drive
   - Transfer to the other computer

2. **On the other computer:**
   - Place folder in: `/Users/[your-username]/rss-feed-service`
   - Or anywhere convenient (Desktop, Documents, etc.)

### Option B: Using Network/File Sharing

1. **Enable file sharing** on this computer
2. **Copy folder over network** to the other computer
3. **Place in desired location** on the other computer

### Option C: Using Git (if you have it set up)

```bash
# On other computer
git clone [your-repo-url]
cd rss-feed-service
```

---

## Step 2: Install Node.js on Other Computer

### Check if Node.js is installed:
```bash
node --version
```

### If not installed, install Node.js:

**Option 1: Download from nodejs.org**
1. Go to https://nodejs.org/
2. Download LTS version for macOS
3. Install the .pkg file
4. Verify: `node --version`

**Option 2: Using Homebrew (if installed)**
```bash
brew install node
```

**Verify installation:**
```bash
node --version  # Should show v18+ or v20+
npm --version   # Should show version number
```

---

## Step 3: Install Dependencies

On the other computer:

```bash
cd /path/to/rss-feed-service
npm install
```

This will install:
- express
- node-fetch
- cheerio
- rss
- node-cache
- xml

**Wait for installation to complete** (takes 1-2 minutes)

---

## Step 4: Test the Service

```bash
cd /path/to/rss-feed-service
node index.js
```

You should see:
```
RSS Feed Service running on port 8080
Available feeds: [number]
```

**Test it:**
- Open browser: `http://localhost:8080/health`
- Should see: `{"status":"ok"}`

**Press Ctrl+C to stop** (we'll set up auto-start next)

---

## Step 5: Set Up Auto-Start (So It Runs on Boot)

### Create launchd plist file:

```bash
nano ~/Library/LaunchAgents/com.rssfeed.service.plist
```

### Paste this content (UPDATE THE PATH!):

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
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
```

**IMPORTANT:** Replace `[YOUR-USERNAME]` with your actual username on the other computer!

**To find your username:**
```bash
whoami
```

### Load the service:

```bash
launchctl load ~/Library/LaunchAgents/com.rssfeed.service.plist
```

### Start it:

```bash
launchctl start com.rssfeed.service
```

### Check if it's running:

```bash
curl http://localhost:8080/health
```

Should return: `{"status":"ok"}`

---

## Step 6: Set Up Cloudflare Tunnel (For Internet Access)

### Install Cloudflare Tunnel:

```bash
brew install cloudflared
```

(If you don't have Homebrew, install it first: https://brew.sh)

### Create tunnel:

```bash
cloudflared tunnel --url http://localhost:8080
```

**You'll get a URL like:** `https://abc-123-def-456.trycloudflare.com`

**Copy this URL** - you'll need it for `index.html`

### Make Tunnel Auto-Start (Optional):

Create another launchd service for the tunnel:

```bash
nano ~/Library/LaunchAgents/com.rssfeed.tunnel.plist
```

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

**Note:** Update the cloudflared path if needed. Find it with:
```bash
which cloudflared
```

---

## Step 7: Update index.html

Replace all Cloud Run URLs with your new tunnel URL:

**Find and replace:**
```
https://rss-feed-service-124291936014.us-central1.run.app
```

**With your tunnel URL:**
```
https://abc-123-def-456.trycloudflare.com
```

---

## Step 8: Set Up Power Settings

**System Preferences → Energy Saver:**

1. **Computer sleep**: Set to "Never" (or 3+ hours)
2. **Display sleep**: Your choice (15 min is fine)
3. **Put hard disks to sleep**: OFF
4. **Prevent automatic sleep on power adapter**: ON

**IMPORTANT:** Keep the MacBook **plugged into power** at all times!

---

## Step 9: Set Up Refresh Script (Cron Job)

The refresh script will keep feeds updated:

```bash
crontab -e
```

Add this line:
```cron
*/15 * * * * cd /Users/[YOUR-USERNAME]/rss-feed-service && /usr/local/bin/node refresh-bundle.js >> /Users/[YOUR-USERNAME]/rss-feed-service/refresh.log 2>&1
```

**Update the path** to match where you put the service!

---

## What Happens If Computer Goes Off?

### Scenario 1: Computer Restarts (Update, Power Outage, etc.)

**With auto-start set up:**
1. ✅ Computer boots up
2. ✅ launchd automatically starts the service
3. ✅ Service is running within 30-60 seconds
4. ✅ Cloudflare Tunnel auto-starts (if set up)
5. ✅ Everything works automatically

**You don't need to do anything!**

### Scenario 2: Computer Sleeps (Display Off)

**If power settings are correct:**
- ✅ Computer stays awake (doesn't sleep)
- ✅ Service keeps running
- ✅ Everything continues working

### Scenario 3: Computer Crashes/Freezes

**If service crashes:**
- ✅ `KeepAlive: true` in launchd will restart it automatically
- ✅ Service restarts within seconds
- ✅ Check logs if it keeps crashing: `tail -f service-error.log`

### Scenario 4: Power Outage

**When power comes back:**
1. Computer boots up
2. launchd starts service automatically
3. Service is running
4. **You may need to restart Cloudflare Tunnel** (if not set up with launchd)

**To check if service is running after restart:**
```bash
curl http://localhost:8080/health
```

---

## Verification Checklist

After setup, verify everything works:

- [ ] Service starts: `curl http://localhost:8080/health` returns `{"status":"ok"}`
- [ ] Test a feed: `curl http://localhost:8080/feeds/nfl-com.xml` returns RSS
- [ ] Tunnel works: Use tunnel URL in browser, should see service
- [ ] Auto-start works: Restart computer, service should start automatically
- [ ] Refresh script works: Check `refresh.log` after 15 minutes
- [ ] Logs are being written: `tail -f service.log`

---

## Troubleshooting

### Service won't start:
```bash
# Check if port is in use
lsof -i :8080

# Check logs
tail -f service-error.log

# Check launchd status
launchctl list | grep rssfeed
```

### Tunnel URL changes:
- Use Cloudflare account for permanent URL (see RUNNING_LOCALLY.md)
- Or note the URL and update index.html when it changes

### Service stops after restart:
```bash
# Reload launchd service
launchctl unload ~/Library/LaunchAgents/com.rssfeed.service.plist
launchctl load ~/Library/LaunchAgents/com.rssfeed.service.plist
launchctl start com.rssfeed.service
```

---

## Quick Reference Commands

```bash
# Start service manually
cd /path/to/rss-feed-service
node index.js

# Check if running
curl http://localhost:8080/health

# View logs
tail -f service.log

# Stop service (if running manually)
# Press Ctrl+C

# Restart launchd service
launchctl stop com.rssfeed.service
launchctl start com.rssfeed.service

# Check service status
launchctl list | grep rssfeed
```

---

## Files to Transfer

**Essential files:**
- ✅ `rss-feed-service/` (entire folder)
- ✅ `package.json` (dependencies list)
- ✅ All `.js` files (service code)
- ✅ `node_modules/` (can reinstall with `npm install`)

**Optional (can recreate):**
- `refresh.log` (will be created automatically)
- `.refresh-state.json` (will be created automatically)
- `service.log` (will be created automatically)

**You can skip:**
- `node_modules/` (reinstall with `npm install` - faster than transferring)

---

## Summary

1. **Transfer** `rss-feed-service` folder to other computer
2. **Install** Node.js on other computer
3. **Run** `npm install` to install dependencies
4. **Set up** auto-start with launchd
5. **Set up** Cloudflare Tunnel for internet access
6. **Update** `index.html` with new tunnel URL
7. **Configure** power settings
8. **Set up** cron job for refresh script

**After setup:**
- ✅ Service runs automatically on boot
- ✅ Restarts automatically if it crashes
- ✅ Works 24/7 without intervention
- ✅ FREE hosting!

**If computer goes off:**
- ✅ Service auto-starts when computer boots
- ✅ Everything picks up where it left off
- ✅ No manual intervention needed

