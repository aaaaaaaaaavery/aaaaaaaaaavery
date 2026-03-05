# Complete Guide: Cloudflare Tunnel with Permanent URL (rss.thporth.com)

This guide sets up Cloudflare Tunnel with a permanent subdomain so you never have to update URLs again.

## Prerequisites

- You own `thporth.com` domain
- **For custom domain (rss.thporth.com):** Domain must use Cloudflare DNS (see alternatives below)
- **OR:** Use Cloudflare's free trycloudflare.com URL (no DNS changes needed)
- Your computer will stay on 24/7

### Why Cloudflare DNS is Required (for custom domain)

Cloudflare Tunnel needs to create DNS records automatically. It uses Cloudflare's API to add CNAME records, which requires the domain to be managed by Cloudflare.

**You have 3 options:**

1. **Use Cloudflare DNS for subdomain only** (Recommended)
   - Keep your main domain (`thporth.com`) wherever it is
   - Just add `thporth.com` to Cloudflare (don't change nameservers)
   - Cloudflare will manage DNS for the subdomain only
   - Your main site stays exactly as is

2. **Use Cloudflare's free URL** (Easiest, no DNS changes)
   - Don't use custom domain
   - Get free URL: `https://rss-feed-service-abc123.trycloudflare.com`
   - No DNS configuration needed
   - URL is stable (doesn't change)

3. **Use different solution** (if you can't use Cloudflare)
   - Use ngrok with paid static domain ($8/month)
   - Use port forwarding + your DNS provider
   - Use VPS/server

## Step 1: Install Cloudflare Tunnel

**On macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Verify installation:**
```bash
cloudflared --version
```

## Step 2: Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This will:
1. Open your browser
2. Ask you to log in to Cloudflare
3. Select your account/domain (thporth.com)
4. Authorize the tunnel

**Important:** Make sure you're logged into the Cloudflare account that manages `thporth.com`.

## Step 3: Create the Tunnel

```bash
cloudflared tunnel create rss-feed-service
```

You'll see output like:
```
Created tunnel rss-feed-service with id abc123-xyz-456...
```

**Save the tunnel ID** (you'll see it in the output).

## Step 4: Configure DNS Route (Permanent URL)

This creates the permanent `rss.thporth.com` URL:

```bash
cloudflared tunnel route dns rss-feed-service rss.thporth.com
```

**What this does:**
- Creates DNS record: `rss.thporth.com` → points to your tunnel
- This URL will **never change**
- Works exactly like a normal subdomain

**Important:** This requires Cloudflare DNS for the subdomain. You have options:

**Option A: Add domain to Cloudflare (Subdomain Only)**
- Add `thporth.com` to Cloudflare dashboard
- You can keep your main domain's nameservers as-is (if using Cloudflare as secondary DNS)
- OR switch nameservers to Cloudflare (only affects DNS, not your GitHub Pages site)
- Cloudflare will manage DNS for `rss.thporth.com` subdomain

**Option B: Use Cloudflare's Free URL (No DNS Changes)**
- Skip Step 4 (DNS route)
- Just run: `cloudflared tunnel run rss-feed-service`
- Get free URL: `https://rss-feed-service-abc123.trycloudflare.com`
- Use this URL instead of custom domain

## Step 5: Create Config File (Optional but Recommended)

Create a config file so the tunnel runs automatically:

```bash
mkdir -p ~/.cloudflared
```

Create file: `~/.cloudflared/config.yml`

```yaml
tunnel: rss-feed-service
credentials-file: /Users/YOUR_USERNAME/.cloudflared/abc123-xyz-456.json

ingress:
  - hostname: rss.thporth.com
    service: http://localhost:8080
  - service: http_status:404
```

**Important:** Replace:
- `YOUR_USERNAME` with your macOS username (run `whoami` to find it)
- `abc123-xyz-456.json` with your actual tunnel credentials file name

**Find your credentials file:**
```bash
ls ~/.cloudflared/*.json
```

It will be named something like: `abc123-xyz-456-def789.json`

## Step 6: Start the RSS Feed Service

**Terminal 1:**
```bash
cd rss-feed-service
./start-local.sh
```

Keep this running. Service starts on `http://localhost:8080`.

## Step 7: Start Cloudflare Tunnel

**Terminal 2:**
```bash
cloudflared tunnel run rss-feed-service
```

Or if you created the config file:
```bash
cloudflared tunnel run
```

You should see:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://rss.thporth.com                                                                   |
+--------------------------------------------------------------------------------------------+
```

**Keep this terminal open!**

## Step 8: Update Frontend URLs

Now update your frontend to use the permanent URL:

```bash
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX
./update-rss-urls.sh https://rss.thporth.com
```

This replaces all 257 URLs in `index (1).html` with `https://rss.thporth.com`.

## Step 9: Upload and Test

1. Upload updated `index (1).html` to your thporth.com server
2. Visit `thporth.com` and test the feeds
3. The feeds should load from `https://rss.thporth.com`

## Step 10: Keep Running 24/7

You need both services running continuously:

### Option A: Manual (Keep Terminals Open)

**Terminal 1:** RSS Service
```bash
cd rss-feed-service
./start-local.sh
```

**Terminal 2:** Cloudflare Tunnel
```bash
cloudflared tunnel run rss-feed-service
```

### Option B: Background Process (Recommended)

**Terminal 1:**
```bash
cd rss-feed-service
nohup ./start-local.sh > service.log 2>&1 &
```

**Terminal 2:**
```bash
nohup cloudflared tunnel run rss-feed-service > tunnel.log 2>&1 &
```

**Check if running:**
```bash
ps aux | grep "node index.js"
ps aux | grep cloudflared
```

**View logs:**
```bash
tail -f rss-feed-service/service.log
tail -f tunnel.log
```

### Option C: Auto-Start on Boot (macOS)

Create a LaunchAgent to auto-start both services on boot:

**Create RSS Service plist:**
```bash
nano ~/Library/LaunchAgents/com.thporth.rss-service.plist
```

Paste:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.thporth.rss-service</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/YOUR_USERNAME/Downloads/Copy of THPORTHINDEX/rss-feed-service/index.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>USE_LOCAL_DB</key>
    <string>true</string>
    <key>PORT</key>
    <string>8080</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>/Users/YOUR_USERNAME/Downloads/Copy of THPORTHINDEX/rss-feed-service</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/Users/YOUR_USERNAME/Downloads/Copy of THPORTHINDEX/rss-feed-service/service.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/YOUR_USERNAME/Downloads/Copy of THPORTHINDEX/rss-feed-service/service-error.log</string>
</dict>
</plist>
```

**Create Cloudflare Tunnel plist:**
```bash
nano ~/Library/LaunchAgents/com.thporth.cloudflare-tunnel.plist
```

Paste:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.thporth.cloudflare-tunnel</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/cloudflared</string>
    <string>tunnel</string>
    <string>run</string>
    <string>rss-feed-service</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/Users/YOUR_USERNAME/tunnel.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/YOUR_USERNAME/tunnel-error.log</string>
</dict>
</plist>
```

**Replace `YOUR_USERNAME` with your actual username in both files!**

**Load the services:**
```bash
launchctl load ~/Library/LaunchAgents/com.thporth.rss-service.plist
launchctl load ~/Library/LaunchAgents/com.thporth.cloudflare-tunnel.plist
```

**Check status:**
```bash
launchctl list | grep thporth
```

**Unload (to stop):**
```bash
launchctl unload ~/Library/LaunchAgents/com.thporth.rss-service.plist
launchctl unload ~/Library/LaunchAgents/com.thporth.cloudflare-tunnel.plist
```

## Troubleshooting

### "Domain not found" or DNS errors
- Make sure `thporth.com` is using Cloudflare DNS
- Check Cloudflare dashboard → DNS → Records
- Should see `rss.thporth.com` CNAME record (created automatically)

### Tunnel won't start
```bash
# Check if tunnel exists
cloudflared tunnel list

# Check tunnel info
cloudflared tunnel info rss-feed-service

# Delete and recreate if needed
cloudflared tunnel delete rss-feed-service
cloudflared tunnel create rss-feed-service
```

### Service not accessible
- Check RSS service is running: `ps aux | grep "node index.js"`
- Check tunnel is running: `ps aux | grep cloudflared`
- Check logs: `tail -f service.log` and `tail -f tunnel.log`
- Test locally: `curl http://localhost:8080/feeds/newsnow-premierleague.xml`

### DNS not resolving
- Wait a few minutes for DNS propagation
- Check DNS: `dig rss.thporth.com` or `nslookup rss.thporth.com`
- Verify in Cloudflare dashboard that the CNAME record exists

## Benefits of This Setup

✅ **Permanent URL:** `https://rss.thporth.com` never changes  
✅ **Free:** Cloudflare Tunnel is completely free  
✅ **Reliable:** More stable than ngrok  
✅ **Professional:** Uses your own domain  
✅ **No URL updates:** Set it once, never change again  

## Cost

**Total: $0/month** ✅
- Cloudflare Tunnel: Free
- SQLite database: Free
- Your domain: Already owned

## Quick Reference

**Start services:**
```bash
# Terminal 1
cd rss-feed-service && ./start-local.sh

# Terminal 2
cloudflared tunnel run rss-feed-service
```

**Check status:**
```bash
ps aux | grep "node index.js"
ps aux | grep cloudflared
```

**View logs:**
```bash
tail -f rss-feed-service/service.log
tail -f tunnel.log
```

**Your permanent URL:** `https://rss.thporth.com`

