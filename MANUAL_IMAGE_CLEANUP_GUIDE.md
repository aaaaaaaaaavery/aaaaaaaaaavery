# Manual Docker Image Cleanup Guide - GCP Console

## Overview
This guide shows you how to manually delete old Docker images in the GCP Console to reduce Artifact Registry storage costs.

**Current Storage:** ~101GB (~$10/month)  
**Target:** Keep latest 1 image per service (~3-7GB, ~$0.30-0.70/month)  
**Savings:** ~$9-9.75/month

---

## Step 1: Open Artifact Registry

**Option A - Direct Link:**
```
https://console.cloud.google.com/artifacts?project=flashlive-daily-scraper
```

**Option B - Manual Navigation:**
1. Go to: https://console.cloud.google.com
2. Select project: **flashlive-daily-scraper** (top dropdown)
3. Search for "Artifact Registry" in the top search bar
4. Click on "Artifact Registry"

---

## Step 2: Navigate to Repositories

You'll see 4 repositories:
1. **gcr.io** (location: `us`)
2. **cloud-run-source-deploy** (location: `us-central1`)
3. **gcf-artifacts** (location: `us-central1`)
4. **jobs** (location: `us-central1`)

---

## Step 3: Clean Up Each Repository

### Repository 1: `cloud-run-source-deploy` (LARGEST - ~91GB)

1. Click on **cloud-run-source-deploy**
2. You'll see packages (services):
   - `flashlive-scraper` (main service - has many versions)
   - `rss-feed-service` (RSS feed service)
   - `standings-fetcher` (standings service)
   - Other services...

3. **For each package:**
   - Click on the package name (e.g., `flashlive-scraper`)
   - You'll see a list of images sorted by creation date
   - **Keep the latest 1 image** (top of the list)
   - **Delete all older images:**
     - Check the box next to each old image
     - OR select "Select all" and then uncheck the latest one
     - Click "DELETE" button at the top
     - Confirm deletion

4. **Repeat for each package** in this repository

**Expected results:**
- `flashlive-scraper`: Keep 1, delete ~690+ old ones
- `rss-feed-service`: Keep 1, delete ~10-15 old ones
- `standings-fetcher`: Keep 1, delete old ones if any
- Other services: Keep 1, delete old ones

---

### Repository 2: `gcf-artifacts` (~5.4GB)

1. Click on **gcf-artifacts**
2. This contains old Cloud Functions artifacts
3. **Delete packages you don't use:**
   - Look for packages like:
     - `flashlive--daily--scraper__us--central1__channel--lookup` (old, unused)
     - `flashlive--daily--scraper__us--central1__fetch_and_store_events` (old, unused)
     - `flashlive--daily--scraper__us--central1__thporth--live--games` (check if this is the one in use)
   - **Keep ONLY the package that's currently in use:**
     - Based on our check: `flashlive--daily--scraper__us--central1__thporth--live--games:version_1`
   - **For packages to keep:** Keep latest 1 image, delete old ones
   - **For unused packages:** Delete the entire package

**How to check which package is in use:**
- Go to Cloud Run: https://console.cloud.google.com/run?project=flashlive-daily-scraper
- Click on `thporth-live-games`
- Check the "Container image URL" - that's the one in use

---

### Repository 3: `jobs` (~177MB)

1. Click on **jobs**
2. Contains:
   - `prep-yesterday`
   - `scrape-all-standings`
3. **For each package:**
   - Keep latest 1 image
   - Delete old ones

---

### Repository 4: `gcr.io` (~1.7GB)

1. Click on **gcr.io**
2. This is the main Docker registry (legacy)
3. Check which images are here
4. **Only delete if you're sure they're not in use:**
   - These might be used by older services
   - Be more cautious here

---

## Step 4: Verify Storage Reduction

1. Go back to the Artifact Registry main page
2. You should see updated storage sizes
3. **Expected final size:** ~3-7GB total (down from ~101GB)

---

## Tips

### Which Images to Keep

**Always keep:**
- The **latest** image (by creation date, top of the list)
- Images that are currently in use by Cloud Run services

**Safe to delete:**
- Images older than 1 week
- Images not referenced by any running service
- Old deployment artifacts

### How to Check if an Image is in Use

1. Go to Cloud Run: https://console.cloud.google.com/run?project=flashlive-daily-scraper
2. Click on each service
3. Check "Container image URL" in the service details
4. The image shown there is the one in use (keep it!)

### Current Services (as of last check):

- **flashlive-scraper**: Uses `us-central1-docker.pkg.dev/flashlive-daily-scraper/cloud-run-source-deploy/flashlive-scraper@sha256:0623902e...`
- **rss-feed-service**: Uses `us-central1-docker.pkg.dev/flashlive-daily-scraper/cloud-run-source-deploy/rss-feed-service@sha256:3984e82a...`
- **standings-fetcher**: Uses `us-central1-docker.pkg.dev/flashlive-daily-scraper/cloud-run-source-deploy/standings-fetcher@sha256:4764e3ca...`
- **thporth-live-games**: Uses `us-central1-docker.pkg.dev/flashlive-daily-scraper/gcf-artifacts/flashlive--daily--scraper__us--central1__thporth--live--games:version_1`

---

## Expected Time

- **cloud-run-source-deploy**: ~10-15 minutes (most images to delete)
- **gcf-artifacts**: ~5 minutes
- **jobs**: ~2 minutes
- **gcr.io**: ~5 minutes (be careful here)

**Total:** ~20-30 minutes

---

## Expected Savings

**Before:**
- Storage: ~101GB = ~$10.05/month

**After:**
- Storage: ~3-7GB = ~$0.30-0.70/month

**Savings:** ~$9.35-9.75/month (~95% reduction)

---

## Quick Access Links

- **Artifact Registry**: https://console.cloud.google.com/artifacts?project=flashlive-daily-scraper
- **Cloud Run Services**: https://console.cloud.google.com/run?project=flashlive-daily-scraper
- **Billing Reports**: https://console.cloud.google.com/billing/01D3B4-343BA5-7B8388/reports

---

## After Cleanup

Check your billing in 24-48 hours to see the storage costs drop. The "App Engine" costs should decrease from ~$0.39/day to ~$0.01-0.02/day.
