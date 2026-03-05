# Complete Setup Guide: Local RSS Service for thporth.com

Since your frontend is at `thporth.com`, we need to expose your local service to the internet. Here's the complete walkthrough:

## Step 1: Install Dependencies

```bash
cd rss-feed-service
npm install
```

This installs `better-sqlite3` for the local SQLite database.

## Step 2: Install ngrok (to expose local service to internet)

**On macOS:**
```bash
brew install ngrok
```

**Or download from:** https://ngrok.com/download

**Sign up for free account:**
1. Go to https://dashboard.ngrok.com/signup
2. Sign up (free)
3. Get your authtoken from dashboard
4. Run: `ngrok config add-authtoken YOUR_AUTH_TOKEN`

## Step 3: Start the Local RSS Feed Service

**Terminal 1:**
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

**Keep this terminal open!** The service must stay running.

## Step 4: Expose Local Service with ngrok

**Terminal 2 (new terminal window):**
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
- **The URL stays the same as long as ngrok keeps running**
- **Only changes if you restart ngrok** (close and reopen it)
- **Solution:** Keep ngrok running 24/7, or use Cloudflare Tunnel (see below) for a more stable URL

## Step 5: Update Frontend URLs

I've created a script to update all URLs in `index (1).html`. Run:

```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX
./update-rss-urls.sh https://YOUR_NGROK_URL.ngrok-free.app
```

Replace `YOUR_NGROK_URL` with your actual ngrok URL.

**Or manually:** Use find/replace in your editor:
- Find: `https://rss-feed-service-124291936014.us-central1.run.app`
- Replace: `https://YOUR_NGROK_URL.ngrok-free.app`

## Step 6: Upload Updated Frontend

After updating URLs, upload the updated `index (1).html` to your `thporth.com` server.

## Step 7: Test

1. Visit `thporth.com`
2. Check if RSS feeds are loading
3. Check browser console (F12) for any errors

## Step 8: Keep Running 24/7

You need **both terminals running continuously**:

**Terminal 1:** RSS Feed Service
```bash
cd rss-feed-service
./start-local.sh
```

**Terminal 2:** ngrok tunnel
```bash
ngrok http 8080
```

### Run in Background (Recommended)

**Terminal 1:**
```bash
cd rss-feed-service
nohup ./start-local.sh > service.log 2>&1 &
```

**Terminal 2:**
```bash
nohup ngrok http 8080 > ngrok.log 2>&1 &
```

**Check if running:**
```bash
ps aux | grep "node index.js"
ps aux | grep ngrok
```

**View logs:**
```bash
tail -f rss-feed-service/service.log
tail -f ngrok.log
```

## Alternative: Cloudflare Tunnel (RECOMMENDED - More Stable URL)

**Use this instead of ngrok if you want a more stable URL that doesn't change:**

### Install:
```bash
brew install cloudflare/cloudflare/cloudflared
```

### Set up:
```bash
# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create rss-feed-service

# Run tunnel (gives you a permanent URL)
cloudflared tunnel run rss-feed-service
```

This gives you a URL like: `https://rss-feed-service-abc123.trycloudflare.com` that doesn't change.

## Database Location

Your feed data is stored in:
```
rss-feed-service/feed_items.db
```

**Backup:** Just copy this file  
**Restore:** Replace the file

## Troubleshooting

### Service won't start
```bash
# Check if port 8080 is in use
lsof -i :8080

# Kill process if needed
kill -9 $(lsof -t -i:8080)
```

### ngrok URL not working
- Make sure ngrok is still running
- Check ngrok dashboard: https://dashboard.ngrok.com/
- Try restarting ngrok

### Frontend can't access feeds
- Check CORS (should be set to allow all origins)
- Check browser console for errors
- Verify ngrok URL is correct in frontend
- Make sure both services are running

### Background job not running
```bash
# Check service logs
tail -f rss-feed-service/service.log

# Check if running
ps aux | grep "node index.js"
```

## Cost

**Before:** ~$21-26/month (Cloud Run + Firestore)  
**Now:** **$0/month** ✅

## Quick Reference

**Start services:**
```bash
# Terminal 1
cd rss-feed-service && ./start-local.sh

# Terminal 2
ngrok http 8080
```

**Update frontend:**
```bash
./update-rss-urls.sh https://YOUR_NGROK_URL.ngrok-free.app
```

**Check status:**
```bash
ps aux | grep "node index.js"
ps aux | grep ngrok
```

