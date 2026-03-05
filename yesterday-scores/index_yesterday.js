// index.js
import { DateTime } from 'luxon';
import admin from 'firebase-admin';
import fetch from 'node-fetch';
import express from 'express';








// Firebase Admin initialization using application default credentials
let db;
function initializeFirebase() {
if (db) return db; // Return existing db instance if already initialized
if (!admin.apps.length) {
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID
});
}
db = admin.firestore();
console.log('Firebase Firestore initialized.');
return db;
}








const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const API_REQUEST_DELAY_MS = 1500;








// Allowed leagues with sport-specific filtering
const ALLOWED_LEAGUE_KEYWORDS = {
// Soccer-specific leagues
'Soccer': [
 "Euro Women", "Europe: Conference League - League phase",  "Leagues Cup", "Europa League", "North & Central America: Leagues Cup - Play Offs",
 // "World: Club Friendly", // Commented out - can be easily re-added later
 "Conference League", "Portugal: Super Cup", "UEFA Champions League", "Europe: Champions League - League phase",
 "World: Friendly International",
 "England: Premier League", "England: EFL Cup", "Italy: Coppa Italia", "USA: MLS - Play Offs",
 "Turkey: Super Lig", "Europe: Europa League - Qualification", "Europe: Europa League - League phase", "Europe: Champions League Women - Qualification - Second stage",
 "Europe: Conference League - Qualification", "Germany: Bundesliga", "Portugal: Liga Portugal", "Italy: Serie A", "Spain: LaLiga",
 "France: Ligue 1", "South America: Copa Libertadores - Play Offs", "USA: MLS", "Brazil: Serie A Betano",
 "South America: Copa Sudamericana - Play Offs", "Europe: Champions League - Qualification", "World: World Cup U20",
 "Germany: DFB Pokal", "USA: NWSL Women", "Mexico: Liga MX", "Mexico: Liga MX - Apertura", "Mexico: Liga MX - Clausura", "Saudi Arabia: Saudi Professional League",
 // ✅ Newly added
 "England: Championship", "World: World Cup U20 - Play Offs", "Africa: World Cup - Qualification", "Asia: World Cup - Qualification - Fourth stage",
  "Asia: Asian Cup - Qualification - Third round", "Europe: World Cup - Qualification",
  "North & Central America: World Cup - Qualification - Third stage", "World: Club Friendly", "USA: USL Championship", "Europe: Champions League Women - League phase", "Scotland: Premiership", "England: WSL", "Netherlands: Eredivisie", "North & Central America: Campeones Cup", "Argentina: Torneo Betano - Clausura", "Argentina: Torneo Betano - Apertura", "Scotland: Scottish Cup"
],
// Basketball-specific leagues
'Basketball': [
 "USA: NBA", "USA: WNBA", "World: AmeriCup", "USA: NBA - Pre-season",
 // ✅ Newly added
 "USA: WNBA - Play Offs"
],
// American Football-specific leagues
'American Football': [
 "NFL", "USA: NFL", "USA: NCAA", "USA: NFL - Pre-season", "Canada: CFL"
],
// Tennis-specific leagues
'Tennis': [
 "USA: Cleveland WTA, hard",
 "USA: US Open ATP, hard", "USA: US Open WTA, hard"
],
// Auto Racing specific leagues
'Auto Racing': [
 "NASCAR Cup Series"
],
// Baseball-specific leagues
'Baseball': [
 "USA: MLB", "USA: MLB - Play Offs"
],
// Hockey-specific leagues
'Hockey': [
 "USA: NHL", "USA: NHL - Pre-season", "Canada: OHL", "USA: NCAA"
],
// Cricket-specific leagues
'Cricket': [
  "World: ICC World Cup Women", "World: Twenty20 International", "World: Test Series"
],
// Golf-specific leagues
'Golf': [
 // ✅ Newly added
 "World: Ryder Cup"
]
};








const sportsToFetch = [
{ slug: 'soccer', id: 1, name: 'Soccer' },
{ slug: 'basketball', id: 3, name: 'Basketball' },
{ slug: 'hockey', id: 4, name: 'Hockey' },
{ slug: 'football', id: 5, name: 'American Football' },
{ slug: 'baseball', id: 6, name: 'Baseball' }
];








// Mapping of leagues to their RapidAPI sport slug, sport ID, and league name for the new function
const leaguesToFetch = [
{ slug: 'golf', id: 23, leagueName: 'PGA Tour' },
{ slug: 'tennis', id: 2, leagueName: 'ATP' },
{ slug: 'tennis', id: 2, leagueName: 'WTA' },
{ slug: 'football', id: 5, leagueName: 'USA: NCAA' },
{ slug: 'soccer', id: 1, leagueName: 'NWSL Women' },
{ slug: 'soccer', id: 1, leagueName: 'France: Ligue 1' },
{ slug: 'soccer', id: 1, leagueName: 'Europe: Europa League' },
{ slug: 'soccer', id: 1, leagueName: 'Europe: Conference League' }
];
















async function fetchRapidApiData(url, headers) {
await new Promise(resolve => setTimeout(resolve, API_REQUEST_DELAY_MS));
const response = await fetch(url, { headers });
if (!response.ok) {
const errorText = await response.text();
throw new Error(`HTTP error! ${response.status}: ${errorText} @ ${url}`);
}
return await response.json();
}








async function writeGamesToFirestore(games) {
const db = initializeFirebase();
const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/yesterdayScores`);








const batch = db.batch();
let gameCount = 0;
for (const game of games) {
if (!game['Game ID']) {
  console.warn('Skipping Firestore write for game with missing or empty "Game ID":', JSON.stringify(game));
  continue;
}
const docRef = gamesRef.doc(String(game['Game ID']));
batch.set(docRef, game, { merge: true });
gameCount++;
}








try {
await batch.commit();
console.log(`Successfully wrote ${gameCount} games to Firestore.`);
} catch (error) {
console.error('--- Firestore Batch Commit Failed ---');
console.error('Error during batch commit:', error);
if (error.message) console.error('Error Message:', error.message);
if (error.stack) console.error('Error Stack:', error.stack);
if (error.code) console.error('Firestore Error Code:', error.code);
if (error.details) console.error('Firestore Error Details:', error.details);
throw error;
}
}








async function clearFirestoreCollection() {
const db = initializeFirebase();
const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/yesterdayScores`);
const snapshot = await gamesRef.get();








if (snapshot.empty) {
console.log('No documents to clear in Firestore.');
return;
}
const batch = db.batch();
snapshot.forEach(doc => batch.delete(doc.ref));
await batch.commit();
console.log(`🧹 Cleared ${snapshot.size} docs from Firestore.`);
}








function createNoopRes() {
return {
status() { return this; },
send() {},
json() {}
};
}








// =================================================================
// ORIGINAL FUNCTIONS (RETAINED)
// =================================================================
const fetchYesterdayScoresHandler = async (req, res) => {
try {
console.log('--- fetchYesterdayScoresHandler started. ---');
 // --- Step 1: Clear the yesterdayScores Collection ---
console.log('Clearing yesterdayScores collection for the new day...');
await clearFirestoreCollection();
console.log('yesterdayScores collection cleared.');








// --- Step 2: Populate with Yesterday's Games ---
console.log('Fetching yesterday\'s games...');








const rapidApiHeaders = {
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': RAPIDAPI_HOST
};








const nowInEastern = DateTime.now().setZone('America/New_York');
const yesterdayStr = nowInEastern.minus({ days: 1 }).toISODate();
const allGames = [];








for (const sport of sportsToFetch) {
  const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&locale=en_INT&sport_id=${sport.id}&timezone=0&date=${yesterdayStr}&indent_days=0&status=finished`;








  try {
    const data = await fetchRapidApiData(url, rapidApiHeaders);
    const tournaments = data.DATA || [];








    for (const tour of tournaments) {
      const events = tour.EVENTS || [];
      for (const event of events) {
        // Only include finished games
        if (event.STAGE_TYPE !== 'FINISHED') {
          continue;
        }
       
        const game = {
          'Sport': tour.SPORT_NAME || sport.name,
          'Game ID': event.EVENT_ID,
          'League': tour.NAME,
          'Matchup': `${event.HOME_NAME} vs ${event.AWAY_NAME}`,
          'Start Time': admin.firestore.Timestamp.fromMillis(event.START_TIME * 1000),
          'Home Team': event.HOME_NAME,
          'Away Team': event.AWAY_NAME,
          'Home Score': event.HOME_SCORE_CURRENT || '',
          'Away Score': event.AWAY_SCORE_CURRENT || '',
          'Status': event.STAGE || '',
          'Current Lap': event.RACE_RESULTS_LAP_DISTANCE || '',
          'Match Status': event.STAGE_TYPE || '',
          'Stage': event.STAGE || '',
          'GameTime': event.GAME_TIME || '',
          'StageStartTime': event.STAGE_START_TIME || '',
          'StartTime': event.START_TIME || '',
          'StageType': event.STAGE_TYPE || '',
          'Last Updated': new Date().toISOString(),
          'gameDate': yesterdayStr
        };
      
        allGames.push(game);
      }
    }
  } catch (err) {
    console.error(`Error fetching ${sport.name}: ${err.message}`);
  }
}
console.log(`Fetched ${allGames.length} games from RapidAPI.`);








const gamesForFirestore = allGames.filter(g => {
  const allowedLeaguesForSport = ALLOWED_LEAGUE_KEYWORDS[g.Sport] || [];
  const isAllowedLeague = allowedLeaguesForSport.includes(g.League);
  const hasValidTeams = g['Home Team'] && g['Away Team'];
  const hasStartTime = g['Start Time'];
  const hasGameId = g['Game ID'];
  return isAllowedLeague && hasValidTeams && hasStartTime && hasGameId;
});








console.log(`Filtered ${gamesForFirestore.length} games for Firestore based on sport-specific ALLOWED_LEAGUE_KEYWORDS.`);
await writeGamesToFirestore(gamesForFirestore);
console.log('Successfully completed Firestore write for initial scrape.');








if (res) {
  res.status(200).send(`Wrote ${gamesForFirestore.length} games to Firestore.`);
}
} catch (err) {
console.error('--- initialScrapeAndStartPollingHandler FAILED ---', err);
if (res) res.status(500).send('Scrape failed.');
}
};
















const pollLiveGamesHandler = async (req, res) => {
try {
console.log('--- pollLiveGamesHandler started. ---');








const db = initializeFirebase();
const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/yesterdayScores`);
const nowInMountain = DateTime.now().setZone('America/Denver');
const yesterdayStr = nowInMountain.minus({ days: 1 }).toISODate();
console.log(`[Backend] Current Mountain Time Date (yesterdayStr): ${yesterdayStr}`);








const snapshot = await gamesRef.get();
const deleteBatch = db.batch();
let deleteCount = 0;








snapshot.forEach(doc => {
  const data = doc.data();
  if (data.gameDate !== yesterdayStr) {
    deleteBatch.delete(doc.ref);
    deleteCount++;
  }
});








if (deleteCount > 0) {
  await deleteBatch.commit();
  console.log(`🧹 Deleted ${deleteCount} old games from Firestore.`);
} else {
  console.log('✅ No old games to delete.');
}








const rapidApiHeaders = {
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': RAPIDAPI_HOST
};








const allGames = [];
for (const sport of sportsToFetch) {
  const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&locale=en_INT&sport_id=${sport.id}&timezone=0&date=${yesterdayStr}&indent_days=0&status=finished`;
  try {
    const data = await fetchRapidApiData(url, rapidApiHeaders);
    const tournaments = data.DATA || [];
    for (const tour of tournaments) {
      for (const event of tour.EVENTS || []) {
        // Only include finished games
        if (event.STAGE_TYPE !== 'FINISHED') {
          continue;
        }
       
        allGames.push({
          'Sport': tour.SPORT_NAME || sport.name,
          'Game ID': event.EVENT_ID,
          'League': tour.NAME,
          'Matchup': `${event.HOME_NAME || ''} vs ${event.AWAY_NAME || ''}`,
          'Start Time': admin.firestore.Timestamp.fromMillis(event.START_TIME * 1000),
          'Home Team': event.HOME_NAME || '',
          'Away Team': event.AWAY_NAME || '',
          'Home Score': event.HOME_SCORE_CURRENT || '',
          'Away Score': event.AWAY_SCORE_CURRENT || '',
          'Status': event.STAGE || '',
          'Match Status': event.STAGE_TYPE || '',
          'Current Lap': event.RACE_RESULTS_LAP_DISTANCE || '',
          'Stage': event.STAGE || '',
          'GameTime': event.GAME_TIME || '',
          'StageStartTime': event.STAGE_START_TIME || '',
          'StartTime': event.START_TIME || '',
          'StageType': event.STAGE_TYPE || '',
          'Last Updated': new Date().toISOString(),
          'gameDate': yesterdayStr
        });
      }
    }
  } catch (err) {
    console.error(`Error fetching ${sport.name}: ${err.message}`);
  }
}
console.log(`Fetched ${allGames.length} games from RapidAPI.`);








// Debug: Log all unique leagues being fetched
const uniqueLeagues = [...new Set(allGames.map(g => g.League))];
console.log('All leagues being fetched:', uniqueLeagues);








const gamesForFirestore = allGames.filter(g => {
  const allowedLeaguesForSport = ALLOWED_LEAGUE_KEYWORDS[g.Sport] || [];
  const isAllowedLeague = allowedLeaguesForSport.includes(g.League);
  const hasValidTeams = g['Home Team'] && g['Away Team'];
  const hasStartTime = g['Start Time'];
  const hasGameId = g['Game ID'];
 
  // Debug logging for NBA games or specific game IDs
  if (g.Sport === 'Basketball' || g['Game ID'] === '8vNrYgSb' || g['Game ID'] === '2wGiWXdB') {
    console.log(`\n🏀 DEBUG - Game ${g['Game ID']}:`);
    console.log(`  League: "${g.League}"`);
    console.log(`  Sport: "${g.Sport}"`);
    console.log(`  Home Team: "${g['Home Team']}"`);
    console.log(`  Away Team: "${g['Away Team']}"`);
    console.log(`  Has Start Time: ${!!hasStartTime}`);
    console.log(`  Has Game ID: ${hasGameId}`);
    console.log(`  Is Allowed League: ${isAllowedLeague}`);
    console.log(`  Allowed leagues for ${g.Sport}:`, allowedLeaguesForSport);
    console.log(`  WILL BE INCLUDED: ${isAllowedLeague && hasValidTeams && hasStartTime && hasGameId}\n`);
  }
 
  return isAllowedLeague && hasValidTeams && hasStartTime && hasGameId;
});
console.log(`Filtered ${gamesForFirestore.length} games for Firestore using exact matching.`);








if (gamesForFirestore.length > 0) {
  await writeGamesToFirestore(gamesForFirestore);
  console.log(`✅ Successfully updated ${gamesForFirestore.length} games in Firestore.`);
} else {
  console.log('⚠️ No valid games to update.');
}








if (res) res.status(200).send(`Polling complete. Updated ${gamesForFirestore.length} games.`);
} catch (err) {
console.error('--- pollLiveGamesHandler FAILED ---', err);
if (res) res.status(500).send('Polling failed.');
}
};








const refreshAllHandler = async (req, res) => {
try {
console.log('--- /refreshAll triggered ---');
await clearFirestoreCollection();
await initialScrapeAndStartPollingHandler(req, createNoopRes());
await pollLiveGamesHandler(req, createNoopRes());
res.status(200).send('refreshAll complete: wiped Firestore, scraped fresh data, updated Sheets, and polled live games.');
} catch (err) {
console.error('--- /refreshAll FAILED ---', err);
res.status(500).send('refreshAll failed');
}
};








// =================================================================
// NEW FUNCTIONALITY ADDED HERE
// =================================================================
const FUTURE_GAMES_SHEET_NAME = "Future Games";








/**
* Checks if a sheet with a specific title exists and creates it if it doesn't.
* Returns the title of the sheet that was found or created.
* @param {string} spreadsheetId The ID of the Google Spreadsheet.
* @param {string} sheetName The title of the sheet to find or create.
* @returns {string} The title of the found or created sheet.
*/
async function createOrGetSheet(spreadsheetId, sheetName) {
try {
// Check if the sheet already exists
const response = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: 'sheets.properties.title'
});
const sheetsList = response.data.sheets;
const existingSheet = sheetsList.find(s => s.properties.title === sheetName);








if (existingSheet) {
  console.log(`Sheet "${sheetName}" already exists. Using existing tab.`);
  return sheetName;
}








// If the sheet doesn't exist, create it
console.log(`Sheet "${sheetName}" not found. Creating a new tab...`);
const request = {
  spreadsheetId,
  resource: {
    requests: [{
      addSheet: {
        properties: {
          title: sheetName
        }
      }
    }]
  }
};
await sheets.spreadsheets.batchUpdate(request);
console.log(`Successfully created new sheet with title "${sheetName}".`);
return sheetName;
} catch (err) {
console.error(`Error in createOrGetSheet: ${err.message}`);
throw err;
}
}








async function fetchUpcomingGamesHandler(req, res) {
try {
console.log('--- fetchUpcomingGamesHandler started for the next 7 days. ---');








await authenticateGoogleSheets();
await createOrGetSheet(SPREADSHEET_ID, FUTURE_GAMES_SHEET_NAME);








const rapidApiHeaders = {
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': RAPIDAPI_HOST
};








const allGames = [];
const nowInEastern = DateTime.now().setZone('America/New_York');








// Loop for the next 7 days (including today)
for (let i = 0; i < 7; i++) {
  const dateToFetch = nowInEastern.plus({ days: i }).toISODate();
  console.log(`Fetching games for date: ${dateToFetch}`);








  for (const league of leaguesToFetch) {
    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${league.slug}&date=${dateToFetch}&locale=en_INT&sport_id=${league.id}&timezone=0&indent_days=0&status=finished`;








    try {
      const data = await fetchRapidApiData(url, rapidApiHeaders);
      const tournaments = data.DATA || [];








      for (const tour of tournaments) {
        // Check if the tournament name matches the desired league.
        // Some leagues (like Europa League) might not match exactly, so check for inclusion instead.
        if (tour.NAME.includes(league.leagueName) || (league.leagueName.includes(tour.NAME))) {
          const events = tour.EVENTS || [];
          for (const event of events) {
            // Only include finished games
            if (event.STAGE_TYPE !== 'FINISHED') {
              continue;
            }
           
            const game = {
              'Date': dateToFetch,
              'Sport': tour.SPORT_NAME || league.slug,
              'Game ID': event.EVENT_ID,
              'League': tour.NAME,
              'Matchup': `${event.HOME_NAME} vs ${event.AWAY_NAME}`,
              'Start Time': event.START_TIME ? new Date(event.START_TIME * 1000).toISOString() : '',
              'Home Team': event.HOME_NAME,
              'Away Team': event.AWAY_NAME,
              'Home Score': event.HOME_SCORE_CURRENT || '',
              'Away Score': event.AWAY_SCORE_CURRENT || '',
              'Status': event.STAGE || '',
              'Match Status': event.STAGE_TYPE || '',
              'Last Updated': new Date().toISOString()
            };
            allGames.push(game);
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching ${league.leagueName} for ${dateToFetch}: ${err.message}`);
    }
  }
}








console.log(`Fetched a total of ${allGames.length} games for the upcoming week.`);








const sheetRows = allGames.map(g => [
  g.Date, g.Sport, g['Game ID'], g.League, g.Matchup,
  g['Start Time'], g['Home Team'], g['Away Team'],
  g['Home Score'], g['Away Score'], g.Status,
  g['Match Status'], g['Last Updated']
]);








const sheetHeader = [
  'Date', 'Sport', 'Game ID', 'League', 'Matchup',
  'Start Time', 'Home Team', 'Away Team',
  'Home Score', 'Away Score', 'Status',
  'Match Status', 'Last Updated'
];








console.log(`Attempting to write to Google Sheets on the "${FUTURE_GAMES_SHEET_NAME}" tab...`);
await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: `${FUTURE_GAMES_SHEET_NAME}!A1`,
  valueInputOption: 'RAW',
  requestBody: {
    values: [sheetHeader, ...sheetRows]
  }
});
console.log(`Successfully wrote ${sheetRows.length} rows to Google Sheet.`);








if (res) {
  res.status(200).send(`Wrote ${sheetRows.length} rows to Google Sheet for the upcoming week.`);
}
} catch (err) {
console.error('--- fetchUpcomingGamesHandler FAILED ---', err);
if (res) res.status(500).send('Weekly scrape and write failed.');
}
}








// =================================================================
// EXPRESS APP
// =================================================================
const app = express();
app.use(express.json());








app.post('/fetchYesterdayScores', fetchYesterdayScoresHandler);
















const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
console.log(`Server listening on port ${PORT}`);
});













