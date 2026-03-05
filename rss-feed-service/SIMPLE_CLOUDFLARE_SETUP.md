# Simple Setup: Cloudflare Tunnel with Free URL (No DNS Changes)

This is the easiest setup - no DNS configuration needed!

## Step 1: Install Cloudflare Tunnel

```bash
brew install cloudflare/cloudflare/cloudflared
```

Verify it worked:
```bash
cloudflared --version
```

## Step 2: Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This will:
1. Open your browser
2. Ask you to log in to Cloudflare (create free account if needed)
3. Authorize the tunnel

**Note:** You don't need to add your domain to Cloudflare - just log in with any account.

## Step 3: Create the Tunnel

```bash
cloudflared tunnel create rss-feed-service
```

You'll see:
```
Created tunnel rss-feed-service with id abc123-xyz-456...
```

## Step 4: Run the Tunnel (Get Your Free URL)

```bash
cloudflared tunnel run rss-feed-service
```

You'll see output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://rss-feed-service-abc123.trycloudflare.com                                        |
+--------------------------------------------------------------------------------------------+
```

**Copy this URL!** (e.g., `https://rss-feed-service-abc123.trycloudflare.com`)

**Keep this terminal open!** The tunnel must stay running.

## Step 5: Start the RSS Feed Service

**Open a NEW terminal window:**

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

**Keep this terminal open too!**

## Step 6: Update Frontend URLs

**Open a THIRD terminal window:**

```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX
./update-rss-urls.sh https://rss-feed-service-abc123.trycloudflare.com
```

Replace `rss-feed-service-abc123.trycloudflare.com` with your actual URL from Step 4.

This will:
- Replace all 257 URLs in `index (1).html`
- Create a backup file
- Show you how many URLs were updated

## Step 7: Commit and Push to GitHub

```bash
git add "index (1).html"
git commit -m "Update RSS feed URLs to Cloudflare Tunnel"
git push
```

## Step 8: Test

1. Visit `thporth.com`
2. Check if RSS feeds are loading
3. Open browser console (F12) to check for errors

## Keep Running 24/7

You need **2 terminals running continuously**:

**Terminal 1:** Cloudflare Tunnel
```bash
cloudflared tunnel run rss-feed-service
```

**Terminal 2:** RSS Feed Service
```bash
cd rss-feed-service
./start-local.sh
```

### Run in Background (Recommended)

**Terminal 1:**
```bash
nohup cloudflared tunnel run rss-feed-service > tunnel.log 2>&1 &
```

**Terminal 2:**
```bash
cd rss-feed-service
nohup ./start-local.sh > service.log 2>&1 &
```

**Check if running:**
```bash
ps aux | grep cloudflared
ps aux | grep "node index.js"
```

**View logs:**
```bash
tail -f tunnel.log
tail -f rss-feed-service/service.log
```

## Your URL

Your permanent URL will be something like:
```
https://rss-feed-service-abc123.trycloudflare.com
```

**This URL:**
- ✅ Never changes (as long as tunnel keeps running)
- ✅ Free
- ✅ Automatic HTTPS
- ✅ No DNS configuration needed

## Troubleshooting

### Tunnel won't start
```bash
# Check if tunnel exists
cloudflared tunnel list

# Delete and recreate if needed
cloudflared tunnel delete rss-feed-service
cloudflared tunnel create rss-feed-service
```

### Service not accessible
- Check RSS service is running: `ps aux | grep "node index.js"`
- Check tunnel is running: `ps aux | grep cloudflared`
- Test locally: `curl http://localhost:8080/feeds/newsnow-premierleague.xml`
- Test tunnel: `curl https://rss-feed-service-abc123.trycloudflare.com/feeds/newsnow-premierleague.xml`

### Frontend can't access feeds
- Check CORS (should be enabled - already set in code)
- Check browser console for errors
- Verify URL is correct in frontend

## Quick Reference

**Start everything:**
```bash
# Terminal 1
cloudflared tunnel run rss-feed-service

# Terminal 2
cd rss-feed-service && ./start-local.sh
```

**Your URL:** `https://rss-feed-service-abc123.trycloudflare.com` (from Step 4)

**Cost:** $0/month ✅

