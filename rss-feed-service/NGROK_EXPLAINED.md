# ngrok URL Explanation

## The Problem

**ngrok Free Tier:**
- When you start ngrok, you get a random URL like: `https://abc123xyz.ngrok-free.app`
- If you **restart** ngrok (close and reopen), you get a **NEW** random URL like: `https://xyz789abc.ngrok-free.app`
- This means your frontend URLs would be broken until you update them

## The Solution: Keep ngrok Running

**You DON'T have to update URLs if you keep ngrok running!**

- As long as ngrok stays running, your URL stays the same
- Only when you **restart** ngrok do you get a new URL
- So just **don't restart ngrok** - keep it running 24/7

## Better Alternative: Cloudflare Tunnel (Recommended)

Cloudflare Tunnel gives you a **more stable URL** that doesn't change as often:

### Setup Cloudflare Tunnel:

```bash
# Install
brew install cloudflare/cloudflare/cloudflared

# Authenticate (opens browser)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create rss-feed-service

# Run tunnel (gives you a URL)
cloudflared tunnel run rss-feed-service
```

**Benefits:**
- URL is more stable (doesn't change as often)
- Completely free
- More reliable than ngrok free tier
- Better performance

**URL format:** `https://rss-feed-service-abc123.trycloudflare.com`

## Even Better: Use Your Own Domain (Free with Cloudflare)

If you have a domain (or subdomain), you can use it with Cloudflare Tunnel for a **permanent URL**:

```bash
# Create tunnel with your domain
cloudflared tunnel route dns rss-feed-service rss.thporth.com
```

Then your URL would be: `https://rss.thporth.com` (permanent, never changes!)

## Comparison

| Solution | URL Stability | Cost | Setup Difficulty |
|----------|--------------|------|------------------|
| ngrok Free | Changes on restart | Free | Easy |
| ngrok Paid | Static domain | $8/month | Easy |
| Cloudflare Tunnel | More stable | Free | Medium |
| Cloudflare + Domain | Permanent | Free | Medium |

## Recommendation

**For you:** Use **Cloudflare Tunnel** - it's free, more stable, and you can even use a subdomain of thporth.com if you want a permanent URL.

## What Happens If ngrok Restarts?

If ngrok restarts (computer reboot, crash, etc.):
1. ngrok gives you a new URL
2. Your frontend still has the old URL
3. Feeds stop working
4. You'd need to update frontend URLs again

**Solution:** Use Cloudflare Tunnel or keep ngrok running 24/7 (run in background, auto-restart on boot).

