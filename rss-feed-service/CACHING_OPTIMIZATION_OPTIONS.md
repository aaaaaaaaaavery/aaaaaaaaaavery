# RSS Feed Caching Optimization Options

## Current Setup

- **NodeCache (in-memory)**: 15-minute TTL for RSS XML
- **articleCache (in-memory)**: 7-day TTL for articles
- **Cache-first approach**: Checks cache before scraping
- **Background refresh**: Every 15 minutes for NewsNow, 3 hours for others

## Problem

Feeds are slow because:
1. **Cold starts**: Cloud Run instances lose in-memory cache on cold start
2. **First request after expiry**: Must scrape when cache expires
3. **Browser scraping**: Inherently slow (2-10 seconds per feed)
4. **NewsNow redirect resolution**: Even with parallel processing, takes 2-4 seconds

## Solution Options

### Option 1: File-Based Cache (Local Machine) ⭐ RECOMMENDED

**How it works:**
- Store cached RSS XML and articles in JSON files on your local machine
- Persists across service restarts
- No additional costs
- Fast file I/O

**Implementation:**
- Use `fs` to read/write cache files
- Store in `./cache/` directory
- Check file cache before in-memory cache
- Fallback to scraping if file cache expired

**Pros:**
- ✅ Free
- ✅ Persistent across restarts
- ✅ Fast (file I/O is quick)
- ✅ No external dependencies
- ✅ Works with local machine setup

**Cons:**
- ❌ Not shared across multiple instances (if you scale)
- ❌ Requires disk space (minimal - ~1-5MB per feed)

**Cost:** $0

---

### Option 2: Firestore Database

**How it works:**
- Store cached RSS XML and articles in Firestore
- Persistent across all instances
- Fast reads (indexed queries)

**Cost Analysis:**
- **Free Tier**: 50K reads/day, 20K writes/day, 20K deletes/day
- **Pricing**: 
  - Reads: $0.06 per 100K documents
  - Writes: $0.18 per 100K documents
  - Storage: $0.18/GB/month

**Estimated Monthly Cost:**
- Assuming 200 feeds, refreshed every 15 minutes:
  - Reads: ~200 feeds × 96 refreshes/day × 30 days = 576K reads/month
  - Writes: ~200 feeds × 96 refreshes/day × 30 days = 576K writes/month
  - **Cost**: ~$0.35 reads + ~$1.04 writes = **~$1.40/month**
  - Plus storage: ~$0.01/month
  - **Total: ~$1.50/month**

**Pros:**
- ✅ Persistent across all instances
- ✅ Fast reads
- ✅ Scales automatically
- ✅ Free tier covers most use cases

**Cons:**
- ❌ Costs money (though minimal)
- ❌ Requires Google Cloud setup
- ❌ Slight latency (network call)

---

### Option 3: Cloud Storage (GCS)

**How it works:**
- Store cached RSS XML as files in Cloud Storage
- Similar to file-based but in the cloud
- Accessible from all instances

**Cost Analysis:**
- **Free Tier**: 5GB storage, 5K Class A operations/month, 50K Class B operations/month
- **Pricing**:
  - Storage: $0.020/GB/month (after free tier)
  - Class A (writes): $0.05 per 10K operations
  - Class B (reads): $0.004 per 10K operations

**Estimated Monthly Cost:**
- Storage: ~10MB = $0.0002/month (negligible)
- Writes: 576K/month = ~$2.88/month
- Reads: 576K/month = ~$0.23/month
- **Total: ~$3.11/month**

**Pros:**
- ✅ Persistent across instances
- ✅ Simple file-based approach
- ✅ Very cheap storage

**Cons:**
- ❌ More expensive than Firestore for this use case
- ❌ Slower than Firestore (object storage)

---

### Option 4: Increase Cache TTL

**How it works:**
- Increase `CACHE_TTL` from 15 minutes to 30-60 minutes
- Longer cache = fewer scrapes = faster responses

**Pros:**
- ✅ Free
- ✅ Simple (one line change)
- ✅ Immediate improvement

**Cons:**
- ❌ Staler content (15-45 minutes older)
- ❌ Still loses cache on cold start

**Cost:** $0

---

### Option 5: Hybrid Approach (File Cache + Longer TTL) ⭐⭐ BEST

**How it works:**
1. File-based cache for persistence
2. In-memory cache for speed
3. Longer TTL (30-60 minutes)
4. Background refresh keeps cache warm

**Implementation:**
- Check file cache first
- If expired, check in-memory cache
- If both expired, scrape and update both
- Background refresh updates file cache

**Pros:**
- ✅ Free
- ✅ Persistent
- ✅ Fast (file + memory)
- ✅ Best of both worlds

**Cons:**
- ❌ Slightly more complex code

**Cost:** $0

---

## Recommendation

**For your use case (local machine + Cloud Run):**

1. **Short term**: Increase cache TTL to 30-60 minutes
2. **Medium term**: Implement file-based cache on local machine
3. **Long term**: If you need multi-instance sharing, use Firestore

**Best option: Hybrid file cache + longer TTL**

This gives you:
- Persistent cache (survives restarts)
- Fast responses (file I/O is quick)
- No additional costs
- Works with your local machine setup

## Implementation Priority

1. **Immediate**: Increase `CACHE_TTL` to 30-60 minutes
2. **Next**: Add file-based cache persistence
3. **Future**: Consider Firestore if you need multi-instance sharing

