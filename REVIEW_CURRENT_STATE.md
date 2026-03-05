# How to Review Current State

## Step 1: Deploy Backend (index.js)

The backend endpoints are ready in `index.js`. You need to deploy this to make them available.

### Deployment Options:

**Option A: Deploy to Cloud Run (Recommended)**
```bash
# If you have gcloud CLI configured
gcloud run deploy flashlive-scraper \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

**Option B: Deploy via existing CI/CD**
- If you have a deployment pipeline set up, use that
- The service should be at: `https://flashlive-scraper-124291936014.us-central1.run.app`

## Step 2: Test Backend Endpoints

After deploying, test the endpoints to verify they work:

### Quick Test (Browser)
Open these URLs in your browser:
- `https://flashlive-scraper-124291936014.us-central1.run.app/data/today.json`
- `https://flashlive-scraper-124291936014.us-central1.run.app/data/f1-driver-standings.json`
- `https://flashlive-scraper-124291936014.us-central1.run.app/data/standings.json`

You should see JSON data, not errors.

### Automated Test (Node.js)
Run the test script:
```bash
node test-backend-endpoints.js
```

This will test all endpoints and show which ones work.

### Manual Test (curl)
```bash
# Test today.json
curl https://flashlive-scraper-124291936014.us-central1.run.app/data/today.json

# Test F1 standings
curl https://flashlive-scraper-124291936014.us-central1.run.app/data/f1-driver-standings.json

# Test standings
curl https://flashlive-scraper-124291936014.us-central1.run.app/data/standings.json
```

## Step 3: Check What's Working

### ✅ Backend (Should work after deployment)
- All `/data/*.json` endpoints should return data
- Endpoints read from Firestore once per request
- Data is serialized (Timestamps → ISO strings)

### ⚠️ Frontend (Partially migrated)
- **Working:**
  - F1 Driver Standings
  - F1 Constructor Standings
  - F1 Schedule
  - Game Content Loading
  - Firebase scripts removed

- **Still using Firestore directly:**
  - Games collection queries (multiple locations)
  - Yesterday scores queries
  - Featured games query
  - Today slate query
  - Standings query
  - MLB/NBA stats queries
  - CFP standings query
  - League-specific collections
  - Real-time listeners (onSnapshot)

## Step 4: Verify No Direct Firestore Access

### Check Browser Console
1. Open `index (1).html` in browser
2. Open Developer Tools → Console
3. Look for errors like:
   - `firebase is not defined`
   - `db is not defined`
   - `firestore is not defined`

### Check Network Tab
1. Open Developer Tools → Network
2. Filter by "firestore" or "firebase"
3. Should see NO requests to Firestore
4. Should see requests to `/data/*.json` endpoints

## Step 5: Test Frontend Functions

### Test F1 Standings
1. Navigate to F1 section
2. Click "Standings" tab
3. Should load driver/constructor standings from backend
4. Check Network tab - should see request to `/data/f1-driver-standings.json`

### Test Game Content
1. Click on any game
2. Should load game data from backend
3. Check Network tab - should see request to `/data/game/:gameId.json`

## What to Look For

### ✅ Good Signs
- Backend endpoints return JSON data
- No Firestore errors in console
- F1 standings load correctly
- Game content loads correctly
- Network requests go to backend, not Firestore

### ❌ Problems to Fix
- Backend endpoints return 500 errors → Check backend logs
- Frontend shows "Firestore not initialized" → More Firestore code to replace
- Data doesn't load → Check Network tab for failed requests
- CORS errors → Backend needs CORS headers (already added)

## Next Steps After Review

1. **If backend works:** Continue replacing remaining Firestore queries in frontend
2. **If backend has errors:** Check backend logs, fix issues
3. **If frontend has errors:** Replace more Firestore code with backend calls

## Files Changed

- ✅ `index.js` - Backend endpoints added
- ✅ `export-static-data.js` - Export service created (standalone, can be used separately)
- ✅ `index (1).html` - Firebase scripts removed, some functions updated
- 📝 `FIRESTORE_MIGRATION_STATUS.md` - Detailed list of what still needs migration
- 📝 `test-backend-endpoints.js` - Test script for endpoints

## Current Architecture

```
Before (BAD):
User → Firestore (direct access, each user reads)
User → Firestore (direct access, each user reads)

After (GOOD - Partially Complete):
Backend → Firestore (one read per request)
Backend → Serves JSON at /data/*.json
User → Backend endpoints (no direct Firestore access)
```

## Notes

- Backend endpoints currently read from Firestore on each request
- For better performance, consider adding caching (15-30 min TTL)
- For true "one read for whole site", implement file-based caching
- All endpoints include CORS headers for frontend access

