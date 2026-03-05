# Quick Start: Local RSS Service for thporth.com

## 1. Install Dependencies
```bash
cd rss-feed-service
npm install
```

## 2. Install ngrok
```bash
brew install ngrok
ngrok config add-authtoken YOUR_TOKEN  # Get token from https://dashboard.ngrok.com
```

## 3. Start Services (2 terminals)

**Terminal 1:**
```bash
cd rss-feed-service
./start-local.sh
```

**Terminal 2:**
```bash
ngrok http 8080
# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
```

## 4. Update Frontend
```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX
./update-rss-urls.sh https://YOUR_NGROK_URL.ngrok-free.app
```

## 5. Upload & Test
- Upload updated `index (1).html` to thporth.com
- Visit site and test feeds

## Keep Running 24/7
Both terminals must stay open. Or run in background:
```bash
# Terminal 1
cd rss-feed-service && nohup ./start-local.sh > service.log 2>&1 &

# Terminal 2  
nohup ngrok http 8080 > ngrok.log 2>&1 &
```

## Cost: $0/month ✅

