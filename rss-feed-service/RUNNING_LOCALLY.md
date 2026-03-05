# Running RSS Feed Service Locally (FREE)

## Overview

You can run the entire RSS feed service on your local machine for **FREE** instead of using Cloud Run. This eliminates all hosting costs.

## Current Setup vs Local Setup

### Current (Cloud Run):
- ✅ Service always available (24/7)
- ✅ Public URL: `https://rss-feed-service-124291936014.us-central1.run.app`
- ❌ Costs: ~$5-20/month
- ✅ Auto-scaling
- ✅ No maintenance

### Local Machine:
- ✅ **FREE** (no hosting costs)
- ✅ Full control
- ❌ Computer must be on 24/7
- ❌ Need to expose to internet (port forwarding)
- ❌ Dynamic IP address handling
- ❌ Security considerations

---

## Option 1: Local-Only (No Internet Access)

**Simplest option** - Service only accessible on your local network.

### Setup:

1. **Start the service locally:**
```bash
cd rss-feed-service
node index.js
```

2. **Access feeds locally:**
- `http://localhost:8080/feeds/nfl-com.xml`
- `http://localhost:8080/bundle/home-videos.xml`

3. **Update `index.html` to use localhost:**
```javascript
// Change from:
'https://rss-feed-service-124291936014.us-central1.run.app/feeds/nfl-com.xml'

// To:
'http://localhost:8080/feeds/nfl-com.xml'
```

**Limitations:**
- Only works when viewing site on your computer
- Won't work for other users or when deployed online

---

## Option 2: Expose to Internet (Recommended for Free Hosting)

Make your local service accessible from the internet so your website can use it.

### Step 1: Run Service Locally

```bash
cd rss-feed-service
node index.js
```

Service runs on `http://localhost:8080`

### Step 2: Expose to Internet

You have several options:

#### A. **ngrok** (Easiest - Free tier available)
```bash
# Install ngrok
brew install ngrok  # or download from ngrok.com

# Expose port 8080
ngrok http 8080
```

**Result:** You get a public URL like `https://abc123.ngrok.io`

**Pros:**
- ✅ Super easy (2 commands)
- ✅ Free tier available
- ✅ HTTPS included
- ✅ Works immediately

**Cons:**
- ❌ Free tier: URL changes each time you restart
- ❌ Free tier: Limited requests/month
- ❌ Paid tier: $8/month for static URL

#### B. **Cloudflare Tunnel** (Free, Permanent URL)
```bash
# Install cloudflared
brew install cloudflared

# Create tunnel
cloudflared tunnel --url http://localhost:8080
```

**Pros:**
- ✅ Completely FREE
- ✅ Permanent URL (doesn't change)
- ✅ HTTPS included
- ✅ No limits

**Cons:**
- ❌ Slightly more setup
- ❌ Need Cloudflare account (free)

#### C. **Port Forwarding** (Free, but complex)
1. Set up port forwarding on your router
2. Get static IP or use dynamic DNS (DuckDNS, No-IP)
3. Point domain to your IP

**Pros:**
- ✅ Completely FREE
- ✅ Full control

**Cons:**
- ❌ Complex setup
- ❌ Security risks (exposing your home network)
- ❌ Requires router access
- ❌ ISP may block port 80/443

---

## Option 3: Hybrid Approach (Best of Both Worlds)

**Keep Cloud Run for production, use local for development/testing**

### Setup:

1. **Local development:**
```bash
# Run locally
node index.js

# Use localhost URLs in development
```

2. **Production:**
- Keep Cloud Run URL for live site
- Only pay for what you use

---

## Recommended: Cloudflare Tunnel (Free, Permanent)

### Step-by-Step Setup:

1. **Install Cloudflare Tunnel:**
```bash
brew install cloudflared
```

2. **Run your service:**
```bash
cd rss-feed-service
node index.js
```

3. **In another terminal, create tunnel:**
```bash
cloudflared tunnel --url http://localhost:8080
```

4. **You'll get a URL like:**
```
https://random-words-1234.trycloudflare.com
```

5. **Update `index.html` with the new URL:**
```javascript
// Replace Cloud Run URLs with your tunnel URL
'https://random-words-1234.trycloudflare.com/feeds/nfl-com.xml'
```

### Making URL Permanent:

1. **Create Cloudflare account** (free at cloudflare.com)
2. **Create named tunnel:**
```bash
cloudflared tunnel create rss-feed-service
cloudflared tunnel route dns rss-feed-service feeds.yourdomain.com
cloudflared tunnel run rss-feed-service
```

3. **Now you have:** `https://feeds.yourdomain.com` (permanent, free)

---

## Auto-Start on Boot (macOS)

Make the service start automatically when your computer boots:

### Using launchd:

1. **Create plist file:**
```bash
nano ~/Library/LaunchAgents/com.rssfeed.service.plist
```

2. **Add this content:**
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
        <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/service.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/avery/Downloads/Copy of THPORTHINDEX/rss-feed-service/service-error.log</string>
</dict>
</plist>
```

3. **Load the service:**
```bash
launchctl load ~/Library/LaunchAgents/com.rssfeed.service.plist
```

4. **Start it:**
```bash
launchctl start com.rssfeed.service
```

---

## Cost Comparison

| Setup | Monthly Cost | Reliability | Complexity |
|-------|-------------|-------------|------------|
| **Cloud Run** | $5-20 | ⭐⭐⭐⭐⭐ | ⭐ Easy |
| **Local + ngrok (free)** | $0 | ⭐⭐⭐ | ⭐⭐ Medium |
| **Local + Cloudflare Tunnel** | $0 | ⭐⭐⭐⭐ | ⭐⭐ Medium |
| **Local + Port Forwarding** | $0 | ⭐⭐⭐ | ⭐⭐⭐⭐ Hard |

---

## Security Considerations

### If Exposing to Internet:

1. **Firewall:** Only expose port 8080, block others
2. **Rate Limiting:** Add rate limiting to prevent abuse
3. **Authentication:** Consider adding API keys (optional)
4. **HTTPS:** Use Cloudflare Tunnel or ngrok (both provide HTTPS)

### Current Service Security:

The service is already relatively safe:
- ✅ Read-only (no data modification)
- ✅ No authentication required (public feeds)
- ✅ Rate limiting via cache (15 min cache)

---

## Recommendation

**For FREE hosting:**
1. Use **Cloudflare Tunnel** (free, permanent URL)
2. Set up auto-start with launchd
3. Keep computer on 24/7 (or use a Raspberry Pi / old computer)

**For reliability:**
- Keep Cloud Run as backup
- Or use both (local primary, Cloud Run fallback)

---

## Quick Start (Cloudflare Tunnel)

```bash
# Terminal 1: Start service
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX/rss-feed-service
node index.js

# Terminal 2: Create tunnel
cloudflared tunnel --url http://localhost:8080

# Copy the URL it gives you (e.g., https://abc-123.trycloudflare.com)
# Update index.html with this URL
```

**That's it!** Your service is now accessible from the internet for FREE.

---

## Troubleshooting

### Service won't start:
- Check if port 8080 is already in use: `lsof -i :8080`
- Kill existing process: `kill -9 <PID>`

### Tunnel URL changes:
- Use Cloudflare account for permanent URL
- Or use ngrok paid tier ($8/month)

### Service stops when computer sleeps:
- Use `caffeinate` on macOS to prevent sleep
- Or set up auto-start so it restarts when computer wakes

### Can't access from internet:
- Check firewall settings
- Verify tunnel is running
- Check router port forwarding (if using that method)

