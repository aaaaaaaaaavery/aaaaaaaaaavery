# Firestore Cache Setup Guide

This service uses Firestore to cache RSS.app feeds for fast serving and to bypass NewsNow redirects.

## How It Works

1. **RSS.app feeds are fetched** (they load quickly)
2. **Final URLs are extracted** (bypassing NewsNow redirect layer)
3. **Items are stored in Firestore** with final URLs
4. **Feeds are served from Firestore** (fast, no redirects)

## Setup

### 1. Verify Firestore is Enabled

Since you already have a Firestore database for your project (`flashlive-daily-scraper`), you just need to make sure it's enabled:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **`flashlive-daily-scraper`**
3. Navigate to **Firestore Database**
4. If you see your existing collections (like `artifacts`), Firestore is already enabled - you're good to go!
5. If you see a "Create Database" button, click it and choose **Native mode**, then select a location (same region as Cloud Run: `us-central1`)

**Note:** You're using your **existing Firestore database** - no new database needed! We'll just add a new collection called `feed_items`.

### 2. Verify Authentication & Permissions

**For Cloud Run (Production):**
Firestore will automatically use the Cloud Run service account credentials. Verify permissions:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **`flashlive-daily-scraper`**
3. Navigate to **IAM & Admin > Service Accounts**
4. Find the service account for Cloud Run (usually named like `PROJECT_NUMBER-compute@developer.gserviceaccount.com` or `rss-feed-service@flashlive-daily-scraper.iam.gserviceaccount.com`)
5. Click on the service account
6. Go to **Permissions** tab
7. Verify it has one of these roles:
   - **Cloud Datastore User** (recommended)
   - **Firebase Admin** (full access)
   - **Owner** (full access, but overkill)
8. If missing, click **Grant Access** and add **Cloud Datastore User** role

**For Local Testing:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Click **Create Credentials > Service Account**
4. Name it (e.g., "local-testing")
5. Grant it **Cloud Datastore User** role
6. Click **Done**
7. Click on the new service account
8. Go to **Keys** tab
9. Click **Add Key > Create New Key > JSON**
10. Download the JSON file
11. Set environment variable: `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/downloaded-key.json"`

### 3. Create Firestore Collection

The service will **automatically create** the `feed_items` collection in your existing database when it first runs. No manual setup needed!

Your existing Firestore database structure:
```
flashlive-daily-scraper (Database)
├── artifacts/ (your existing collection)
├── feed_items/ (NEW - created automatically)
└── ... (other existing collections)
```

### 4. Firestore Indexes

The service queries by:
- `feed_id` (equality)
- `pubDate` (descending order)

Firestore will prompt you to create a composite index if needed. You can create it manually or click the link in the error message.

## How It Works

### For RSS.app Feeds

When a feed is requested:
1. Check Firestore cache first
2. If cached and fresh (< 30 minutes old), serve from cache
3. If not cached or stale, fetch from RSS.app
4. Extract final URLs (bypass NewsNow redirects)
5. Store in Firestore
6. Serve the feed

### URL Extraction

The service automatically extracts final URLs from NewsNow redirect links:
- Input: `https://www.newsnow.co.uk/.../redirect?url=https://example.com/article`
- Output: `https://example.com/article`

## Cost

**Free Tier:**
- 50,000 document reads/day
- 20,000 document writes/day
- 1 GB storage

**Beyond Free Tier:**
- Reads: $0.06 per 100,000 documents
- Writes: $0.18 per 100,000 documents
- Storage: $0.18 per GB/month

**Estimated Cost:**
- 30 feeds × 50 items × 48 refreshes/day = ~72,000 writes/day
- This exceeds free tier (20K writes/day)
- Cost: ~$0.10-0.15/day (~$3-5/month)

**To Stay Free:**
- Reduce refresh frequency (every 1-2 hours instead of 30 minutes)
- Limit number of cached feeds
- Use fewer items per feed

## Monitoring

Check Firestore usage in Google Cloud Console:
- **Firestore > Usage** tab
- Monitor read/write operations
- Check storage usage

## Troubleshooting

### "Permission denied" errors
- Ensure Firestore is enabled in your project (check existing collections are visible)
- Check that Cloud Run service account has Firestore permissions (should work automatically)
- For local testing, run `gcloud auth application-default login`

### "Index required" errors
- Click the link in the error message to create the index
- Or create manually in Firestore Console > Indexes
- The index will be for: `feed_id` (ascending) + `pubDate` (descending)

### Feeds not caching
- Check Cloud Run logs for Firestore errors
- Verify Firestore is enabled (you should see your existing `artifacts` collection)
- Check that feed URLs contain "rss.app"
- Verify the `feed_items` collection appears in Firestore Console after first run

## Testing

The service will gracefully fall back to normal processing if Firestore is unavailable. Check logs for:
- `[Firestore] Initialized successfully` - Firestore is working
- `[Firestore] Retrieved X cached items` - Cache hit
- `[Firestore] Cached X items` - Items stored successfully
