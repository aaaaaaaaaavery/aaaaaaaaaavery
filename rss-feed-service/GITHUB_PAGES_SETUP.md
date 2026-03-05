# Setting Up RSS Service for GitHub Pages (thporth.com)

Since your frontend is on GitHub Pages, it's a static site that can't access localhost. You need to expose your local RSS service to the internet.

## The Problem

- **GitHub Pages:** Static HTML/CSS/JS only (no server-side code)
- **Your RSS Service:** Running locally on your computer
- **Solution:** Expose local service to internet so GitHub Pages can access it

## Best Options for GitHub Pages

### Option 1: Cloudflare Tunnel (RECOMMENDED - Easiest)

**Why it's best:**
- ✅ Free
- ✅ Automatic HTTPS/SSL
- ✅ Permanent URL (rss.thporth.com)
- ✅ No router configuration needed
- ✅ Works with any DNS provider

**Setup:**
1. Install: `brew install cloudflare/cloudflare/cloudflared`
2. Run: `./setup-cloudflare-tunnel.sh` (automated setup)
3. Get permanent URL: `https://rss.thporth.com`
4. Update frontend: `./update-rss-urls.sh https://rss.thporth.com`

**Note:** You don't need to use Cloudflare DNS for your main domain. The tunnel just needs Cloudflare for the subdomain routing.

### Option 2: Port Forwarding (If You Have Router Access)

**Can you do port forwarding?** Yes, but there are considerations:

**Requirements:**
- ✅ Router access (to set up port forwarding)
- ✅ Static public IP (or Dynamic DNS service)
- ⚠️ SSL/HTTPS setup (Let's Encrypt) - GitHub Pages requires HTTPS for CORS

**Setup Steps:**

1. **Port Forward on Router:**
   - Forward external port 8080 → your computer's IP:8080
   - Find your local IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`

2. **Get Your Public IP:**
   ```bash
   curl ifconfig.me
   ```

3. **Set DNS:**
   - Go to your DNS provider (wherever thporth.com DNS is managed)
   - Add: `rss.thporth.com` → A record → your public IP

4. **Set Up SSL (Required for HTTPS):**
   - Install certbot: `brew install certbot`
   - Get certificate: `certbot certonly --standalone -d rss.thporth.com`
   - Configure your RSS service to use HTTPS (requires additional setup)

5. **Update Frontend:**
   ```bash
   ./update-rss-urls.sh https://rss.thporth.com
   ```

**Problems with Port Forwarding:**
- ❌ Your public IP might change (unless static from ISP)
- ❌ SSL setup is complex for local service
- ❌ Requires router access
- ❌ Less secure (exposing your home network)

### Option 3: ngrok (Simple but URL Changes)

**Setup:**
1. Install: `brew install ngrok`
2. Run: `ngrok http 8080`
3. Get URL: `https://abc123.ngrok-free.app`
4. Set DNS: `rss.thporth.com` → CNAME → `abc123.ngrok-free.app`
5. Update frontend: `./update-rss-urls.sh https://rss.thporth.com`

**Problem:** URL changes when you restart ngrok (unless you keep it running 24/7)

### Option 4: VPS/Server (Best if You Have One)

Run the RSS service on a VPS/server instead of locally:

1. **Deploy to VPS:**
   ```bash
   # On your VPS
   git clone your-repo
   cd rss-feed-service
   npm install
   export USE_LOCAL_DB=true
   node index.js
   ```

2. **Set up nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name rss.thporth.com;
       
       location / {
           proxy_pass http://localhost:8080;
       }
   }
   ```

3. **Set up SSL:**
   ```bash
   certbot --nginx -d rss.thporth.com
   ```

4. **Set DNS:**
   - `rss.thporth.com` → A record → VPS IP

## My Recommendation

**For GitHub Pages + Local Service:**

**Use Cloudflare Tunnel** - It's the easiest and most reliable:

1. ✅ Free
2. ✅ Automatic HTTPS
3. ✅ Permanent URL
4. ✅ No router config
5. ✅ Works with any DNS provider
6. ✅ Simple setup

**Why not port forwarding:**
- Complex SSL setup
- IP might change
- Security concerns
- Router configuration needed

## Quick Setup (Cloudflare Tunnel)

```bash
# 1. Install
brew install cloudflare/cloudflare/cloudflared

# 2. Run automated setup
cd rss-feed-service
./setup-cloudflare-tunnel.sh

# 3. Start services (2 terminals)
# Terminal 1:
./start-local.sh

# Terminal 2:
./START_CLOUDFLARE_TUNNEL.sh

# 4. Update frontend
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX
./update-rss-urls.sh https://rss.thporth.com

# 5. Commit and push to GitHub
git add "index (1).html"
git commit -m "Update RSS feed URLs to local service"
git push
```

## CORS Configuration

The RSS service already has CORS enabled (allows all origins), so GitHub Pages can access it without issues.

## Cost Comparison

| Option | Cost | Setup Difficulty | Reliability |
|--------|------|------------------|-------------|
| Cloudflare Tunnel | Free | Easy | Excellent |
| Port Forwarding | Free | Hard | Good (if static IP) |
| ngrok Free | Free | Easy | Good (if kept running) |
| ngrok Paid | $8/month | Easy | Good |
| VPS | VPS cost | Medium | Excellent |

## Answer to Your Question

**Can you do port forwarding?** 

Yes, technically, but:
- ❌ **Not recommended** for GitHub Pages setup
- ❌ Complex SSL setup required
- ❌ IP might change
- ✅ **Better:** Use Cloudflare Tunnel (free, easier, more reliable)

**Recommendation:** Use Cloudflare Tunnel. It's free, easier than port forwarding, and works perfectly with GitHub Pages.

