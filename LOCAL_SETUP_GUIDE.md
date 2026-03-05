# Moving Services to Local Computer - Complete Guide

## Overview

You can significantly reduce Firestore costs by running certain services locally on a computer that's always running. This guide shows what can be moved and how.

---

## ✅ What CAN Be Moved Locally (Recommended)

### 1. **RSS Feed Service** ⭐ **BIGGEST SAVINGS**

**Current Cost**: ~$35-40/month (Firestore + Cloud Run)
**Local Cost**: $0/month (electricity only)

**What it does**:
- Caches RSS feed items (259 feeds)
- Extracts final URLs from NewsNow redirects
- Serves RSS feeds to your website
- Currently uses Firestore `feed_items` collection

**Why it works locally**:
- Already has SQLite support (`local-database.js`)
- Doesn't need to scale (single machine is fine)
- Can serve feeds via HTTP on local machine
- Background jobs can run locally

**Implementation Options**:

#### Option A: Full Local Setup (Recommended)
1. Run RSS feed service locally on your always-on computer
2. Use SQLite database instead of Firestore
3. Expose service via port forwarding or VPN
4. Website fetches feeds from local service

#### Option B: Hybrid Setup
1. Run background job locally (refreshes feeds)
2. Export feeds to JSON files
3. Serve JSON files via Cloud Storage or static hosting
4. Website reads from static files

**Savings**: **$35-40/month** (eliminates RSS feed Firestore costs)

---

### 2. **Standings Scrapers** (Background Jobs)

**Current Cost**: ~$5-10/month (Firestore writes)
**Local Cost**: $0/month

**What it does**:
- Scrapes standings from websites
- Writes to Firestore collections (NBAStandings, NFLStandings, etc.)
- Runs daily via scheduled jobs

**Why it works locally**:
- Can run as cron jobs on local machine
- Can write to local SQLite/JSON instead of Firestore
- Can export to JSON files that are served statically

**Implementation**:
1. Run scrapers locally as scheduled tasks (cron on Mac/Linux, Task Scheduler on Windows)
2. Write standings to JSON files instead of Firestore
3. Upload JSON files to Cloud Storage or serve statically
4. Website reads from static JSON files

**Savings**: **$5-10/month** (eliminates standings Firestore writes)

---

### 3. **Game Polling/Scraping Background Jobs**

**Current Cost**: Part of Cloud Run costs
**Local Cost**: $0/month

**What it does**:
- Polls FlashLive API for game data
- Scrapes ESPN for live scores
- Updates game data

**Why it works locally**:
- Background jobs don't need to be in the cloud
- Can run locally and write results to JSON files
- Or can still write to Firestore but from local machine (saves Cloud Run costs)

**Implementation**:
1. Run polling scripts locally as scheduled tasks
2. Write results to JSON files or still to Firestore (from local machine)
3. If using JSON files, serve them statically
4. If using Firestore, still need Firestore but save Cloud Run costs

**Savings**: **$10-15/month** (reduces Cloud Run compute costs)

---

## ❌ What CANNOT Be Moved Locally (Needs to Stay in Cloud)

### 1. **Games Data (sportsGames collection)**
- **Why**: Needs to be publicly accessible for website
- **Alternative**: Can serve via JSON endpoints (already doing this)
- **Status**: ✅ Already optimized - using JSON endpoints instead of direct Firestore reads

### 2. **Featured Games**
- **Why**: Needs to be publicly accessible
- **Alternative**: Serve via JSON endpoint (already possible)
- **Status**: Can move to static JSON file served via Cloud Storage

### 3. **Real-time Data (if needed)**
- **Why**: Firestore listeners provide real-time updates
- **Alternative**: Poll JSON endpoints instead (acceptable trade-off)
- **Status**: Already using JSON endpoints

---

## 🏗️ Implementation Plan

### Phase 1: Move RSS Feed Service to Local (Highest Impact)

#### Step 1: Set Up Local RSS Service

```bash
# On your local computer (always running)
cd /path/to/rss-feed-service

# Install dependencies
npm install

# Use SQLite instead of Firestore
# Already configured in local-database.js!
```

#### Step 2: Configure Local Database

The codebase already has `local-database.js` that uses SQLite! You just need to:

1. **Modify `index.js`** to use local database instead of Firestore:
   ```javascript
   // Change this:
   import { getCachedFeed, cacheFeedItems } from './firestore-cache.js';
   
   // To this:
   import { getCachedFeed, cacheFeedItems } from './local-database.js';
   ```

2. **Run the service locally**:
   ```bash
   node index.js
   # Service runs on http://localhost:8080
   ```

#### Step 3: Expose Local Service to Internet

You have several options:

**Option A: Port Forwarding (Router)**
- Forward port 8080 from router to your local computer
- Access via: `http://your-public-ip:8080/feeds/feed-id.xml`
- **Pros**: Simple, direct
- **Cons**: Exposes your local network

**Option B: VPN (Recommended)**
- Set up VPN (WireGuard, Tailscale, etc.)
- Connect from Cloud Run service via VPN
- **Pros**: Secure, private
- **Cons**: More setup

**Option C: Reverse Proxy (Cloudflare Tunnel)**
- Use Cloudflare Tunnel (free) to expose local service
- Access via: `https://your-domain.com/feeds/feed-id.xml`
- **Pros**: Free, secure, uses Cloudflare CDN
- **Cons**: Requires domain

**Option D: Hybrid (Recommended for Start)**
- Keep RSS service in Cloud Run but use SQLite file stored in Cloud Storage
- Or: Run locally, export to Cloud Storage JSON files
- Website reads from Cloud Storage

#### Step 4: Update Website to Use Local Service

Update `index.html` to fetch feeds from your local service:

```javascript
// Change from:
const feedUrl = `https://rss-feed-service.run.app/feeds/${feedId}.xml`;

// To:
const feedUrl = `http://your-local-ip:8080/feeds/${feedId}.xml`;
// Or if using VPN/proxy:
const feedUrl = `https://your-domain.com/feeds/${feedId}.xml`;
```

#### Step 5: Set Up Background Jobs Locally

Run feed refresh jobs locally using cron (Mac/Linux) or Task Scheduler (Windows):

```bash
# Cron job (runs every 15 minutes)
*/15 * * * * cd /path/to/rss-feed-service && node refresh-feeds.js
```

**Savings**: **$35-40/month**

---

### Phase 2: Move Standings Scrapers to Local

#### Step 1: Modify Standings Scrapers

Update scrapers to write to JSON files instead of Firestore:

```javascript
// Instead of:
await saveToFirestore(standings);

// Do:
const fs = require('fs');
fs.writeFileSync(
  './standings/nba-standings.json',
  JSON.stringify(standings, null, 2)
);
```

#### Step 2: Upload JSON Files to Cloud Storage

After scraping, upload to Cloud Storage:

```bash
# Upload standings JSON files
gsutil cp ./standings/*.json gs://your-bucket/standings/
```

#### Step 3: Serve via Static Endpoint

Website reads from Cloud Storage or static hosting:

```javascript
// Instead of Firestore:
const doc = await db.collection('NBAStandings').get();

// Do:
const response = await fetch('https://storage.googleapis.com/your-bucket/standings/nba-standings.json');
const standings = await response.json();
```

**Savings**: **$5-10/month**

---

### Phase 3: Move Game Polling to Local (Optional)

Similar to standings - run polling scripts locally, write to JSON, upload to Cloud Storage.

**Savings**: **$10-15/month** (Cloud Run compute costs)

---

## 📊 Total Potential Savings

| Service | Current Cost | Local Cost | Savings |
|---------|--------------|------------|---------|
| RSS Feed Service | $35-40 | $0 | **$35-40/month** |
| Standings Scrapers | $5-10 | $0 | **$5-10/month** |
| Game Polling (Cloud Run) | $10-15 | $0 | **$10-15/month** |
| **TOTAL** | **$50-65** | **$0** | **$50-65/month** |

**Current Total**: $74.59/month
**After Local Migration**: $10-25/month
**Savings**: **67-87% reduction**

---

## 🔧 Technical Setup Details

### Local RSS Service Setup

1. **Requirements**:
   - Node.js installed
   - Always-on computer (Mac/Windows/Linux)
   - Internet connection

2. **Database**: SQLite (already in codebase)
   - File: `rss-feed-service/feed_items.db`
   - No setup needed - auto-creates

3. **Background Jobs**:
   - Cron (Mac/Linux): `*/15 * * * * /path/to/refresh-feeds.js`
   - Task Scheduler (Windows): Create scheduled task

4. **Service Exposure**:
   - Port forwarding: Simplest
   - VPN: Most secure
   - Cloudflare Tunnel: Best for production

### Local Standings Scrapers Setup

1. **Modify scrapers** to write JSON instead of Firestore
2. **Run via cron/Task Scheduler** (daily)
3. **Upload to Cloud Storage** after scraping
4. **Website reads from Cloud Storage** JSON files

---

## 🚀 Quick Start: RSS Feed Service (Recommended First Step)

### Step 1: Check if Local Database Already Exists

```bash
cd rss-feed-service
ls -la feed_items.db  # Check if SQLite file exists
```

### Step 2: Switch to Local Database

Edit `rss-feed-service/index.js`:

```javascript
// Find this line:
import { getCachedFeed, cacheFeedItems } from './firestore-cache.js';

// Change to:
import { getCachedFeed, cacheFeedItems } from './local-database.js';
```

### Step 3: Run Locally

```bash
# Install dependencies (if needed)
npm install

# Run the service
PORT=8080 node index.js
```

### Step 4: Test Locally

```bash
# Test a feed
curl http://localhost:8080/feeds/newsnow-nfl.xml
```

### Step 5: Expose to Internet

Choose one of the options above (port forwarding, VPN, Cloudflare Tunnel).

---

## ⚠️ Considerations

### Pros of Local Setup:
- ✅ **Massive cost savings** ($50-65/month)
- ✅ Full control over your data
- ✅ No Firestore read/write limits
- ✅ Can run 24/7 without cloud costs
- ✅ SQLite is fast and simple

### Cons of Local Setup:
- ❌ Requires always-on computer
- ❌ Depends on your internet connection
- ❌ Need to handle outages/restarts
- ❌ Slightly more complex setup
- ❌ May need VPN/port forwarding

### Best Approach:
1. **Start with RSS Feed Service** (biggest savings, easiest)
2. **Then move Standings Scrapers** (medium effort, good savings)
3. **Keep Games Data in Cloud** (needs to be public, already optimized)

---

## 📝 Next Steps

1. **Try RSS Feed Service locally first**
   - Test with local-database.js
   - Verify it works
   - Set up exposure method

2. **Once RSS service works locally**
   - Update website to use local service
   - Monitor costs (should drop $35-40/month)

3. **Then tackle Standings Scrapers**
   - Modify to write JSON
   - Set up Cloud Storage upload
   - Update website to read from JSON

4. **Monitor and Optimize**
   - Check costs after migration
   - Optimize as needed

---

## 🆘 Need Help?

If you need help with any step:
1. Check existing `local-database.js` (it's already there!)
2. Review `rss-feed-service/LOCAL_SETUP.md` for more details
3. Test locally first before exposing to internet
