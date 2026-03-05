# Frontend Reads vs Background Jobs - Explained

## The Two Different Types of RSS Feed Operations

Your RSS feed service has **two separate operations** that happen independently:

---

## 1. Background Jobs (Scheduled Refresh)

### What it is:
- A **scheduled task** that runs automatically every X minutes/hours
- **Currently**: Runs every 15 minutes (96 times per day)
- **Fetches feeds from source websites** (ESPN, CBS, etc.)
- **Stores/caches the results** in Firestore (or SQLite)
- **Runs even when nobody visits your website**

### How it works:
```
Every 15 minutes (automatically):
1. Background job starts
2. Fetches all 259 RSS feeds from their sources
3. Reads existing items from Firestore (to check for duplicates)
4. Writes new items to Firestore (caches them)
5. Job completes
```

### Current costs:
- **Reads**: 59,673,600 reads/month = $37.24/month
- **Writes**: 22,377,600 writes/month = $40.28/month
- **Cloud Run compute**: $24.49/month
- **Total**: ~$102/month

### When you change refresh frequency:
- If you change from 15 minutes → 6 hours
- Background jobs run **24x less often** (120 times/month instead of 2,880)
- **Background costs drop dramatically** (from ~$77 to ~$3/month)

---

## 2. Frontend Reads (User Visits)

### What it is:
- When a **user visits your website** (thporth.com)
- Your website **fetches RSS feed data** to display to the user
- This happens **on-demand** when users visit
- **NOT scheduled** - only happens when someone visits

### How it works:
```
User visits your website:
1. User opens thporth.com in their browser
2. Website JavaScript code runs
3. Website requests RSS feed: "GET /feeds/nfl-com.xml"
4. RSS service reads cached data from Firestore (80 items per feed)
5. Returns RSS XML to user's browser
6. Website displays the articles
```

### Current costs:
- **Reads**: 2,400,000 reads/month = $1.44/month
- This is **separate** from background jobs

### When you change refresh frequency:
- **Frontend reads are NOT affected** by background job frequency
- Users still visit your site the same number of times
- Each visit still reads the same amount of data from Firestore
- **Frontend costs stay the same** (~$1.44/month)

---

## Visual Example

### Current Setup (15 minutes refresh):

```
Background Jobs (every 15 min):
┌─────────────────────────────────────────────┐
│ 12:00 AM - Background job runs              │
│ 12:15 AM - Background job runs              │
│ 12:30 AM - Background job runs              │
│ 12:45 AM - Background job runs              │
│ ... (96 times per day)                      │
│ Cost: ~$77/month (Firestore) + $24 (Cloud Run) │
└─────────────────────────────────────────────┘

Frontend Reads (when users visit):
┌─────────────────────────────────────────────┐
│ 8:15 AM - User visits site → reads feed     │
│ 10:30 AM - User visits site → reads feed    │
│ 2:45 PM - User visits site → reads feed     │
│ ... (random times, whenever users visit)    │
│ Cost: ~$1.44/month (Firestore reads)        │
└─────────────────────────────────────────────┘

TOTAL: ~$102/month
```

### After Change (6 hours refresh):

```
Background Jobs (every 6 hours):
┌─────────────────────────────────────────────┐
│ 12:00 AM - Background job runs              │
│ 6:00 AM - Background job runs               │
│ 12:00 PM - Background job runs              │
│ 6:00 PM - Background job runs               │
│ ... (4 times per day, 120 times per month)  │
│ Cost: ~$3/month (Firestore) + $1 (Cloud Run) │
└─────────────────────────────────────────────┘

Frontend Reads (when users visit):
┌─────────────────────────────────────────────┐
│ 8:15 AM - User visits site → reads feed     │
│ 10:30 AM - User visits site → reads feed    │
│ 2:45 PM - User visits site → reads feed     │
│ ... (SAME - random times, whenever users visit) │
│ Cost: ~$1.44/month (Firestore reads) - UNCHANGED │
└─────────────────────────────────────────────┘

TOTAL: ~$5.74/month
```

---

## Key Points

### 1. They're Independent

- **Background jobs** run on a schedule (every X minutes/hours)
- **Frontend reads** happen when users visit your site
- Changing background job frequency does NOT change how many users visit your site

### 2. Different Purposes

- **Background jobs**: Keep the cache fresh (pre-fetch feeds)
- **Frontend reads**: Serve data to users when they visit

### 3. Different Costs

- **Background jobs**: Much more expensive (run 96-2,880 times/month)
- **Frontend reads**: Much cheaper (only when users visit, ~1,000 visits/day)

### 4. Frontend Reads Always Happen

Even if you stop background jobs completely:
- Users can still visit your site
- Your site still needs to read RSS feed data
- Frontend reads still happen (from cached data)
- You just won't have fresh data (cached data gets stale)

---

## Real-World Analogy

Think of it like a coffee shop:

### Background Jobs = Stocking the Shelves
- **What**: Employee comes in every 15 minutes to restock coffee beans
- **When**: Scheduled, automatic, even if no customers
- **Cost**: Labor cost for employee to come in 96 times/day
- **If you reduce**: Employee comes in 4 times/day instead → **saves money**

### Frontend Reads = Serving Customers
- **What**: Customer orders coffee, you serve them from the stocked shelves
- **When**: Random, whenever customers visit
- **Cost**: Small (just serving from already-stocked shelves)
- **If you reduce background jobs**: Still serve customers the same way, just shelves get restocked less often

**Key insight**: Reducing how often you stock shelves (background jobs) doesn't change how many customers visit (frontend reads). Customers still come in and order coffee - you just restock the shelves less often.

---

## Why This Matters

When you change background job frequency from 15 minutes to 6 hours:

✅ **Background job costs drop** (96% reduction):
- Background reads: $37.24 → $1.49/month
- Background writes: $40.28 → $1.68/month
- Cloud Run: $24.49 → $0.95/month

❌ **Frontend costs stay the same**:
- Frontend reads: $1.44/month (unchanged)
- Users still visit your site the same way
- Each visit still reads from Firestore the same way

**Total savings**: ~$96/month (94% reduction), but you save on background jobs, not frontend reads.

---

## Summary

- **Background jobs** = Scheduled tasks that fetch and cache feeds (costs ~$77/month)
- **Frontend reads** = When users visit your site and read cached feeds (costs ~$1.44/month)
- **Changing refresh frequency** affects background jobs (big savings) but NOT frontend reads (stays the same)

The ~$96/month savings comes from reducing background jobs from 96 times/day to 4 times/day. Frontend reads continue to happen the same way whenever users visit your site.
