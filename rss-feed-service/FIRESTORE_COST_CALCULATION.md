# Firestore Cost Calculation for RSS Feed Service

## Feed Breakdown
- **RSS.app (NewsNow) feeds**: 33 feeds
- **YouTube feeds**: 43 feeds  
- **Reddit feeds**: 32 feeds
- **Other scrapers**: 151 feeds
- **Total**: 259 feeds

---

## Usage Patterns

### Background Job (Runs every 15 minutes)
- **Frequency**: 96 times per day = 2,880 times per month
- **Per refresh per feed**:
  - Reads: ~80 (to check existing items, remove duplicates)
  - Writes: ~20 (new articles)
  - Deletes: ~10 (old items beyond 80 limit) = counts as writes

**Per refresh (all 259 feeds):**
- Reads: 259 feeds × 80 = **20,720 reads**
- Writes: 259 feeds × (20 + 10) = **7,770 writes**

**Monthly background operations:**
- Reads: 20,720 × 2,880 = **59,673,600 reads**
- Writes: 7,770 × 2,880 = **22,377,600 writes**

### Frontend Requests
- **Estimated**: 1,000 feed requests per day = 30,000 per month
- **Per request**: ~80 reads (to get cached items)

**Monthly frontend reads:**
- 30,000 × 80 = **2,400,000 reads**

---

## Total Monthly Operations

- **Reads**: 59,673,600 + 2,400,000 = **62,073,600 reads**
- **Writes**: **22,377,600 writes**

---

## Firestore Pricing (as of 2024)

- **Reads**: $0.06 per 100,000 document reads
- **Writes**: $0.18 per 100,000 document writes  
- **Storage**: $0.18 per GB/month

---

## Monthly Cost Calculation

### Reads Cost
- 62,073,600 reads ÷ 100,000 = 620.736 units
- 620.736 × $0.06 = **$37.24/month**

### Writes Cost
- 22,377,600 writes ÷ 100,000 = 223.776 units
- 223.776 × $0.18 = **$40.28/month**

### Storage Cost
- Estimated storage: ~1 GB (80 items × 259 feeds × ~500 bytes per item)
- 1 GB × $0.18 = **$0.18/month**

---

## **Total Estimated Monthly Cost: ~$77.70/month**

---

## Cost Breakdown by Component

- **Background job writes**: $40.28 (52% of total)
- **Background job reads**: $37.24 (48% of total)
- **Frontend reads**: Included in total reads above
- **Storage**: $0.18 (<1% of total)

---

## Cost Optimization Strategies

1. **Increase refresh interval**: Change from 15 minutes to 30 minutes
   - Would cut costs in half: **~$38.85/month**

2. **Reduce items per feed**: From 80 to 40 items
   - Would reduce reads/writes by ~50%: **~$38.85/month**

3. **Use local SQLite** (current setup): **$0/month** ✅
   - No cloud costs
   - Runs on your machine
   - Perfect for local/dedicated machine setup

---

## Recommendation

**Use local SQLite database** (which you're already set up for):
- **Cost**: $0/month
- **Performance**: Instant (local database)
- **Reliability**: High (file-based, no network dependency)
- **Scalability**: Handles 259 feeds easily

Firestore is only needed if you want:
- Cloud-based service (runs on Google Cloud)
- Automatic scaling
- Multi-region availability

For a dedicated machine running 24/7, **local SQLite is the better choice**.

