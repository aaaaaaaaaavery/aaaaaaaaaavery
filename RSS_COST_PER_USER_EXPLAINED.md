# RSS Feed Cost Per User - Explained

## Short Answer

**Yes, you pay per user visit, but it's not exactly linear due to caching.**

### Current Setup (Firestore-based):
- **1 user visit** = ~80 Firestore reads = ~$0.000048
- **1,000 user visits/day** = ~80,000 reads/day = ~$1.44/month
- **10,000 user visits/day** = ~800,000 reads/day = ~$14.40/month

### But with in-memory caching (Cloud Run Only):
- **Multiple users within 15 minutes** = Only 1 Firestore read (served from cache)
- **Cost scales much slower** with user count

---

## Detailed Explanation

### Current Setup: Firestore-Based Caching

Based on your cost calculations, you're using **Firestore** to cache RSS feeds.

#### How It Works:

```
User 1 visits site:
1. User requests RSS feed
2. Service reads from Firestore (80 reads per feed)
3. Returns data to user
Cost: ~80 Firestore reads = ~$0.000048

User 2 visits site (even 1 second later):
1. User requests RSS feed
2. Service reads from Firestore AGAIN (80 reads per feed)
3. Returns data to user
Cost: ~80 Firestore reads = ~$0.000048

User 3, 4, 5... (each user):
1. Each user = 80 Firestore reads
2. Cost per user: ~$0.000048
```

#### Cost Calculation:

**Per user visit:**
- ~80 Firestore reads per feed request
- Firestore cost: $0.06 per 100,000 reads
- Cost per read: $0.0000006
- **Cost per user visit**: 80 × $0.0000006 = **~$0.000048** (less than a penny)

**Monthly cost:**
- 1 user/day = 30 visits/month = 2,400 reads = **~$0.0014/month** (basically free)
- 1,000 users/day = 30,000 visits/month = 2,400,000 reads = **~$1.44/month**
- 10,000 users/day = 300,000 visits/month = 24,000,000 reads = **~$14.40/month**
- 100,000 users/day = 3,000,000 visits/month = 240,000,000 reads = **~$144/month**

**Yes, it scales linearly with user count!** (With Firestore)

---

## Alternative Setup: In-Memory Cache (Cloud Run Only)

Your codebase shows you have an option for **Cloud Run Only** setup (no Firestore).

#### How It Works:

```
User 1 visits site:
1. User requests RSS feed
2. Service fetches from source (ESPN, CBS, etc.)
3. Stores in in-memory cache (15 minutes)
4. Returns data to user
Cost: Cloud Run compute time (~1-2 seconds)

User 2, 3, 4... visit within 15 minutes:
1. Users request RSS feed
2. Service checks in-memory cache
3. Cache hit! Returns from memory (no Firestore, no source fetch)
4. Returns data to users
Cost: ~0.01 seconds Cloud Run time (serving from cache)

After 15 minutes:
1. Next user request
2. Cache expired, fetch from source again
3. Store in cache
4. Subsequent users get from cache
```

#### Cost with In-Memory Cache:

**Per user visit:**
- **Cache hit** (within 15 min): ~0.01 seconds Cloud Run = **~$0.00000024**
- **Cache miss** (first user after 15 min): ~1-2 seconds Cloud Run = **~$0.00002-0.00004**

**Monthly cost (with caching):**
- 1,000 users/day = 30,000 visits/month
- ~95% cache hits = 28,500 × $0.00000024 = **$0.0068**
- ~5% cache misses = 1,500 × $0.00002 = **$0.03**
- **Total: ~$0.04/month** (vs $1.44/month with Firestore)

**Much cheaper and scales better!**

---

## Cost Comparison: Firestore vs In-Memory Cache

### Scenario: 1,000 users/day (30,000 visits/month)

| Setup | Cost/Month | Cost per User Visit |
|-------|-----------|---------------------|
| **Firestore** | $1.44 | $0.000048 |
| **In-Memory Cache** | $0.04 | $0.0000013 |
| **Savings** | $1.40 (97% cheaper) | 36x cheaper |

### Scenario: 10,000 users/day (300,000 visits/month)

| Setup | Cost/Month | Cost per User Visit |
|-------|-----------|---------------------|
| **Firestore** | $14.40 | $0.000048 |
| **In-Memory Cache** | $0.40 | $0.0000013 |
| **Savings** | $14.00 (97% cheaper) | 36x cheaper |

### Scenario: 100,000 users/day (3,000,000 visits/month)

| Setup | Cost/Month | Cost per User Visit |
|-------|-----------|---------------------|
| **Firestore** | $144.00 | $0.000048 |
| **In-Memory Cache** | $4.00 | $0.0000013 |
| **Savings** | $140.00 (97% cheaper) | 36x cheaper |

---

## Key Insights

### 1. Firestore Costs Scale Linearly

**With Firestore:**
- Each user visit = 80 Firestore reads
- **Yes, 1,000 users = 1,000× the cost of 1 user**
- No caching benefit (each request reads from Firestore)
- Cost grows linearly with traffic

### 2. In-Memory Cache Costs Scale Much Slower

**With In-Memory Cache:**
- Multiple users within 15 minutes = Shared cache
- 100 users in 15 minutes = Only 1 fetch from source
- Cost grows much slower (only pay for cache misses)
- ~95% of requests are cache hits (very cheap)

### 3. Current Setup Analysis

Based on your cost breakdown:
- **Frontend reads**: 2,400,000 reads/month = $1.44/month
- This suggests: ~1,000 user visits/day = 30,000 visits/month
- Each visit: ~80 Firestore reads
- **Yes, you're paying per user visit** (with Firestore)

---

## Real-World Example

### Current Traffic: ~1,000 users/day

**Firestore Setup:**
- Cost: $1.44/month for frontend reads
- Each user: ~$0.000048
- **1 user = $0.000048, 1,000 users = $0.048/day = $1.44/month** ✅ Linear

### If Traffic Grows to 10,000 users/day:

**Firestore Setup:**
- Cost: $14.40/month for frontend reads
- **10x users = 10x cost** ✅ Still linear

**In-Memory Cache Setup:**
- Cost: ~$0.40/month
- Most users hit cache, only ~5% fetch from source
- **10x users = Only ~2x cost** (much better scaling)

---

## Recommendation

### If You're Using Firestore (Current):
- **Yes, cost scales linearly with users**
- 1 user = X, 1,000 users = X × 1,000
- At 1,000 users/day: ~$1.44/month (acceptable)
- At 10,000 users/day: ~$14.40/month (still acceptable)
- At 100,000 users/day: ~$144/month (expensive!)

### If You Switch to In-Memory Cache:
- **Cost scales much slower**
- Multiple users share cache (15-minute window)
- At 1,000 users/day: ~$0.04/month
- At 10,000 users/day: ~$0.40/month
- At 100,000 users/day: ~$4.00/month
- **Much better for scaling!**

---

## Bottom Line

### Question: "Does 1,000 users cost 1,000× what 1 user costs?"

**With Firestore (your current setup):**
- **Yes, roughly linear** (1 user = $0.000048, 1,000 users = $0.048/day)
- Each user visit reads from Firestore
- No shared caching benefit

**With In-Memory Cache (alternative):**
- **No, much better scaling** (shared cache means cost grows slower)
- Multiple users share the same cached data
- Only pay for cache misses (~5% of requests)

### Current Situation:
- You have ~1,000 users/day = $1.44/month (very reasonable)
- If traffic grows 10x to 10,000 users/day = $14.40/month (still reasonable)
- But consider switching to in-memory cache for better scaling

---

## Action Items

1. **Check your current setup**: Are you using Firestore or in-memory cache?
   - If using Firestore: Cost scales linearly with users
   - If using in-memory cache: Cost scales much slower

2. **Consider switching to in-memory cache** if:
   - You expect traffic to grow
   - You want to reduce costs
   - 15-minute cache TTL is acceptable

3. **Monitor costs** as traffic grows:
   - With Firestore: Cost = $0.048 × (users/day)
   - With in-memory cache: Cost = ~$0.04 + ($0.04 × (users/day ÷ 1000))

---

## Summary Table

| Users/Day | Firestore Cost | In-Memory Cache Cost | Difference |
|-----------|---------------|---------------------|------------|
| 1 | $0.001/month | $0.0001/month | Firestore 10x more |
| 100 | $0.14/month | $0.001/month | Firestore 140x more |
| 1,000 | $1.44/month | $0.04/month | Firestore 36x more |
| 10,000 | $14.40/month | $0.40/month | Firestore 36x more |
| 100,000 | $144/month | $4/month | Firestore 36x more |

**Yes, with Firestore, cost scales linearly with users. With in-memory cache, it scales much better!**
