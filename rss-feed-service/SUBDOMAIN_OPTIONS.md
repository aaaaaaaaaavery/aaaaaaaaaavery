# Using rss.thporth.com Without Cloudflare

Yes, you can use your subdomain without Cloudflare! Here are your options:

## Option 1: Port Forwarding (Free, Requires Router Access)

If you have access to your router, you can forward port 8080 to your computer.

### Setup:

1. **Find your computer's local IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Or: System Preferences → Network → see your IP (usually 192.168.x.x)

2. **Set static IP for your computer** (so it doesn't change):
   - System Preferences → Network → Advanced → TCP/IP
   - Change from DHCP to "Manually"
   - Set IP to something like 192.168.1.100 (use an IP not in use)

3. **Port Forward on Router:**
   - Log into router (usually 192.168.1.1 or 192.168.0.1)
   - Find "Port Forwarding" or "Virtual Server"
   - Forward external port 8080 → your computer's IP:8080
   - Protocol: TCP

4. **Find your public IP:**
   ```bash
   curl ifconfig.me
   ```

5. **Set up DNS:**
   - Go to your domain registrar (where you bought thporth.com)
   - Add DNS record: `rss.thporth.com` → A record → your public IP

6. **Update frontend:**
   ```bash
   ./update-rss-urls.sh http://rss.thporth.com:8080
   ```
   Or set up SSL (see below).

**Limitations:**
- Your public IP might change (unless you have static IP from ISP)
- No SSL/HTTPS by default (unless you set up Let's Encrypt)
- Requires router access

## Option 2: VPS/Server (Recommended if you have one)

If you have a VPS or server, you can run the service there:

1. **Install on VPS:**
   ```bash
   # On your VPS
   git clone your-repo
   cd rss-feed-service
   npm install
   ```

2. **Set up reverse proxy (nginx):**
   ```nginx
   server {
       listen 80;
       server_name rss.thporth.com;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Set up SSL with Let's Encrypt:**
   ```bash
   certbot --nginx -d rss.thporth.com
   ```

4. **Set DNS:**
   - Point `rss.thporth.com` → A record → your VPS IP

**Benefits:**
- Full control
- SSL/HTTPS
- More reliable
- Can run 24/7

## Option 3: Use ngrok with Static Domain (Paid)

ngrok paid plan ($8/month) gives you a static domain:

1. Sign up for ngrok paid plan
2. Reserve domain: `rss-thporth.ngrok.io` (or similar)
3. Set DNS: `rss.thporth.com` → CNAME → `rss-thporth.ngrok.io`
4. Run: `ngrok http 8080 --domain=rss-thporth.ngrok.io`

**Cost:** $8/month

## Option 4: Use Your Existing Server (If thporth.com is hosted)

If `thporth.com` is already hosted on a server, you can:

1. **Run service on same server:**
   - SSH into your server
   - Install Node.js
   - Run the RSS service on port 8080
   - Set up nginx reverse proxy (see Option 2)

2. **Or run locally and proxy through server:**
   - Set up SSH tunnel from your server to your local machine
   - Server forwards requests to your local service

## Option 5: Use Any DNS Provider (Not Just Cloudflare)

You can use any DNS provider (GoDaddy, Namecheap, etc.):

1. **Set up DNS record:**
   - Go to your DNS provider
   - Add: `rss` → A record → your public IP (or CNAME to another service)

2. **Expose local service:**
   - Use port forwarding (Option 1)
   - Or use ngrok/Cloudflare Tunnel just for the tunnel, point DNS to it

## Recommendation

**If you have router access:**
- Use **Option 1 (Port Forwarding)** - Free, simple
- Set up Let's Encrypt for SSL

**If you have a VPS/server:**
- Use **Option 2 (VPS)** - Most reliable, professional

**If you want easiest setup:**
- Use **Cloudflare Tunnel** - Free, no router config, automatic SSL

## Quick Comparison

| Option | Cost | Setup Difficulty | SSL | Reliability |
|-------|------|------------------|-----|-------------|
| Port Forwarding | Free | Medium | Manual | Good |
| VPS/Server | VPS cost | Medium | Easy (Let's Encrypt) | Excellent |
| ngrok Paid | $8/month | Easy | Automatic | Good |
| Cloudflare Tunnel | Free | Easy | Automatic | Excellent |
| Any DNS + Tunnel | Free | Easy | Automatic | Good |

## My Recommendation for You

Since you want to avoid Cloudflare but keep it simple:

**Use ngrok free + DNS CNAME:**
1. Run ngrok: `ngrok http 8080`
2. Get the ngrok URL (e.g., `https://abc123.ngrok-free.app`)
3. Set DNS: `rss.thporth.com` → CNAME → `abc123.ngrok-free.app`
4. **BUT** - ngrok free URLs change, so you'd need to update DNS each time

## Best Options Without Cloudflare

### Option A: Port Forwarding + Your DNS Provider (Recommended)

**Free, uses your own DNS:**

1. **Set up port forwarding** (see Option 1 above)
2. **Get your public IP** (might be dynamic - see below)
3. **Set DNS at your current DNS provider:**
   - Go to wherever you manage thporth.com DNS
   - Add: `rss` → A record → your public IP
   - Or if IP changes: use Dynamic DNS service (see below)

**For Dynamic IP (changes):**
- Use a Dynamic DNS service like:
  - DuckDNS (free): `rss-thporth.duckdns.org`
  - No-IP (free): `rss-thporth.ddns.net`
  - Then set DNS: `rss.thporth.com` → CNAME → `rss-thporth.duckdns.org`

### Option B: VPS/Server (Best if you have one)

Run the service on a VPS/server you already have:
- Full control
- SSL with Let's Encrypt
- More reliable
- Uses your own DNS

### Option C: Use ngrok + DNS CNAME (Simple but URL changes)

1. Run ngrok: `ngrok http 8080`
2. Get URL: `https://abc123.ngrok-free.app`
3. Set DNS: `rss.thporth.com` → CNAME → `abc123.ngrok-free.app`
4. **Problem:** URL changes when you restart ngrok
5. **Solution:** Keep ngrok running 24/7, or use paid ngrok for static domain

