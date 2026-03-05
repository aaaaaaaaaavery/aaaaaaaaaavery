# Quick Setup: Cloudflare Free URL (3 Steps)

## Step 1: Install & Setup (One Time)

```bash
# Install
brew install cloudflare/cloudflare/cloudflared

# Authenticate (opens browser)
cloudflared tunnel login

# Create tunnel (one time)
cloudflared tunnel create rss-feed-service
```

## Step 2: Start Services (2 Terminals)

**Terminal 1 - Cloudflare Tunnel:**
```bash
cd rss-feed-service
./start-cloudflare-simple.sh
```
**Copy the URL it shows** (e.g., `https://rss-feed-service-abc123.trycloudflare.com`)

**Terminal 2 - RSS Service:**
```bash
cd rss-feed-service
./start-local.sh
```

## Step 3: Update Frontend

```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX
./update-rss-urls.sh https://YOUR_URL_FROM_STEP_2.trycloudflare.com
```

Then commit and push to GitHub.

**Done!** Your feeds will work at `thporth.com` using the free Cloudflare URL.

## Keep Running

Keep both terminals open, or run in background:
```bash
# Terminal 1
nohup ./start-cloudflare-simple.sh > tunnel.log 2>&1 &

# Terminal 2
cd rss-feed-service && nohup ./start-local.sh > service.log 2>&1 &
```

