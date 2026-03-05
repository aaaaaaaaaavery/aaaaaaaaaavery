# Deployment Fix - Optimized Dockerfile

## Problem
Deployments were taking 30+ minutes and then failing due to:
- Puppeteer and Playwright downloading large Chromium binaries during `npm install`
- Build timeouts on Cloud Run
- Large Docker image sizes

## Solution

### 1. Created `.dockerignore`
Excludes unnecessary files from Docker build context:
- `node_modules` (will be installed fresh)
- Documentation files (`.md`)
- Test files
- Log files
- Cache directories

### 2. Optimized Dockerfile
- **Uses system Chromium**: Installs Chromium via `apt-get` instead of downloading during npm install
- **Skips Chromium downloads**: Sets environment variables to prevent Puppeteer/Playwright from downloading Chromium
- **Faster npm install**: Uses `npm ci` instead of `npm install` for faster, more reliable installs
- **Smaller image**: Removes apt cache after installation

### 3. Updated `browser-scraper.js`
- Checks for `PUPPETEER_EXECUTABLE_PATH` environment variable first
- Falls back to local cache if system Chromium not available
- Updated Playwright to also use system Chromium

## Deployment

The deployment should now be much faster (5-10 minutes instead of 30+ minutes):

```bash
cd rss-feed-service
./deploy.sh AIzaSyAhZUuew7ecR0vg-atfBv8asjae6qTKgwo
```

## Expected Build Time
- **Before**: 30+ minutes (often timing out)
- **After**: 5-10 minutes (should complete successfully)

## What Changed

1. **Dockerfile**: Now installs system Chromium and sets environment variables
2. **`.dockerignore`**: Excludes unnecessary files
3. **`browser-scraper.js`**: Uses system Chromium when available

## Verification

After deployment, check that browser scraping still works:
```bash
curl "https://rss-feed-service-124291936014.us-central1.run.app/feeds/golfdigest.xml"
```

If it returns RSS XML, the deployment was successful.

