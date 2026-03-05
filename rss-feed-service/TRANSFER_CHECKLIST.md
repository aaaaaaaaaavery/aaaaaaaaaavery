# Transfer Checklist: Moving RSS Feed Service to Other Computer

## Pre-Transfer Checklist (This Computer)

### Step 1: Verify Everything Works Here First
- [ ] Install dependencies: `npm install`
- [ ] Test service starts: `node index.js`
- [ ] Test a feed: `curl http://localhost:8080/feeds/nfl-com.xml`
- [ ] Verify no errors in console

### Step 2: Prepare Files for Transfer

**Files to Transfer:**
- [ ] `package.json` - Dependencies list
- [ ] `index.js` - Main service file
- [ ] `scraper.js` - Scraping logic
- [ ] `browser-scraper.js` - Browser scraping module
- [ ] `youtube-rss.js` - YouTube feed handler
- [ ] `x-twitter-rss.js` - Twitter feed handler
- [ ] `rsshub-integration.js` - RSSHub integration
- [ ] `bundle-rss.js` - Bundle feed handler
- [ ] `refresh-bundle.js` - Refresh script
- [ ] All `.md` documentation files
- [ ] `QUICK_SETUP_SCRIPT.sh` - Setup script

**Files to SKIP (Don't Transfer):**
- [ ] `node_modules/` - Too large, will reinstall on other computer
- [ ] `.refresh-state.json` - Will be created automatically
- [ ] `service.log` - Logs will be created automatically
- [ ] `refresh.log` - Logs will be created automatically

### Step 3: Choose Transfer Method

**Option A: USB Drive / External Drive**
- [ ] Copy entire `rss-feed-service` folder to USB drive
- [ ] Exclude `node_modules/` folder (or delete it before copying)
- [ ] Transfer to other computer
- [ ] Copy folder to desired location on other computer

**Option B: Network File Sharing**
- [ ] Enable file sharing on this computer
- [ ] Share `rss-feed-service` folder
- [ ] Copy folder over network to other computer
- [ ] Place in desired location on other computer

**Option C: Cloud Storage (Dropbox, iCloud, etc.)**
- [ ] Upload `rss-feed-service` folder to cloud
- [ ] Download on other computer
- [ ] Place in desired location

**Option D: Git (if you have a repository)**
- [ ] Commit and push changes
- [ ] Clone on other computer: `git clone [repo-url]`

---

## Post-Transfer Checklist (Other Computer)

### Step 1: Verify Files Transferred
- [ ] Check that all `.js` files are present
- [ ] Check that `package.json` is present
- [ ] Check that documentation files are present
- [ ] Verify `node_modules/` is NOT present (will install fresh)

### Step 2: Install Node.js (if needed)
- [ ] Check if Node.js is installed: `node --version`
- [ ] If not installed, download from https://nodejs.org/
- [ ] Install Node.js LTS version
- [ ] Verify: `node --version` and `npm --version`

### Step 3: Install Dependencies
- [ ] Navigate to `rss-feed-service` folder
- [ ] Run: `npm install`
- [ ] Wait for installation (2-5 minutes, downloads Chromium)
- [ ] Verify `node_modules/` folder was created

### Step 4: Test the Service
- [ ] Start service: `node index.js`
- [ ] Check for errors in console
- [ ] Test health endpoint: `curl http://localhost:8080/health`
- [ ] Test a feed: `curl http://localhost:8080/feeds/nfl-com.xml`
- [ ] Stop service: Press `Ctrl+C`

### Step 5: Set Up Auto-Start
- [ ] Run setup script: `./QUICK_SETUP_SCRIPT.sh`
- [ ] OR follow manual setup in `SETUP_ON_OTHER_COMPUTER.md`
- [ ] Verify service auto-starts: Restart computer, check if service runs

### Step 6: Set Up Cloudflare Tunnel (for internet access)
- [ ] Install Cloudflare Tunnel: `brew install cloudflared`
- [ ] Create tunnel: `cloudflared tunnel --url http://localhost:8080`
- [ ] Copy the tunnel URL
- [ ] Update `index.html` with new tunnel URL

### Step 7: Set Up Refresh Script
- [ ] Set up cron job (see `SETUP_LOCAL_SCHEDULER.md`)
- [ ] Verify refresh script runs: Check `refresh.log` after 15 minutes

### Step 8: Configure Power Settings
- [ ] System Preferences → Energy Saver
- [ ] Computer sleep: Never (or 3+ hours)
- [ ] Display sleep: Your choice
- [ ] Put hard disks to sleep: OFF
- [ ] Keep computer plugged into power

---

## Quick Transfer Commands

### On This Computer (Prepare):

```bash
cd "/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service"

# Remove node_modules if you want to reduce size
rm -rf node_modules

# Create a clean copy for transfer (excludes node_modules, logs, cache)
tar -czf rss-feed-service-transfer.tar.gz \
  --exclude='node_modules' \
  --exclude='*.log' \
  --exclude='.refresh-state.json' \
  --exclude='.DS_Store' \
  .
```

### On Other Computer (Extract):

```bash
# Extract the archive
tar -xzf rss-feed-service-transfer.tar.gz

# Install dependencies
cd rss-feed-service
npm install
```

---

## Verification Steps

### After Transfer, Verify:

1. **Files are present:**
   ```bash
   ls -la rss-feed-service/
   # Should see: index.js, scraper.js, browser-scraper.js, package.json, etc.
   ```

2. **Dependencies installed:**
   ```bash
   ls -la rss-feed-service/node_modules/
   # Should see many folders including: puppeteer, express, cheerio, etc.
   ```

3. **Service starts:**
   ```bash
   cd rss-feed-service
   node index.js
   # Should see: "RSS Feed Service running on port 8080"
   ```

4. **Service works:**
   ```bash
   curl http://localhost:8080/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

---

## Troubleshooting

### "Cannot find module 'puppeteer'"
- Run `npm install` on the other computer
- Don't transfer `node_modules/`, install fresh

### "Permission denied" on setup script
- Run: `chmod +x QUICK_SETUP_SCRIPT.sh`

### Service won't start
- Check Node.js version: `node --version` (should be v18+)
- Check for port conflicts: `lsof -i :8080`
- Check logs: `tail -f service-error.log`

### Browser scraping fails
- Check if Chromium downloaded: `ls node_modules/puppeteer/.local-chromium/`
- Reinstall if needed: `rm -rf node_modules && npm install`

---

## Summary

**Key Points:**
- ✅ Transfer code files, NOT `node_modules/`
- ✅ Install dependencies on the other computer (`npm install`)
- ✅ Test everything on this computer first
- ✅ Follow `SETUP_ON_OTHER_COMPUTER.md` for complete setup
- ✅ Use `QUICK_SETUP_SCRIPT.sh` for automated setup

**Time Estimate:**
- Transfer: 5-10 minutes
- Install dependencies: 2-5 minutes
- Setup: 10-15 minutes
- **Total: ~20-30 minutes**

