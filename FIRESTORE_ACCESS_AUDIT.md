# Firestore Access Audit Report

## ❌ CRITICAL ISSUE: Direct Firestore Access Found

Your site currently has **extensive direct Firestore access** from the frontend. Users are reading directly from Firestore, which means:
- Each user makes their own Firestore reads
- No single read for the whole site
- Higher Firestore costs
- Potential security issues

## Current State: Direct Firestore Queries Found

### 1. **Firebase/Firestore Scripts Loaded** (Lines 5-7)
```html
<script defer src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js"></script>
<script defer src="https://www.gstatic.com/firebasejs/10.0.0/firebase-auth-compat.js"></script>
<script defer src="https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore-compat.js"></script>
```
**Status:** ❌ Users have direct access to Firestore

### 2. **Game-Specific Content** (Line ~5072)
```javascript
const gameDocRef = db.collection("artifacts/flashlive-daily-scraper/public/data/sportsGames").doc(gameId);
const gameDoc = await gameDocRef.get();
```
**Status:** ❌ Direct Firestore query for game content
**Should be:** Static JSON file or backend API endpoint

### 3. **F1 Driver Standings** (Line ~8573)
```javascript
const snapshot = await firestoreDb.collection('F1DriverStandings').get();
```
**Status:** ❌ Direct Firestore query
**Should be:** `f1-driver-standings.json` or backend endpoint

### 4. **F1 Constructor Standings** (Line ~8645)
```javascript
const snapshot = await firestoreDb.collection('F1ConstructorStandings').get();
```
**Status:** ❌ Direct Firestore query
**Should be:** `f1-constructor-standings.json` or backend endpoint

### 5. **F1 Schedule** (Line ~8725)
```javascript
const snapshot = await firestoreDb.collection('FormulaOne').get();
```
**Status:** ❌ Direct Firestore query
**Should be:** `f1-schedule.json` or backend endpoint

### 6. **Games Collection - Multiple Queries**
- Line ~9886: `db.collection("artifacts/flashlive-daily-scraper/public/data/sportsGames")`
- Line ~15639: `onSnapshot` listener for live updates
- Line ~15659: `onSnapshot` listener for live updates
- Line ~18484: `.where('gameDate', '==', todayStr).get()`
- Line ~18543: `.where('gameDate', '==', yesterdayStr).get()`
- Line ~18989: `onSnapshot` listener for league games
- Line ~19310: `.where('gameDate', '==', todayStr).get()`
- Line ~19414: `upcomingCollectionRef.get()`

**Status:** ❌ Multiple direct Firestore queries
**Should be:** `today.json` (already exists at line 18058, but other queries still use Firestore)

### 7. **Yesterday Scores** (Multiple locations)
- Line ~15682: `db.collection("artifacts/flashlive-daily-scraper/public/data/yesterdayScores")`
- Line ~15781: `.where('gameDate', '==', yesterdayStr).get()`
- Line ~15922: `yesterdayScoresRef.get()`
- Line ~18554: `.where('gameDate', '==', yesterdayStr).get()`

**Status:** ❌ Direct Firestore queries
**Should be:** `yesterday.json` or backend endpoint

### 8. **Standings** (Line ~16593)
```javascript
const snapshot = await db.collection('standings').get();
```
**Status:** ❌ Direct Firestore query
**Should be:** `standings.json` or backend endpoint

### 9. **Featured Games** (Line ~17647)
```javascript
const featuredRef = db.collection("artifacts/flashlive-daily-scraper/public/data/Featured");
const snapshot = await featuredRef.where('gameDate', '==', dateStr).get();
```
**Status:** ❌ Direct Firestore query
**Should be:** `featured.json` or backend endpoint

### 10. **Today Slate** (Lines ~17825, 17835, 17870)
```javascript
const todaySlateRef = db.collection('system').doc('todaySlate');
const doc = await todaySlateRef.get();
todaySlateUnsubscribe = todaySlateRef.onSnapshot((doc) => { ... });
```
**Status:** ❌ Direct Firestore query + real-time listener
**Should be:** `today-slate.json` or backend endpoint

### 11. **Live Game Updates** (Real-time listeners)
- Line ~18313: `onSnapshot` listener
- Line ~18347: `onSnapshot` listener
- Line ~18989: `onSnapshot` listener for league games

**Status:** ❌ Real-time Firestore listeners
**Should be:** WebSocket or polling from backend API

### 12. **MLB Stats** (Line ~21931)
```javascript
const docRef = db.collection('mlb_stats').doc(category);
const doc = await docRef.get();
```
**Status:** ❌ Direct Firestore query
**Should be:** `mlb-stats.json` or backend endpoint

### 13. **NBA Stats** (Lines ~21984, 22126)
```javascript
const docRef = db.collection('nbaStats').doc(section);
const doc = await docRef.get();
const docRef = db.collection('nbaTeamStats').doc(section);
const doc = await docRef.get();
```
**Status:** ❌ Direct Firestore queries
**Should be:** `nba-stats.json` and `nba-team-stats.json` or backend endpoints

### 14. **CFP Standings** (Lines ~23386, 23754)
```javascript
const snapshot = await db.collection('CFP').get();
```
**Status:** ❌ Direct Firestore query
**Should be:** `cfp-standings.json` or backend endpoint

### 15. **League-Specific Collections** (Multiple locations)
- Line ~10026: `db.collection(collectionName).get()`
- Line ~16406: `db.collection(collectionName).doc('data').get()`
- Line ~16463: `db.collection(collectionName).doc('data-women').get()`
- Line ~16530: `db.collection(collectionName).get()`
- Line ~17553: `db.collection(collectionName).doc('data-women').get()`
- Line ~19982: `db.collection(tourType).get()`
- Line ~20404: `db.collection(leagueInfo.upcomingCollectionName).get()`
- Line ~23269: `db.collection(collectionName).get()`
- Line ~23590: `db.collection(collectionName).get()`

**Status:** ❌ Multiple direct Firestore queries
**Should be:** Static JSON files per league or backend endpoints

## ✅ What's Already Working Correctly

### Games Data (Line ~18058)
```javascript
const JSON_ENDPOINT = 'https://flashlive-scraper-124291936014.us-central1.run.app/data/today.json';
const response = await fetch(JSON_ENDPOINT);
const jsonData = await response.json();
```
**Status:** ✅ Already using static JSON endpoint (like `today.json`)

### RSS Feeds
**Status:** ✅ RSS feeds are loaded from `rss-feed-service` (not directly from Firestore)
- Feeds are served via HTTP endpoints
- No direct Firestore access for RSS feeds

## Summary Statistics

- **Total `.get()` calls:** 42+
- **Total `onSnapshot` listeners:** 5+
- **Total direct Firestore collections accessed:** 15+
- **Firebase scripts loaded:** 3 (app, auth, firestore)

## Required Actions

### Immediate Priority: Remove All Direct Firestore Access

1. **Remove Firebase/Firestore scripts** from HTML (lines 5-7)
2. **Replace all Firestore queries** with:
   - Static JSON files (like `today.json`)
   - Backend API endpoints
   - Pre-generated data files

3. **Convert each Firestore query to static file:**
   - `F1DriverStandings` → `f1-driver-standings.json`
   - `F1ConstructorStandings` → `f1-constructor-standings.json`
   - `FormulaOne` → `f1-schedule.json`
   - `yesterdayScores` → `yesterday.json`
   - `standings` → `standings.json`
   - `Featured` → `featured.json`
   - `mlb_stats` → `mlb-stats.json`
   - `nbaStats` → `nba-stats.json`
   - `nbaTeamStats` → `nba-team-stats.json`
   - `CFP` → `cfp-standings.json`
   - League-specific collections → `{league}-data.json`

4. **Remove all `onSnapshot` listeners:**
   - Replace with polling from backend API
   - Or use WebSocket for real-time updates
   - Or accept static data that updates periodically

5. **Backend should:**
   - Read from Firestore once (scheduled job)
   - Generate static JSON files
   - Serve files via HTTP/CDN
   - Update files periodically (every 15 minutes, hourly, etc.)

## Architecture Goal

```
Current (BAD):
User → Firestore (each user reads directly)
User → Firestore (each user reads directly)
User → Firestore (each user reads directly)

Target (GOOD):
Backend → Firestore (one read)
Backend → Generates today.json, standings.json, etc.
User → today.json (static file)
User → standings.json (static file)
User → rss-feed-service (HTTP endpoint, not Firestore)
```

## Next Steps

1. Create backend job that reads from Firestore once
2. Generate static JSON files for all data
3. Update frontend to fetch from static files/endpoints
4. Remove all Firestore client-side code
5. Remove Firebase/Firestore scripts from HTML
6. Test that all functionality still works
7. Monitor Firestore costs (should drop significantly)

