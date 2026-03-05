# Firestore Migration Status

## ✅ Completed

1. **Backend Export Service Created** (`export-static-data.js`)
   - All export functions created
   - Serializes Firestore data properly

2. **Backend Endpoints Added to index.js**
   - `/data/yesterday.json` - Yesterday's scores
   - `/data/featured.json` - Featured games
   - `/data/f1-driver-standings.json` - F1 Driver Standings
   - `/data/f1-constructor-standings.json` - F1 Constructor Standings
   - `/data/f1-schedule.json` - F1 Schedule
   - `/data/standings.json` - All league standings
   - `/data/mlb-stats.json` - MLB Stats
   - `/data/nba-stats.json` - NBA Stats
   - `/data/cfp-standings.json` - CFP Standings
   - `/data/today-slate.json` - Today's slate
   - `/data/game/:gameId.json` - Individual game data

3. **Firebase Scripts Removed from HTML**
   - Removed firebase-app-compat.js
   - Removed firebase-auth-compat.js
   - Removed firebase-firestore-compat.js

4. **Backend Helper Function Added**
   - `fetchFromBackend(endpoint)` function added
   - `BACKEND_URL` constant defined

5. **Frontend Functions Updated**
   - ✅ `loadDriverStandings()` - Now uses `/data/f1-driver-standings.json`
   - ✅ `loadConstructorStandings()` - Now uses `/data/f1-constructor-standings.json`
   - ✅ `fetchF1ScheduleData()` - Now uses `/data/f1-schedule.json`
   - ✅ `loadGameContent()` - Now uses `/data/game/:gameId.json`

## ⚠️ Still Needs Migration

### High Priority (Direct Firestore Queries)

1. **Games Collection Queries** (Multiple locations)
   - Line ~9886: `db.collection("artifacts/flashlive-daily-scraper/public/data/sportsGames")`
   - Line ~15639: `onSnapshot` listener
   - Line ~15659: `onSnapshot` listener
   - Line ~18484: `.where('gameDate', '==', todayStr).get()`
   - Line ~18543: `.where('gameDate', '==', yesterdayStr).get()`
   - Line ~18989: `onSnapshot` listener for league games
   - Line ~19310: `.where('gameDate', '==', todayStr).get()`
   - Line ~19414: `upcomingCollectionRef.get()`
   - **Solution:** Use `/data/today.json` and `/data/yesterday.json` endpoints

2. **Yesterday Scores Queries** (Multiple locations)
   - Line ~15682: `db.collection("artifacts/flashlive-daily-scraper/public/data/yesterdayScores")`
   - Line ~15781: `.where('gameDate', '==', yesterdayStr).get()`
   - Line ~15922: `yesterdayScoresRef.get()`
   - Line ~18554: `.where('gameDate', '==', yesterdayStr).get()`
   - **Solution:** Use `/data/yesterday.json` endpoint

3. **Featured Games Query**
   - Line ~17647: `db.collection("artifacts/flashlive-daily-scraper/public/data/Featured")`
   - **Solution:** Use `/data/featured.json` endpoint

4. **Today Slate Query**
   - Line ~17825, 17835, 17870: `db.collection('system').doc('todaySlate')`
   - **Solution:** Use `/data/today-slate.json` endpoint

5. **Standings Query**
   - Line ~16593: `db.collection('standings').get()`
   - **Solution:** Use `/data/standings.json` endpoint

6. **MLB Stats Query**
   - Line ~21931: `db.collection('mlb_stats').doc(category).get()`
   - **Solution:** Use `/data/mlb-stats.json` endpoint

7. **NBA Stats Queries**
   - Line ~21984: `db.collection('nbaStats').doc(section).get()`
   - Line ~22126: `db.collection('nbaTeamStats').doc(section).get()`
   - **Solution:** Use `/data/nba-stats.json` endpoint

8. **CFP Standings Query**
   - Line ~23386, 23754: `db.collection('CFP').get()`
   - **Solution:** Use `/data/cfp-standings.json` endpoint

9. **League-Specific Collections** (Multiple locations)
   - Line ~10026: `db.collection(collectionName).get()`
   - Line ~16406: `db.collection(collectionName).doc('data').get()`
   - Line ~16463: `db.collection(collectionName).doc('data-women').get()`
   - Line ~16530: `db.collection(collectionName).get()`
   - Line ~17553: `db.collection(collectionName).doc('data-women').get()`
   - Line ~19982: `db.collection(tourType).get()`
   - Line ~20404: `db.collection(leagueInfo.upcomingCollectionName).get()`
   - Line ~23269: `db.collection(collectionName).get()`
   - Line ~23590: `db.collection(collectionName).get()`
   - **Solution:** Need to create league-specific endpoints or include in `/data/standings.json`

### Critical: Real-time Listeners (onSnapshot)

These need to be replaced with polling or removed:

1. **Line ~15639:** `onSnapshot` listener for games
2. **Line ~15659:** `onSnapshot` listener for games
3. **Line ~17870:** `onSnapshot` listener for today slate
4. **Line ~18313:** `onSnapshot` listener
5. **Line ~18347:** `onSnapshot` listener
6. **Line ~18989:** `onSnapshot` listener for league games

**Solution Options:**
- Replace with polling (fetch every 30-60 seconds)
- Remove real-time updates (accept static data)
- Use WebSocket from backend (more complex)

## Migration Strategy

### Step 1: Replace All `.get()` Queries
1. Find all `db.collection(...).get()` calls
2. Replace with `fetchFromBackend('/data/...')` calls
3. Update data parsing to match backend JSON structure

### Step 2: Remove All `onSnapshot` Listeners
1. Find all `onSnapshot` calls
2. Replace with polling using `setInterval` and `fetchFromBackend`
3. Or remove if real-time updates aren't critical

### Step 3: Remove All Firebase Initialization Code
1. Remove all `firebase.initializeApp()` calls
2. Remove all `firebase.firestore()` calls
3. Remove all `db` variable declarations that reference Firestore

### Step 4: Test
1. Test all functionality
2. Verify no Firestore errors in console
3. Verify data loads correctly from backend

## Notes

- The backend endpoints read from Firestore once per request
- For better performance, consider adding caching to backend endpoints
- For true "one read for whole site", implement file-based caching in backend
- All endpoints return serialized JSON (Firestore Timestamps converted to ISO strings)

## Next Steps

1. Continue replacing remaining Firestore queries
2. Remove all onSnapshot listeners
3. Test thoroughly
4. Monitor backend logs for any remaining Firestore access attempts

