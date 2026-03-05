# Firestore Cost Calculation for 32 RSS Feeds

## Current Firestore Pricing (as of 2024)
- **Document Reads**: $0.06 per 100,000 documents
- **Document Writes**: $0.18 per 100,000 documents  
- **Document Deletes**: $0.02 per 100,000 documents
- **Storage**: $0.18 per GB/month (first 1 GB free)

## Operations Performed

### Background Job (Runs every 15 minutes = 96 times/day)

**Per Feed, Per Background Job Run:**

1. **READ Operation**: 
   - Query to get existing items: Reads up to 80 documents
   - Cost: 80 reads per feed per run

2. **WRITE Operation**:
   - Write new items: ~20 new items per run (only new ones, duplicates skipped)
   - After 4 runs, we'll have ~80 items, so subsequent runs will mostly update existing items
   - Cost: ~20 writes per feed per run (initially), then ~5-10 writes per run (updates only)

3. **DELETE Operation**:
   - Delete items beyond 80 limit: Only after exceeding 80 items
   - After reaching 80 items, each new run adds ~20, so we delete ~20 old items
   - Cost: ~20 deletes per feed per run (after reaching 80 items)

### Frontend Reads (User Requests)

**Per Feed Request:**
- Read up to 80 documents to serve the feed
- Cost: 80 reads per feed request

## Daily Cost Calculation for 32 Feeds

### Background Job Operations (96 runs/day)

**READS:**
- 32 feeds × 80 reads × 96 runs = **245,760 reads/day**
- Cost: (245,760 / 100,000) × $0.06 = **$0.147/day**

**WRITES:**
- Initial phase (first 4 runs): 32 feeds × 20 writes × 4 runs = 2,560 writes
- Steady state (remaining 92 runs): 32 feeds × 10 writes × 92 runs = 29,440 writes
- Total: **31,680 writes/day** (average)
- Cost: (31,680 / 100,000) × $0.18 = **$0.057/day**

**DELETES:**
- After reaching 80 items: 32 feeds × 20 deletes × 92 runs = **58,880 deletes/day**
- Cost: (58,880 / 100,000) × $0.02 = **$0.012/day**

### Frontend Reads (User Traffic)

**Assumptions:**
- Average 100 feed requests per day per feed
- 32 feeds × 100 requests × 80 reads = **256,000 reads/day**
- Cost: (256,000 / 100,000) × $0.06 = **$0.154/day**

**Note:** This varies significantly based on actual traffic. If you have 1,000 requests/day per feed, it would be $1.54/day.

### Storage

**Total Documents:**
- 32 feeds × 80 documents = **2,560 documents**
- Average document size: ~1 KB
- Total storage: **2.5 MB**
- Cost: **$0.00/month** (well within free tier of 1 GB)

## Total Daily Costs

### Background Job Only:
- Reads: $0.147
- Writes: $0.057
- Deletes: $0.012
- **Subtotal: $0.216/day**

### With Frontend Traffic (100 requests/feed/day):
- Background: $0.216
- Frontend reads: $0.154
- **Total: $0.37/day**

### Monthly Costs

**Background Job Only:**
- $0.216/day × 30 days = **$6.48/month**

**With Frontend Traffic (100 requests/feed/day):**
- $0.37/day × 30 days = **$11.10/month**

**With High Traffic (1,000 requests/feed/day):**
- Background: $0.216/day
- Frontend reads: $1.54/day
- Total: $1.756/day × 30 = **$52.68/month**

## Cost Optimization Recommendations

1. **Reduce Background Job Frequency**: 
   - Change from 15 minutes to 30 minutes = **50% cost reduction**
   - New cost: ~$3.24/month (background only)

2. **Limit Frontend Reads**:
   - Cache RSS XML in memory (already done)
   - Serve from in-memory cache when possible
   - Only read Firestore when cache is empty

3. **Optimize Query**:
   - Currently reading all 80 documents to merge
   - Could use a more efficient approach (but current approach ensures accuracy)

4. **Batch Operations**:
   - Already using Firestore batches (good!)
   - Each batch counts as 1 write operation, not per-document

## Free Tier Limits

Firestore provides:
- **50,000 reads/day** (free)
- **20,000 writes/day** (free)
- **20,000 deletes/day** (free)
- **1 GB storage** (free)

**Your Usage:**
- Reads: 245,760/day (background) + 256,000/day (frontend) = **501,760/day** ❌ Exceeds free tier
- Writes: 31,680/day ✅ Within free tier
- Deletes: 58,880/day ❌ Exceeds free tier
- Storage: 2.5 MB ✅ Well within free tier

## Summary

**For 32 feeds with moderate traffic (100 requests/feed/day):**
- **Monthly Cost: ~$11.10**
- **Main Cost Driver:** Document reads (both background job and frontend)

**For 32 feeds with high traffic (1,000 requests/feed/day):**
- **Monthly Cost: ~$52.68**
- **Main Cost Driver:** Frontend document reads

**Most Cost-Effective Approach:**
- Reduce background job to 30 minutes: **Saves ~$3.24/month**
- Optimize frontend caching: **Saves ~$4.62/month** (at 100 requests/feed/day)
- **Potential savings: ~$7.86/month** (70% reduction)

