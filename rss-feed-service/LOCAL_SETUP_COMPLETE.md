# Complete Local Setup Guide for thporth.com

This guide walks you through setting up the RSS feed service locally and exposing it so your frontend at `thporth.com` can access it.

## Step 1: Install Dependencies

```bash
cd rss-feed-service
npm install
```

This installs `better-sqlite3` for the local database.

## Step 2: Install ngrok (to expose local service to internet)

**Option A: Homebrew (macOS)**
```bash
brew install ngrok
```

**Option B: Direct Download**
1. Go to https://ngrok.com/download
2. Download for macOS
3. Unzip and move to `/usr/local/bin/` or add to PATH

**Option C: npm (if you prefer)**
```bash
npm install -g ngrok
```

## Step 3: Sign up for ngrok (Free)

1. Go to https://dashboard.ngrok.com/signup
2. Sign up for free account
3. Get your authtoken from the dashboard
4. Run: `ngrok config add-authtoken YOUR_AUTH_TOKEN`

## Step 4: Start the Local RSS Feed Service

In one terminal window:

```bash
cd rss-feed-service
./start-local.sh
```

You should see:
```
🚀 Starting RSS Feed Service locally (FREE - uses SQLite instead of Firestore)
Service will run on: http://localhost:8080
Background job runs every 15 minutes
```

**Keep this terminal open!** The service needs to stay running.

## Step 5: Expose Local Service to Internet with ngrok

In a **second terminal window**:

```bash
ngrok http 8080
```

You'll see output like:
```
Forwarding  https://abc123xyz.ngrok-free.app -> http://localhost:8080
```

**Copy the HTTPS URL** (e.g., `https://abc123xyz.ngrok-free.app`)

**Important:** 
- Keep this terminal open too!
- The URL changes each time you restart ngrok (unless you have a paid plan with static domain)
- Free ngrok URLs expire after 2 hours of inactivity, but stay active as long as ngrok is running

## Step 6: Update Frontend to Use Local Service

You need to update `index (1).html` to use your ngrok URL instead of the Cloud Run URL.

**Find and replace:**
- Old: `https://rss-feed-service-124291936014.us-central1.run.app/feeds/`
- New: `https://YOUR_NGROK_URL.ngrok-free.app/feeds/`

**Example:**
```javascript
// Old
data-url="https://rss-feed-service-124291936014.us-central1.run.app/feeds/newsnow-premierleague.xml"

// New
data-url="https://abc123xyz.ngrok-free.app/feeds/newsnow-premierleague.xml"
```

## Step 7: Test It

1. Visit your site at `thporth.com`
2. Check if RSS feeds are loading
3. Check the browser console for any errors

## Step 8: Keep Services Running 24/7

You need **both** terminals running:

**Terminal 1:** RSS Feed Service
```bash
cd rss-feed-service
./start-local.sh
```

**Terminal 2:** ngrok tunnel
```bash
ngrok http 8080
```

### Option: Run in Background (Recommended)

**Terminal 1 (RSS Service):**
```bash
cd rss-feed-service
nohup ./start-local.sh > service.log 2>&1 &
```

**Terminal 2 (ngrok):**
```bash
nohup ngrok http 8080 > ngrok.log 2>&1 &
```

Check if running:
```bash
ps aux | grep "node index.js"
ps aux | grep ngrok
```

## Alternative: Cloudflare Tunnel (More Reliable, Free)

If ngrok is too unreliable, use Cloudflare Tunnel (completely free, no time limits):

### Install Cloudflare Tunnel

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### Set up Tunnel

```bash
# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create rss-feed-service

# Run tunnel
cloudflared tunnel run rss-feed-service
```

This gives you a permanent URL like: `https://rss-feed-service-abc123.trycloudflare.com`

## Database Location

Your feed data is stored in:
```
rss-feed-service/feed_items.db
```

**Backup:** Just copy this file
**Restore:** Replace the file

## Troubleshooting

### Service won't start
- Check port 8080: `lsof -i :8080`
- Check Node.js: `node --version` (should be 18+)

### ngrok URL not working
- Make sure ngrok is still running
- Check ngrok dashboard for status
- Try restarting ngrok

### Frontend can't access feeds
- Check CORS headers (should be set to allow all origins)
- Check browser console for errors
- Verify ngrok URL is correct in frontend

### Background job not running
- Check service logs: `tail -f service.log`
- Make sure service is actually running: `ps aux | grep "node index.js"`

## Cost Comparison

**Before (Cloud):**
- Cloud Run: ~$10-15/month
- Firestore: ~$11/month
- **Total: ~$21-26/month**

**Now (Local):**
- ngrok: **FREE** (or Cloudflare Tunnel: **FREE**)
- SQLite: **FREE**
- **Total: $0/month** ✅

## Important Notes

⚠️ **Your computer must stay on 24/7** for the service to work  
⚠️ **ngrok free URLs change** each time you restart (unless you pay for static domain)  
⚠️ **Internet connection required** for fetching RSS feeds  
⚠️ **Backup the database file** (`feed_items.db`) regularly

## Quick Start Commands

```bash
# Terminal 1: Start RSS service
cd rss-feed-service
./start-local.sh

# Terminal 2: Expose with ngrok
ngrok http 8080

# Then update frontend URLs to use the ngrok URL
```

