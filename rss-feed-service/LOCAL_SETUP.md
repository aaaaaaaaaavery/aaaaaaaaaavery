# Local Setup Guide (FREE - No Cloud Costs)

This guide shows you how to run the RSS feed service locally using SQLite instead of Firestore. **This is completely FREE** - no cloud costs at all!

## Benefits

✅ **FREE** - No Cloud Run, Firestore, or any cloud costs  
✅ **Fast** - Local database is instant  
✅ **Simple** - Just run on your machine  
✅ **Full Control** - All data stays on your computer  

## Requirements

- Node.js installed
- Your computer needs to stay on 24/7 (or at least when you want feeds updated)
- Internet connection for fetching RSS feeds

## Setup Steps

### 1. Install Dependencies

```bash
cd rss-feed-service
npm install
```

This will install `better-sqlite3` for the local database.

### 2. Start the Service Locally

```bash
./start-local.sh
```

Or manually:

```bash
export USE_LOCAL_DB=true
node index.js
```

The service will start on `http://localhost:8080`

### 3. Update Frontend to Use Local Service

If your frontend is also running locally, update the feed URLs in `index (1).html`:

Change from:
```javascript
https://rss-feed-service-124291936014.us-central1.run.app/feeds/
```

To:
```javascript
http://localhost:8080/feeds/
```

### 4. Keep Service Running 24/7

The background job runs every 15 minutes via `setInterval`. To keep it running:

**Option A: Terminal (Simple)**
- Just keep the terminal open
- Service runs as long as terminal is open

**Option B: Background Process (Recommended)**
```bash
# Run in background
nohup node index.js > service.log 2>&1 &

# Check if running
ps aux | grep "node index.js"

# Stop it
pkill -f "node index.js"
```

**Option C: System Service (macOS/Linux)**
Create a launchd service (macOS) or systemd service (Linux) to auto-start on boot.

## Database Location

The SQLite database is stored at:
```
rss-feed-service/feed_items.db
```

This file contains all your feed data. You can:
- Backup: Just copy this file
- Restore: Replace the file
- View: Use any SQLite browser tool

## How It Works

1. **Background Job**: Runs every 15 minutes, fetches all feeds, extracts direct URLs, stores in SQLite
2. **Frontend Requests**: Serves instantly from SQLite database (no scraping on request)
3. **Data Accumulation**: Keeps up to 80 posts per feed (accumulates over time)

## Cost Comparison

**Cloud Setup:**
- Cloud Run: ~$10-15/month (always-on instance)
- Firestore: ~$11/month (32 feeds)
- **Total: ~$21-26/month**

**Local Setup:**
- **$0/month** ✅

## Limitations

⚠️ **Your computer must be on** for the service to run  
⚠️ **No automatic restart** if your computer crashes/restarts (unless you set up a service)  
⚠️ **Local network only** - unless you expose it to the internet (port forwarding, ngrok, etc.)

## Exposing to Internet (Optional)

If you want the frontend (hosted elsewhere) to access your local service:

**Option 1: ngrok (Easiest)**
```bash
ngrok http 8080
```
This gives you a public URL like `https://abc123.ngrok.io` that forwards to your local service.

**Option 2: Port Forwarding**
Set up port forwarding on your router to forward port 8080 to your computer.

**Option 3: VPN**
Use a VPN to access your local network.

## Monitoring

Check the service logs:
```bash
tail -f service.log
```

Or if running in terminal, logs appear directly.

## Troubleshooting

**Service won't start:**
- Check if port 8080 is already in use: `lsof -i :8080`
- Check Node.js version: `node --version` (should be 18+)

**Database errors:**
- Check file permissions on `feed_items.db`
- Delete `feed_items.db` to start fresh (loses all cached data)

**Background job not running:**
- Check service is actually running: `ps aux | grep "node index.js"`
- Check logs for errors

## Migration from Cloud to Local

1. Stop Cloud Run service (optional - you can run both)
2. Start local service: `./start-local.sh`
3. Update frontend URLs to point to local service
4. Background job will populate SQLite database on first run

## Migration from Local to Cloud

1. Deploy to Cloud Run: `./deploy.sh YOUR_API_KEY`
2. Update frontend URLs to point to Cloud Run
3. Background job will populate Firestore on first run

