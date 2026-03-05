# Using Cloudflare Tunnel WITHOUT Cloudflare DNS

You can use Cloudflare Tunnel without changing your DNS! Here's how:

## Option 1: Use Cloudflare's Free URL (Easiest)

**No DNS changes needed at all!**

### Setup:

1. **Install Cloudflare Tunnel:**
   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```

2. **Authenticate:**
   ```bash
   cloudflared tunnel login
   ```

3. **Create tunnel:**
   ```bash
   cloudflared tunnel create rss-feed-service
   ```

4. **Run tunnel (NO DNS setup):**
   ```bash
   cloudflared tunnel run rss-feed-service
   ```

5. **Get your free URL:**
   You'll see output like:
   ```
   https://rss-feed-service-abc123.trycloudflare.com
   ```

6. **Update frontend:**
   ```bash
   ./update-rss-urls.sh https://rss-feed-service-abc123.trycloudflare.com
   ```

**Benefits:**
- ✅ No DNS changes needed
- ✅ Free
- ✅ Automatic HTTPS
- ✅ URL is stable (doesn't change)
- ✅ Works with any DNS provider

**URL Format:** `https://rss-feed-service-abc123.trycloudflare.com`

## Option 2: Use Cloudflare DNS for Subdomain Only

If you want `rss.thporth.com` but don't want to change your main domain:

### Setup:

1. **Add domain to Cloudflare (as secondary DNS):**
   - Go to Cloudflare dashboard
   - Add `thporth.com`
   - **Don't change nameservers yet**

2. **Create tunnel:**
   ```bash
   cloudflared tunnel create rss-feed-service
   cloudflared tunnel login
   ```

3. **Set up DNS route:**
   ```bash
   cloudflared tunnel route dns rss-feed-service rss.thporth.com
   ```

4. **Now you have two options:**

   **A. Keep main domain where it is:**
   - Your main site (thporth.com) stays on GitHub Pages
   - Only `rss.thporth.com` uses Cloudflare DNS
   - Requires Cloudflare to manage DNS for the subdomain

   **B. Switch to Cloudflare DNS (but keep GitHub Pages):**
   - Change nameservers to Cloudflare
   - Add DNS records:
     - `@` → CNAME → `your-username.github.io` (for GitHub Pages)
     - `rss` → (handled by tunnel automatically)
   - Your GitHub Pages site still works exactly the same

## Option 3: Use Different Solution

If you absolutely can't use Cloudflare:

### A. ngrok with Static Domain ($8/month)
```bash
ngrok http 8080 --domain=rss-thporth.ngrok.io
```
Then set DNS: `rss.thporth.com` → CNAME → `rss-thporth.ngrok.io`

### B. Port Forwarding + Your DNS
- Port forward 8080
- Set DNS: `rss.thporth.com` → A record → your public IP
- Set up SSL with Let's Encrypt

### C. VPS/Server
- Run RSS service on VPS
- Set DNS: `rss.thporth.com` → A record → VPS IP
- Set up nginx + SSL

## My Recommendation

**For easiest setup without DNS changes:**
- Use **Option 1** (Cloudflare free URL)
- URL: `https://rss-feed-service-abc123.trycloudflare.com`
- No DNS configuration needed
- Free, stable, works immediately

**If you want rss.thporth.com:**
- Use **Option 2B** (Switch to Cloudflare DNS)
- Your GitHub Pages site continues to work
- You get permanent `rss.thporth.com` URL
- Free, professional, permanent

## Quick Start (No DNS Changes)

```bash
# 1. Install
brew install cloudflare/cloudflare/cloudflared

# 2. Authenticate
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create rss-feed-service

# 4. Run tunnel (get free URL)
cloudflared tunnel run rss-feed-service
# Copy the URL it gives you (e.g., https://rss-feed-service-abc123.trycloudflare.com)

# 5. Start RSS service
cd rss-feed-service
./start-local.sh

# 6. Update frontend with the free URL
cd /Users/avery/Downloads/Copy\ of\ THPORTHINDEX
./update-rss-urls.sh https://rss-feed-service-abc123.trycloudflare.com
```

**That's it!** No DNS changes needed.

