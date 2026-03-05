import { google } from 'googleapis';
import admin from 'firebase-admin';
import { DateTime } from 'luxon';
import fs from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./service-account-key.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;
const API_REQUEST_DELAY_MS = 1500;

// Allowed leagues with sport-specific filtering
const ALLOWED_LEAGUE_KEYWORDS = {
  'Soccer': [
    "Euro Women", "Europe: Conference League - League phase", "Leagues Cup", "Europa League", "North & Central America: Leagues Cup - Play Offs",
    "Conference League", "Portugal: Super Cup", "UEFA Champions League", "Europe: Champions League - League phase",
    "World: Friendly International",
    "England: Premier League", "England: EFL Cup", "Italy: Coppa Italia", "USA: MLS - Play Offs",
    "Turkey: Super Lig", "Europe: Europa League - Qualification", "Europe: Europa League - League phase", "Europe: Champions League Women - Qualification - Second stage",
    "Europe: Conference League - Qualification", "Germany: Bundesliga", "Portugal: Liga Portugal", "Italy: Serie A",
    "France: Ligue 1", "South America: Copa Libertadores - Play Offs", "Brazil: Serie A Betano", "World: World Cup U20",
    "Spain: LaLiga", "England: Championship", "Mexico: Liga MX", "Mexico: Liga MX - Apertura", "Argentina: Torneo Betano - Clausura",
    "Europe: Champions League - League phase", "Brazil: Serie A Betano", "Portugal: Liga Portugal",
    "Germany: DFB Pokal", "Spain: Copa del Rey", "Scotland: Scottish Cup", "Scotland: Premiership",
    "South America: Copa Sudamericana - Play Offs", "South America: Copa Libertadores - Play Offs",
    "Belgium: Pro League", "Europe: Europa League - League phase", "Europe: Conference League - League phase",
    "USA: NWSL Women"
  ],
  'Basketball': ["USA: NBA", "USA: NBA - Pre-season", "USA: WNBA", "USA: NCAA"],
  'American Football': ["USA: NFL", "USA: NCAA"],
  'Baseball': ["USA: MLB"],
  'Hockey': ["USA: NHL", "USA: NHL - Pre-season"],
  'Motorsport': ["Formula 1"],
  'Tennis': ["ATP", "WTA", "ITF"],
  'Boxing': ["Boxing"],
  'Track and Field': ["Track and Field"]
};

// League to Firestore collection mapping (for schedule lookups)
const LEAGUE_TO_COLLECTION_MAP = {
  'USA: NFL': 'NFL',
  'USA: NBA': 'NBA',
  'USA: NBA - Pre-season': 'NBA',
  'USA: MLB': 'MLB',
  'USA: NHL': 'NHL',
  'USA: NHL - Pre-season': 'NHL',
  'USA: MLS': 'MLS',
  'USA: MLS - Play Offs': 'MLS',
  'Germany: Bundesliga': 'Bundesliga',
  'Italy: Serie A': 'SerieA',
  'France: Ligue 1': 'Ligue1',
  'Netherlands: Eredivisie': 'Eredivisie',
  'Portugal: Primeira Liga': 'PrimeiraLiga',
  'Canada: CFL': 'CFL',
  'Mexico: Liga MX': 'LigaMX',
  'Brazil: Serie A': 'SerieA',
  'England: Premier League': 'PremierLeague',
  'England: Championship': 'EFLChampionship',
  'Mexico: Liga MX - Apertura': 'LigaMX',
  'Spain: LaLiga': 'LaLiga',
  'England: EFL Cup': 'EFLCup',
  'Argentina: Torneo Betano - Clausura': 'ArgentinePrimeraDivision',
  'Europe: Champions League - League phase': 'UEFAChampionsLeague',
  'Brazil: Serie A Betano': 'Brasileirao',
  'Portugal: Liga Portugal': 'LigaPortugal',
  'Germany: DFB Pokal': 'DFBPokal',
  'Spain: Copa del Rey': 'CopaDelRey',
  'Scotland: Scottish Cup': 'ScottishCup',
  'Scotland: Premiership': 'ScottishPremiership',
  'South America: Copa Sudamericana - Play Offs': 'CopaSudamericana',
  'South America: Copa Libertadores - Play Offs': 'CopaLibertadores',
  'Belgium: Pro League': 'BelgianProLeague',
  'Europe: Europa League - League phase': 'UEFAEuropaLeague',
  'Europe: Conference League - League phase': 'UEFAConferenceLeague',
  'USA: NWSL Women': 'NWSL',
  'USA: WNBA': 'WNBA'
};

const TEAM_NAME_MAPPINGS = {
  'losangeleslakers': ['lalakers', 'lakers', 'losangeles', 'la'],
  'minnesotatimberwolves': ['timberwolves', 'minnesota', 'wolves'],
  'orlandomagic': ['magic', 'orlando'],
  'detroitpistons': ['pistons', 'detroit'],
  'sacramentokings': ['kings', 'sacramento'],
  'chicagobulls': ['bulls', 'chicago'],
  'clevelandcavaliers': ['cavaliers', 'cavs', 'cleveland'],
  'bostonceltics': ['celtics', 'boston'],
  'indianapacers': ['pacers', 'indiana'],
  'dallasmavericks': ['mavericks', 'dallas', 'mavs'],
  'houstonrockets': ['rockets', 'houston'],
  'torontoraptors': ['raptors', 'toronto'],
  'atlantahawks': ['hawks', 'atlanta'],
  'brooklynnets': ['nets', 'brooklyn'],
  'neworleanspelicans': ['pelicans', 'neworleans'],
  'denvernuggets': ['nuggets', 'denver'],
  'portlandtrailblazers': ['trailblazers', 'blazers', 'portland'],
  'utahjazz': ['jazz', 'utah'],
  'memphisgrizzlies': ['grizzlies', 'memphis'],
  'phoenixsuns': ['suns', 'phoenix'],
  'goldenstatewarriors': ['warriors', 'goldenstate'],
  'losangelesclippers': ['clippers', 'laclippers', 'la'],
  'miamiheat': ['heat', 'miami'],
  'milwaukeebucks': ['bucks', 'milwaukee'],
  'newyorkknicks': ['knicks', 'newyork'],
  'philadelphia76ers': ['76ers', 'sixers', 'philadelphia'],
  'washingtonwizards': ['wizards', 'washington'],
  'charlottehornets': ['hornets', 'charlotte'],
  'oklahomacitythunder': ['thunder', 'oklahomacity', 'okc'],
  'sanantoniospurs': ['spurs', 'sanantonio']
};

function getTeamNameVariations(name) {
  const normalized = normalizeTeamName(name);
  const variations = [normalized];
  if (TEAM_NAME_MAPPINGS[normalized]) variations.push(...TEAM_NAME_MAPPINGS[normalized]);
  for (const [scheduleName, apiVariations] of Object.entries(TEAM_NAME_MAPPINGS)) {
    if (apiVariations.includes(normalized)) {
      variations.push(scheduleName);
      variations.push(...apiVariations);
    }
  }
  return [...new Set(variations)];
}

function normalizeTeamName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[^\w\s]/g, '');
}

async function getScheduledGamesForDate(dateStr, db) {
  const scheduledGames = new Map();
  try {
    const collections = new Set(Object.values(LEAGUE_TO_COLLECTION_MAP));
    for (const collectionName of collections) {
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.where('date', '==', dateStr).get();
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          const leagueName = Object.keys(LEAGUE_TO_COLLECTION_MAP).find(
            key => LEAGUE_TO_COLLECTION_MAP[key] === collectionName
          );
          if (!leagueName) return;
          const homeVariations = getTeamNameVariations(data.home || '');
          const awayVariations = getTeamNameVariations(data.away || '');
          const sport = data.sport || '';
          const gameData = { league: leagueName, home: data.home, away: data.away, date: dateStr, collection: collectionName, sport };
          for (const hv of homeVariations) {
            for (const av of awayVariations) {
              if (sport) {
                scheduledGames.set(`${sport}|${leagueName}|${hv}|${av}`, gameData);
                scheduledGames.set(`${sport}|${leagueName}|${av}|${hv}`, gameData);
              } else {
                scheduledGames.set(`${leagueName}|${hv}|${av}`, gameData);
                scheduledGames.set(`${leagueName}|${av}|${hv}`, gameData);
              }
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('Error fetching scheduled games:', e);
  }
  return scheduledGames;
}

function getScheduledDateForGame(game, scheduledGames) {
  const gameLeague = game.League || '';
  const gameSport = game.Sport || '';
  const homeVars = getTeamNameVariations(game['Home Team'] || '');
  const awayVars = getTeamNameVariations(game['Away Team'] || '');
  for (const hv of homeVars) {
    for (const av of awayVars) {
      if (gameSport) {
        if (scheduledGames.has(`${gameSport}|${gameLeague}|${hv}|${av}`)) return scheduledGames.get(`${gameSport}|${gameLeague}|${hv}|${av}`).date;
        if (scheduledGames.has(`${gameSport}|${gameLeague}|${av}|${hv}`)) return scheduledGames.get(`${gameSport}|${gameLeague}|${av}|${hv}`).date;
      }
      if (scheduledGames.has(`${gameLeague}|${hv}|${av}`)) {
        const d = scheduledGames.get(`${gameLeague}|${hv}|${av}`);
        if (!d.sport || d.sport === gameSport) return d.date;
      }
      if (scheduledGames.has(`${gameLeague}|${av}|${hv}`)) {
        const d = scheduledGames.get(`${gameLeague}|${av}|${hv}`);
        if (!d.sport || d.sport === gameSport) return d.date;
      }
    }
  }
  return null;
}

const sportsToFetch = [
  { name: 'Soccer', slug: 'soccer', id: 1 },
  { name: 'Basketball', slug: 'basketball', id: 2 },
  { name: 'American Football', slug: 'americanfootball', id: 3 },
  { name: 'Baseball', slug: 'baseball', id: 4 },
  { name: 'Hockey', slug: 'hockey', id: 5 },
  { name: 'Motorsport', slug: 'motorsport', id: 6 },
  { name: 'Tennis', slug: 'tennis', id: 7 },
  { name: 'Boxing', slug: 'boxing', id: 8 },
  { name: 'Track and Field', slug: 'trackandfield', id: 9 }
];

let sheets;
async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  sheets = google.sheets({ version: 'v4', auth });
}

async function fetchRapidApiData(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

function initializeFirebase() { return db; }

async function writeGamesToFirestore(games) {
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames_TEST`);
  const batch = db.batch();
  const bySport = {};
  let count = 0;
  for (const game of games) {
    bySport[game.Sport] = (bySport[game.Sport] || 0) + 1;
    const docRef = gamesRef.doc(String(game['Game ID']));
    batch.set(docRef, { ...game, gameDate: DateTime.now().setZone('America/New_York').toISODate() });
    count++;
  }
  await batch.commit();
  console.log(`Wrote ${count} games to sportsGames_TEST`);
  console.log('By sport:', bySport);
}

async function clearFirestoreCollection() {
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames_TEST`);
  const snapshot = await gamesRef.get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

async function initialScrapeAndStartPollingHandler() {
  console.log('--- initialScrapeAndStartPollingHandler started. ---');
  await clearFirestoreCollection();
  await authenticateGoogleSheets();
  const allGames = [];
  for (const sport of sportsToFetch) {
    const url = `https://${RAPIDAPI_HOST}/api/v1/sports/${sport.slug}/events/live+upcoming`;
    const headers = { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST };
    console.log(`Fetching ${sport.name} games...`);
    try {
      const data = await fetchRapidApiData(url, headers);
      for (const tour of (data.DATA || [])) {
        for (const event of (tour.EVENTS || [])) {
          allGames.push({
            'Sport': sport.name,
            'Game ID': event.EVENT_ID,
            'League': tour.NAME,
            'Matchup': `${event.HOME_NAME} vs ${event.AWAY_NAME}`,
            'Start Time': admin.firestore.Timestamp.fromMillis(event.START_TIME * 1000),
            'Home Team': event.HOME_NAME,
            'Away Team': event.AWAY_NAME,
            'Home Score': event.HOME_SCORE_CURRENT || '',
            'Away Score': event.AWAY_SCORE_CURRENT || '',
            'Status': event.STAGE || '',
            'Match Status': event.STAGE_TYPE || '',
            'Last Updated': new Date().toISOString(),
            'Score': event.SCORE_CURRENT || ''
          });
        }
      }
      await new Promise(r => setTimeout(r, API_REQUEST_DELAY_MS));
    } catch (e) { console.error(e); }
  }

  // Simple stats and write
  console.log(`Fetched ${allGames.length} games total`);
  await writeGamesToFirestore(allGames);
}

async function main() {
  await initialScrapeAndStartPollingHandler();
}

main().catch(err => { console.error(err); process.exit(1); });


// Allowed leagues with sport-specific filtering
const ALLOWED_LEAGUE_KEYWORDS = {
 // Soccer-specific leagues
 'Soccer': [
   "Euro Women", "Europe: Conference League - League phase", "Leagues Cup", "Europa League", "North & Central America: Leagues Cup - Play Offs",
   // "World: Club Friendly", // Commented out - can be easily re-added later
   "Conference League", "Portugal: Super Cup", "UEFA Champions League", "Europe: Champions League - League phase",
   "World: Friendly International",
   "England: Premier League", "England: EFL Cup", "Italy: Coppa Italia", "USA: MLS - Play Offs",
   "Turkey: Super Lig", "Europe: Europa League - Qualification", "Europe: Europa League - League phase", "Europe: Champions League Women - Qualification - Second stage",
   "Europe: Conference League - Qualification", "Germany: Bundesliga", "Portugal: Liga Portugal", "Italy: Serie A",
   "France: Ligue 1", "South America: Copa Libertadores - Play Offs", "Brazil: Serie A Betano", "World: World Cup U20",
   "Spain: LaLiga", "England: Championship", "Mexico: Liga MX", "Mexico: Liga MX - Apertura", "Argentina: Torneo Betano - Clausura",
   "South America: Copa Sudamericana - Play Offs", "Belgium: Pro League", "Spain: Copa del Rey", "Scotland: Scottish Cup", "Scotland: Premiership",
   "USA: NWSL Women"
 ],
 // Basketball-specific leagues
 'Basketball': [
   "USA: NBA", "USA: NBA - Pre-season", "USA: WNBA", "USA: NCAA"
 ],
 // American Football-specific leagues
 'American Football': [
   "USA: NFL", "USA: NCAA"
 ],
 // Baseball-specific leagues
 'Baseball': [
   "USA: MLB"
 ],
 // Hockey-specific leagues
 'Hockey': [
   "USA: NHL", "USA: NHL - Pre-season"
 ],
 // Motorsport-specific leagues
 'Motorsport': [
   "Formula 1"
 ],
 // Tennis-specific leagues
 'Tennis': [
   "ATP", "WTA", "ITF"
 ],
 // Boxing-specific leagues
 'Boxing': [
   "Boxing"
 ],
 // Track and Field-specific leagues
 'Track and Field': [
   "Track and Field"
 ]
};

// League to Firestore collection mapping (for schedule lookups)
const LEAGUE_TO_COLLECTION_MAP = {
  'USA: NFL': 'NFL',
  'USA: NBA': 'NBA',
  'USA: NBA - Pre-season': 'NBA',
  'USA: MLB': 'MLB',
  'USA: NHL': 'NHL',
  'USA: NHL - Pre-season': 'NHL',
  'USA: MLS': 'MLS',
  'USA: MLS - Play Offs': 'MLS',
  'Germany: Bundesliga': 'Bundesliga',
  'Italy: Serie A': 'SerieA',
  'France: Ligue 1': 'Ligue1',
  'Netherlands: Eredivisie': 'Eredivisie',
  'Portugal: Primeira Liga': 'PrimeiraLiga',
  'Canada: CFL': 'CFL',
  'Mexico: Liga MX': 'LigaMX',
  'Brazil: Serie A': 'SerieA',
  'England: Premier League': 'PremierLeague',
  'England: Championship': 'EFLChampionship',
  'Mexico: Liga MX - Apertura': 'LigaMX',
  'Spain: LaLiga': 'LaLiga',
  'England: EFL Cup': 'EFLCup',
  'Argentina: Torneo Betano - Clausura': 'ArgentinePrimeraDivision',
  'Europe: Champions League - League phase': 'UEFAChampionsLeague',
  'Brazil: Serie A Betano': 'Brasileirao',
  'Portugal: Liga Portugal': 'LigaPortugal',
  'Germany: DFB Pokal': 'DFBPokal',
  'Spain: Copa del Rey': 'CopaDelRey',
  'Scotland: Scottish Cup': 'ScottishCup',
  'Scotland: Premiership': 'ScottishPremiership',
  'South America: Copa Sudamericana - Play Offs': 'CopaSudamericana',
  'South America: Copa Libertadores - Play Offs': 'CopaLibertadores',
  'Belgium: Pro League': 'BelgianProLeague',
  'Europe: Europa League - League phase': 'UEFAEuropaLeague',
  'Europe: Conference League - League phase': 'UEFAConferenceLeague',
  'USA: NWSL Women': 'NWSL',
  'USA: WNBA': 'WNBA'
};

// Team name mapping: Maps Google Sheets team names to FlashLive API variations
// Format: { 'normalized_schedule_name': ['api_variation1', 'api_variation2', ...] }
const TEAM_NAME_MAPPINGS = {
  // NBA
  'losangeleslakers': ['lalakers', 'lakers', 'losangeles', 'la'],
  'minnesotatimberwolves': ['timberwolves', 'minnesota', 'wolves'],
  'orlandomagic': ['magic', 'orlando'],
  'detroitpistons': ['pistons', 'detroit'],
  'sacramentokings': ['kings', 'sacramento'],
  'chicagobulls': ['bulls', 'chicago'],
  'clevelandcavaliers': ['cavaliers', 'cavs', 'cleveland'],
  'bostonceltics': ['celtics', 'boston'],
  'indianapacers': ['pacers', 'indiana'],
  'dallasmavericks': ['mavericks', 'dallas', 'mavs'],
  'houstonrockets': ['rockets', 'houston'],
  'torontoraptors': ['raptors', 'toronto'],
  'atlantahawks': ['hawks', 'atlanta'],
  'brooklynnets': ['nets', 'brooklyn'],
  'neworleanspelicans': ['pelicans', 'neworleans'],
  'denvernuggets': ['nuggets', 'denver'],
  'portlandtrailblazers': ['trailblazers', 'blazers', 'portland'],
  'utahjazz': ['jazz', 'utah'],
  'memphisgrizzlies': ['grizzlies', 'memphis'],
  'phoenixsuns': ['suns', 'phoenix'],
  'goldenstatewarriors': ['warriors', 'goldenstate'],
  'losangelesclippers': ['clippers', 'laclippers', 'la'],
  'miamiheat': ['heat', 'miami'],
  'milwaukeebucks': ['bucks', 'milwaukee'],
  'newyorkknicks': ['knicks', 'newyork'],
  'philadelphia76ers': ['76ers', 'sixers', 'philadelphia'],
  'washingtonwizards': ['wizards', 'washington'],
  'charlottehornets': ['hornets', 'charlotte'],
  'oklahomacitythunder': ['thunder', 'oklahomacity', 'okc'],
  'sanantoniospurs': ['spurs', 'sanantonio'],
  
  // Add more mappings as needed for other sports/leagues
};

// Get all possible normalized variations of a team name
function getTeamNameVariations(name) {
  const normalized = normalizeTeamName(name);
  const variations = [normalized];
  
  // Check if this team has mappings
  if (TEAM_NAME_MAPPINGS[normalized]) {
    variations.push(...TEAM_NAME_MAPPINGS[normalized]);
  }
  
  // Also check reverse mapping (in case API name is in mapping)
  for (const [scheduleName, apiVariations] of Object.entries(TEAM_NAME_MAPPINGS)) {
    if (apiVariations.includes(normalized)) {
      variations.push(scheduleName);
      variations.push(...apiVariations);
    }
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

// Normalize team name for matching (same logic as channel-lookup)
function normalizeTeamName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

// Get scheduled games from Firestore for a specific date
async function getScheduledGamesForDate(dateStr, db) {
  const scheduledGames = new Map(); // Key: "sport|league|normalizedHome|normalizedAway" or "league|normalizedHome|normalizedAway", Value: { home, away, date, league, sport }
  
  try {
    // Get all unique leagues from LEAGUE_TO_COLLECTION_MAP
    const collections = new Set(Object.values(LEAGUE_TO_COLLECTION_MAP));
    
    console.log(`📅 Fetching scheduled games for ${dateStr} from ${collections.size} collections...`);
    
    for (const collectionName of collections) {
      try {
        const collectionRef = db.collection(collectionName);
        const snapshot = await collectionRef
          .where('date', '==', dateStr)
          .get();
        
        if (!snapshot.empty) {
          snapshot.forEach(doc => {
            const data = doc.data();
            const home = data.home || '';
            const away = data.away || '';
            const sport = data.sport || ''; // Optional sport field
            
            if (home && away) {
              // Find the league name for this collection
              const leagueName = Object.keys(LEAGUE_TO_COLLECTION_MAP).find(
                key => LEAGUE_TO_COLLECTION_MAP[key] === collectionName
              );
              
              if (leagueName) {
                // Get all variations for both teams
                const homeVariations = getTeamNameVariations(home);
                const awayVariations = getTeamNameVariations(away);
                
                // Store the scheduled game with all possible team name combinations
                const gameData = {
                  league: leagueName,
                  home: home,
                  away: away,
                  date: dateStr,
                  collection: collectionName,
                  sport: sport // Include sport in gameData
                };
                
                // Create keys for all combinations of team name variations
                // If sport exists, include it in the key; otherwise use league-only key (backwards compatible)
                for (const homeVar of homeVariations) {
                  for (const awayVar of awayVariations) {
                    if (sport) {
                      // Include sport in key for proper disambiguation (e.g., NCAA Football vs NCAA Hockey)
                      const key1 = `${sport}|${leagueName}|${homeVar}|${awayVar}`;
                      const key2 = `${sport}|${leagueName}|${awayVar}|${homeVar}`; // Also add reversed for home/away matching
                      scheduledGames.set(key1, gameData);
                      scheduledGames.set(key2, gameData);
                    } else {
                      // Backwards compatible: no sport in key
                      const key1 = `${leagueName}|${homeVar}|${awayVar}`;
                      const key2 = `${leagueName}|${awayVar}|${homeVar}`; // Also add reversed for home/away matching
                      scheduledGames.set(key1, gameData);
                      scheduledGames.set(key2, gameData);
                    }
                  }
                }
              }
            }
          });
          console.log(`  ✅ Found ${snapshot.size} scheduled games in ${collectionName}`);
        }
      } catch (err) {
        console.error(`  ❌ Error querying ${collectionName}:`, err.message);
      }
    }
    
    console.log(`📊 Total scheduled games found: ${scheduledGames.size}`);
    return scheduledGames;
  } catch (error) {
    console.error('Error fetching scheduled games:', error);
    return scheduledGames;
  }
}

// Check if a game matches the schedule
function gameMatchesSchedule(game, scheduledGames) {
  const gameLeague = game.League || '';
  const gameHome = game['Home Team'] || '';
  const gameAway = game['Away Team'] || '';
  const gameSport = game.Sport || ''; // Get sport from API game
  
  if (!gameLeague || !gameHome || !gameAway) {
    return false;
  }
  
  // Get all variations for both teams from the API
  const homeVariations = getTeamNameVariations(gameHome);
  const awayVariations = getTeamNameVariations(gameAway);
  
  // Check all combinations of team name variations
  for (const homeVar of homeVariations) {
    for (const awayVar of awayVariations) {
      // First try with sport if available (for leagues like NCAA that exist in multiple sports)
      if (gameSport) {
        const key1 = `${gameSport}|${gameLeague}|${homeVar}|${awayVar}`;
        const key2 = `${gameSport}|${gameLeague}|${awayVar}|${homeVar}`; // Also check reversed
        if (scheduledGames.has(key1) || scheduledGames.has(key2)) {
          return true;
        }
      }
      
      // Also check without sport (for backwards compatibility and leagues without sport field)
      const key1 = `${gameLeague}|${homeVar}|${awayVar}`;
      const key2 = `${gameLeague}|${awayVar}|${homeVar}`; // Also check reversed
      if (scheduledGames.has(key1) || scheduledGames.has(key2)) {
        // Additional check: if the scheduled game has a sport, make sure it matches
        const scheduledData = scheduledGames.get(key1) || scheduledGames.get(key2);
        if (!scheduledData || !scheduledData.sport || scheduledData.sport === gameSport) {
          return true;
        }
      }
    }
  }
  
  return false;
}

const sportsToFetch = [
  { name: 'Soccer', slug: 'soccer', id: 1 },
  { name: 'Basketball', slug: 'basketball', id: 2 },
  { name: 'American Football', slug: 'americanfootball', id: 3 },
  { name: 'Baseball', slug: 'baseball', id: 4 },
  { name: 'Hockey', slug: 'hockey', id: 5 },
  { name: 'Motorsport', slug: 'motorsport', id: 6 },
  { name: 'Tennis', slug: 'tennis', id: 7 },
  { name: 'Boxing', slug: 'boxing', id: 8 },
  { name: 'Track and Field', slug: 'trackandfield', id: 9 }
];

let sheets;

async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  sheets = google.sheets({ version: 'v4', auth });
  console.log('Google Sheets API authenticated.');
}

async function fetchRapidApiData(url, headers) {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching from RapidAPI:', error);
    throw error;
  }
}

async function writeGamesToFirestore(games) {
const db = initializeFirebase();
const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames${TEST_COLLECTION_SUFFIX}`);

try {
  const batch = db.batch();
  let count = 0;
  const gamesBySport = {};

  for (const game of games) {
    const sport = game.Sport || 'Unknown';
    if (!gamesBySport[sport]) {
      gamesBySport[sport] = 0;
    }
    gamesBySport[sport]++;
    
    const gameData = {
      ...game,
      gameDate: DateTime.now().setZone('America/Denver').toISODate()
    };
    
    const docRef = gamesRef.doc(game['Game ID']);
    batch.set(docRef, gameData);
    count++;

    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Committed batch of ${count} games to Firestore.`);
      const newBatch = db.batch();
      batch._writes = newBatch._writes;
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`Successfully wrote ${count} games to Firestore.`);
  console.log(`Games by sport:`, gamesBySport);
} catch (error) {
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
const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames${TEST_COLLECTION_SUFFIX}`);
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




const initialScrapeAndStartPollingHandler = async (req, res) => {
try {
  console.log('--- initialScrapeAndStartPollingHandler started. ---');
  
  // --- Step 0: Move yesterday's games to yesterdayScores ---
  console.log('Moving yesterday\'s games to yesterdayScores...');
  const db = initializeFirebase();
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames${TEST_COLLECTION_SUFFIX}`);
  const yesterdayScoresRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/yesterdayScores${TEST_COLLECTION_SUFFIX}`);
  const snapshot = await gamesRef.get();
  let movedCount = 0;
  
  for (const doc of snapshot.docs) {
    try {
      const gameData = doc.data();
      await yesterdayScoresRef.add(gameData);
      await doc.ref.delete();
      movedCount++;
    } catch (err) {
      console.error(`Error moving game ${doc.id} to yesterdayScores:`, err);
    }
  }
  console.log(`✅ Moved ${movedCount} games to yesterdayScores.`);
  
   // --- Step 1: Clear the sportsGames Collection ---
  console.log('Clearing sportsGames collection for the new day...');
  await clearFirestoreCollection();
  console.log('sportsGames collection cleared.');




  // --- Step 2: Populate with New Day's Games ---
  console.log('Fetching new games for the upcoming day...');
  await authenticateGoogleSheets();




  const rapidApiHeaders = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
  };




 const nowInMountain = DateTime.now().setZone('America/Denver');
 const todayStr = nowInMountain.toISODate();
 const tomorrowStr = nowInMountain.plus({ days: 1 }).toISODate();
 
 // For API calls, use UTC dates to match FlashLive API expectations
 const nowUTC = DateTime.now().setZone('utc');
 const todayUTC = nowUTC.toISODate();
 const tomorrowUTC = nowUTC.plus({ days: 1 }).toISODate();
  const allGames = [];
  
  // Specific game IDs to always fetch (workaround for API timezone issues)
  const FORCE_FETCH_GAME_IDS = [
    // Add game IDs here that API might miss due to timezone issues
    // Example: 'tKKG0rZX' // Inter Miami vs Nashville
  ];




  for (const sport of sportsToFetch) {
    // Query both today and tomorrow to catch all games that start today in EST
    const datesToQuery = [todayUTC, tomorrowUTC];
    
    for (const dateStr of datesToQuery) {
      const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&date=${dateStr}&locale=en_INT&sport_id=${sport.id}&timezone=-4&indent_days=0`;
      
      try {
        const data = await fetchRapidApiData(url, rapidApiHeaders);
        const tournaments = data.DATA || [];

        for (const tour of tournaments) {
          const events = tour.EVENTS || [];
          for (const event of events) {
            const game = {
              'Sport': sport.name,
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
              'Score': event.SCORE_CURRENT || ''
            };
            allGames.push(game);
          }
        }
        
        console.log(`Fetched ${sport.name} games for ${dateStr}: ${data.DATA?.length || 0} tournaments`);
        
        // Add delay between API calls
        if (sport.slug !== sportsToFetch[sportsToFetch.length - 1].slug) {
          await new Promise(resolve => setTimeout(resolve, API_REQUEST_DELAY_MS));
        }
      } catch (error) {
        console.error(`Error fetching ${sport.name} games for ${dateStr}:`, error);
      }
    }
  }

  // Deduplicate Formula 1 races - keep only one entry per race
  const f1RaceMap = new Map();
  const nonF1Games = [];
  
  allGames.forEach(game => {
    if (game.Sport === 'Motorsport' && game.League && game.League.includes('Formula 1')) {
      // For F1, use Grand Prix name as unique key (not session type)
      const leagueParts = game.League.split(':');
      const eventName = leagueParts[1] ? leagueParts[1].trim() : '';
      const sessionParts = eventName.split(' - ');
      const grandPrixName = (sessionParts[0] || '').replace('Grand Prix', 'GP');
      const raceKey = grandPrixName; // Use just the Grand Prix name as key
      if (!f1RaceMap.has(raceKey)) {
        // Extract event name and session type from league string
        // "Formula 1: Mexican Grand Prix - Race" -> grandPrixName: "Mexican Grand Prix", sessionType: "Race"
        const leagueParts = game.League.split(':');
        const eventName = leagueParts[1] ? leagueParts[1].trim() : '';
        const sessionParts = eventName.split(' - ');
        const grandPrixName = (sessionParts[0] || '').replace('Grand Prix', 'GP');
        const sessionType = sessionParts[1] || '';
        
        // Create a synthetic Game ID based on league + start time (to avoid driver-specific IDs)
        const syntheticGameId = `F1_${game.StartTime}_${grandPrixName.replace(/\s+/g, '_')}`;
        
        game['Game ID'] = syntheticGameId;
        game.Matchup = `${grandPrixName}\n${sessionType}`;
        game['Home Team'] = sessionType;
        game['Away Team'] = grandPrixName;
        // Put live lap data in start time column (where LIVE appears)
        if (game.Score && game.Score.includes('Lap')) {
          game['Start Time'] = game.Score; // Move lap data to start time column
          game.Score = ''; // Clear the scores column
        }
        f1RaceMap.set(raceKey, game);
      }
    } else {
      nonF1Games.push(game);
    }
  });
  
  // Combine deduplicated F1 races with other games
  const deduplicatedGames = [...Array.from(f1RaceMap.values()), ...nonF1Games];
  console.log(`Deduplicated ${allGames.length} games to ${deduplicatedGames.length} (removed ${allGames.length - deduplicatedGames.length} duplicate F1 driver entries)`);
  
  // Replace allGames with deduplicated version
  allGames.length = 0;
  allGames.push(...deduplicatedGames);

 console.log(`Fetched ${allGames.length} games from RapidAPI.`);




 const sheetRows = allGames.map(g => [
   g.Sport, g['Game ID'], g.League, g.Matchup,
   g['Start Time'] ? g['Start Time'].toDate().toISOString() : '',
   g['Home Team'], g['Away Team'],
   g['Home Score'], g['Away Score'], g.Status,
   g['Match Status'], g['Last Updated']
 ]);




 const sheetHeader = [
   'Sport', 'Game ID', 'League', 'Matchup',
   'Start Time', 'Home Team', 'Away Team',
   'Home Score', 'Away Score', 'Status',
   'Match Status', 'Last Updated'
 ];




 // Try to write to Google Sheets, but don't fail if it doesn't have permissions
 try {
   console.log('Attempting to write to Google Sheets...');
   await sheets.spreadsheets.values.update({
     spreadsheetId: SPREADSHEET_ID,
     range: `${SHEET_NAME}!A1`,
     valueInputOption: 'RAW',
     requestBody: {
       values: [sheetHeader, ...sheetRows]
     }
   });
   console.log(`Successfully wrote ${sheetRows.length} rows to Google Sheet.`);
 } catch (sheetsError) {
   console.warn('⚠️ Google Sheets write failed (continuing anyway):', sheetsError.message);
   console.log(`Would have written ${sheetRows.length} rows to Google Sheet.`);
 }

  // Get scheduled games for today from Firestore
  const scheduledGames = await getScheduledGamesForDate(todayStr, initializeFirebase());
  console.log(`📋 Using schedule-based filtering: Found ${scheduledGames.size} scheduled games for ${todayStr}`);

  // If no scheduled games found, log warning but continue with basic filtering
  if (scheduledGames.size === 0) {
    console.warn('⚠️ No scheduled games found in Firestore collections. Will use basic filtering (allowed leagues only).');
  }

  // Count games by sport before filtering
  const gamesBySportBefore = {};
  const basketballLeagues = {};
  allGames.forEach(g => {
    const sport = g.Sport || 'Unknown';
    gamesBySportBefore[sport] = (gamesBySportBefore[sport] || 0) + 1;
    
    if (sport === 'Basketball') {
      const league = g.League || 'Unknown';
      basketballLeagues[league] = (basketballLeagues[league] || 0) + 1;
    }
  });
  console.log(`📊 Games by sport BEFORE filtering:`, gamesBySportBefore);
  if (Object.keys(basketballLeagues).length > 0) {
    console.log(`🏀 Basketball leagues:`, basketballLeagues);
  }

 const gamesForFirestore = allGames.filter(g => {
   // Check league against ALL sports' allowed leagues, not just the sport field
   // (API sometimes mis-categorizes sports, but league names are usually correct)
   let isAllowedLeague = false;
   const gameLeague = g.League || '';
   
   // Special handling for Formula 1 - check if league name includes "Formula 1"
   const isF1 = g.Sport === 'Motorsport' && gameLeague && gameLeague.includes('Formula 1');
   
   if (isF1) {
     isAllowedLeague = true;
   } else {
     // Check league against all sports' allowed leagues
     for (const [sport, leagues] of Object.entries(ALLOWED_LEAGUE_KEYWORDS)) {
       if (leagues.includes(gameLeague)) {
         isAllowedLeague = true;
         break;
       }
     }
   }
   
   // For F1, only Home Team is required (Away Team is empty). For others, both are required.
   const hasValidTeams = isF1 ? g['Home Team'] : (g['Home Team'] && g['Away Team']);
   const hasStartTime = g['Start Time'];
   const hasGameId = g['Game ID'];
  
  // Filter out games with "U" followed by numbers (e.g., U20, U23, U19) for World: Friendly International
  const isUTeamGame = gameLeague === 'World: Friendly International' &&
    (/\bU\d+\b/.test(g['Home Team']) || /\bU\d+\b/.test(g['Away Team']));
  
  // ---------- SCHEDULE-BASED FILTER (Replaces time filter) ----------
  // If we have scheduled games for THIS specific league, only include games that match the schedule
  // If no scheduled games found for this league, fall back to allowing all games that pass other filters
  let matchesSchedule = true;
  
  if (scheduledGames.size > 0 && !isF1) {
    // Check if there are scheduled games specifically for this game's league
    // Check both with and without sport prefix (for backwards compatibility)
    const gameSport = g.Sport || '';
    const hasScheduledGamesForLeague = Array.from(scheduledGames.keys()).some(key => {
      if (gameSport) {
        return key.startsWith(`${gameSport}|${gameLeague}|`) || key.startsWith(`${gameLeague}|`);
      } else {
        return key.startsWith(`${gameLeague}|`);
      }
    });
    
    if (hasScheduledGamesForLeague) {
      // Only require schedule matching if this league has scheduled games
      matchesSchedule = gameMatchesSchedule(g, scheduledGames);
      
      // Debug log for NBA games
      if (gameLeague && gameLeague.includes('NBA')) {
        const key1 = gameSport ? `${gameSport}|${gameLeague}|${normalizeTeamName(g['Home Team'])}|${normalizeTeamName(g['Away Team'])}` : `${gameLeague}|${normalizeTeamName(g['Home Team'])}|${normalizeTeamName(g['Away Team'])}`;
        const key2 = gameSport ? `${gameSport}|${gameLeague}|${normalizeTeamName(g['Away Team'])}|${normalizeTeamName(g['Home Team'])}` : `${gameLeague}|${normalizeTeamName(g['Away Team'])}|${normalizeTeamName(g['Home Team'])}`;
        console.log({
          game: `${g['Home Team']} vs ${g['Away Team']}`,
          league: gameLeague,
          sport: gameSport,
          key1: key1,
          key2: key2,
          matchesSchedule: matchesSchedule,
          scheduledGamesHasKey1: scheduledGames.has(key1),
          scheduledGamesHasKey2: scheduledGames.has(key2),
          scheduledGamesSample: Array.from(scheduledGames.keys()).filter(k => k.includes(gameLeague)).slice(0, 5)
        });
      }
    }
    // If no scheduled games for this league, matchesSchedule stays true (allow all games for this league)
  }
  
  const shouldInclude = isAllowedLeague && hasValidTeams && hasStartTime && hasGameId && !isUTeamGame && matchesSchedule;
  
  // Log filtered out non-soccer games
  if (!shouldInclude && (g.Sport === 'Basketball' || g.Sport === 'Baseball' || g.Sport === 'Hockey' || g.Sport === 'American Football')) {
    console.log(`❌ Filtered out ${g.Sport}: ${g['Home Team']} vs ${g['Away Team']} (${gameLeague}) - isAllowedLeague: ${isAllowedLeague}, hasValidTeams: ${hasValidTeams}, hasStartTime: ${!!hasStartTime}, hasGameId: ${!!hasGameId}, isUTeamGame: ${isUTeamGame}, matchesSchedule: ${matchesSchedule}`);
  }
  
  return shouldInclude;
 });
 
  // Count games by sport after filtering
  const gamesBySportAfter = {};
  gamesForFirestore.forEach(g => {
    const sport = g.Sport || 'Unknown';
    gamesBySportAfter[sport] = (gamesBySportAfter[sport] || 0) + 1;
  });
  console.log(`📊 Games by sport AFTER filtering:`, gamesBySportAfter);

  console.log(`Filtered ${gamesForFirestore.length} games for Firestore based on sport-specific ALLOWED_LEAGUE_KEYWORDS.`);
  await writeGamesToFirestore(gamesForFirestore);
  console.log('Successfully completed Firestore write for initial scrape.');




  if (res) {
    res.status(200).send(`Wrote ${sheetRows.length} rows to Google Sheet and ${gamesForFirestore.length} games to Firestore.`);
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
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames${TEST_COLLECTION_SUFFIX}`);
 const nowInMountain = DateTime.now().setZone('America/Denver');
 const todayStr = nowInMountain.toISODate();
  console.log(`[Backend] Current Mountain Time Date (todayStr): ${todayStr}`);
  if (USE_TEST_COLLECTIONS) {
    console.log('⚠️ TEST MODE: Using test collections (sportsGames_TEST, yesterdayScores_TEST)');
  }




  const snapshot = await gamesRef.get();
  const deleteBatch = db.batch();
  let deleteCount = 0;




 snapshot.forEach(doc => {
   const data = doc.data();
   const matchStatus = (data['Match Status'] || '').toUpperCase();
   const isLive = matchStatus.includes('IN PROGRESS') || matchStatus.includes('LIVE') || matchStatus === 'LIVE';
  
   // Only delete games that are from a different date AND not live
   if (data.gameDate !== todayStr && !isLive) {
     deleteBatch.delete(doc.ref);
     deleteCount++;
   }
 });




  if (deleteCount > 0) {
    await deleteBatch.commit();
    console.log(`🧹 Deleted ${deleteCount} old games from Firestore.`);
  } else {
    console.log('No old games to delete.');
  }




  const rapidApiHeaders = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
  };




  const allGames = [];
  
  for (const sport of sportsToFetch) {
    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&date=${todayStr}&locale=en_INT&sport_id=${sport.id}&timezone=-4&indent_days=0`;
    
    try {
      const data = await fetchRapidApiData(url, rapidApiHeaders);
      const tournaments = data.DATA || [];

      for (const tour of tournaments) {
        const events = tour.EVENTS || [];
        for (const event of events) {
          const game = {
            'Sport': sport.name,
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
            'Score': event.SCORE_CURRENT || ''
          };
          allGames.push(game);
        }
      }
      
      console.log(`Fetched ${sport.name} games: ${data.DATA?.length || 0} tournaments`);
      
      // Add delay between API calls
      if (sport.slug !== sportsToFetch[sportsToFetch.length - 1].slug) {
        await new Promise(resolve => setTimeout(resolve, API_REQUEST_DELAY_MS));
      }
    } catch (error) {
      console.error(`Error fetching ${sport.name} games:`, error);
    }
  }

  // Deduplicate Formula 1 races - keep only one entry per race
  const f1RaceMapPoll = new Map();
  const nonF1GamesPoll = [];
  
  allGames.forEach(game => {
    if (game.Sport === 'Motorsport' && game.League && game.League.includes('Formula 1')) {
      // For F1, use Grand Prix name as unique key (not session type)
      const leagueParts = game.League.split(':');
      const eventName = leagueParts[1] ? leagueParts[1].trim() : '';
      const sessionParts = eventName.split(' - ');
      const grandPrixName = (sessionParts[0] || '').replace('Grand Prix', 'GP');
      const raceKey = grandPrixName; // Use just the Grand Prix name as key
      if (!f1RaceMapPoll.has(raceKey)) {
        // Extract event name and session type from league string
        // "Formula 1: Mexican Grand Prix - Race" -> grandPrixName: "Mexican Grand Prix", sessionType: "Race"
        const leagueParts = game.League.split(':');
        const eventName = leagueParts[1] ? leagueParts[1].trim() : '';
        const sessionParts = eventName.split(' - ');
        const grandPrixName = (sessionParts[0] || '').replace('Grand Prix', 'GP');
        const sessionType = sessionParts[1] || '';
        
        // Create a synthetic Game ID based on league + start time (to avoid driver-specific IDs)
        const syntheticGameId = `F1_${game.StartTime}_${grandPrixName.replace(/\s+/g, '_')}`;
        
        game['Game ID'] = syntheticGameId;
        game.Matchup = `${grandPrixName}\n${sessionType}`;
        game['Home Team'] = sessionType;
        game['Away Team'] = grandPrixName;
        // Put live lap data in start time column (where LIVE appears)
        if (game.Score && game.Score.includes('Lap')) {
          game['Start Time'] = game.Score; // Move lap data to start time column
          game.Score = ''; // Clear the scores column
        }
        f1RaceMapPoll.set(raceKey, game);
      }
    } else {
      nonF1GamesPoll.push(game);
    }
  });
  
  // Combine deduplicated F1 races with other games
  const deduplicatedGamesPoll = [...Array.from(f1RaceMapPoll.values()), ...nonF1GamesPoll];
  console.log(`Deduplicated ${allGames.length} games to ${deduplicatedGamesPoll.length} (removed ${allGames.length - deduplicatedGamesPoll.length} duplicate F1 driver entries)`);
  
  // Replace allGames with deduplicated version
  allGames.length = 0;
  allGames.push(...deduplicatedGamesPoll);




  // Debug: Log all unique leagues being fetched
  const uniqueLeagues = [...new Set(allGames.map(g => g.League))];
  console.log('All leagues being fetched:', uniqueLeagues);

  // Get scheduled games for today from Firestore
  const scheduledGames = await getScheduledGamesForDate(todayStr, db);
  console.log(`📋 Using schedule-based filtering: Found ${scheduledGames.size} scheduled games for ${todayStr}`);

  // If no scheduled games found, log warning but continue with basic filtering
  if (scheduledGames.size === 0) {
    console.warn('⚠️ No scheduled games found in Firestore collections. Will use basic filtering (allowed leagues only).');
  }

  // Count games by sport before filtering
  const gamesBySportBefore = {};
  const basketballLeagues = {};
  allGames.forEach(g => {
    const sport = g.Sport || 'Unknown';
    gamesBySportBefore[sport] = (gamesBySportBefore[sport] || 0) + 1;
    
    if (sport === 'Basketball') {
      const league = g.League || 'Unknown';
      basketballLeagues[league] = (basketballLeagues[league] || 0) + 1;
    }
  });
  console.log(`📊 Games by sport BEFORE filtering:`, gamesBySportBefore);
  if (Object.keys(basketballLeagues).length > 0) {
    console.log(`🏀 Basketball leagues:`, basketballLeagues);
  }

 const gamesForFirestore = allGames.filter(g => {
   // Check league against ALL sports' allowed leagues, not just the sport field
   // (API sometimes mis-categorizes sports, but league names are usually correct)
   let isAllowedLeague = false;
   const gameLeague = g.League || '';
   
   // Special handling for Formula 1 - check if league name includes "Formula 1"
   const isF1 = g.Sport === 'Motorsport' && gameLeague && gameLeague.includes('Formula 1');
   
   if (isF1) {
     isAllowedLeague = true;
   } else {
     // Check league against all sports' allowed leagues
     for (const [sport, leagues] of Object.entries(ALLOWED_LEAGUE_KEYWORDS)) {
       if (leagues.includes(gameLeague)) {
         isAllowedLeague = true;
         break;
       }
     }
   }
   
   // For F1, only Home Team is required (Away Team is empty). For others, both are required.
   const hasValidTeams = isF1 ? g['Home Team'] : (g['Home Team'] && g['Away Team']);
   const hasStartTime = g['Start Time'];
   const hasGameId = g['Game ID'];
  
  // Filter out games with "U" followed by numbers (e.g., U20, U23, U19) for World: Friendly International
  const isUTeamGame = gameLeague === 'World: Friendly International' &&
    (/\bU\d+\b/.test(g['Home Team']) || /\bU\d+\b/.test(g['Away Team']));
  
  // ---------- SCHEDULE-BASED FILTER (Replaces time filter) ----------
  // If we have scheduled games for THIS specific league, only include games that match the schedule
  // If no scheduled games found for this league, fall back to allowing all games that pass other filters
  let matchesSchedule = true;
  
  if (scheduledGames.size > 0 && !isF1) {
    // Check if there are scheduled games specifically for this game's league
    // Check both with and without sport prefix (for backwards compatibility)
    const gameSport = g.Sport || '';
    const hasScheduledGamesForLeague = Array.from(scheduledGames.keys()).some(key => {
      if (gameSport) {
        return key.startsWith(`${gameSport}|${gameLeague}|`) || key.startsWith(`${gameLeague}|`);
      } else {
        return key.startsWith(`${gameLeague}|`);
      }
    });
    
    if (hasScheduledGamesForLeague) {
      // Only require schedule matching if this league has scheduled games
      matchesSchedule = gameMatchesSchedule(g, scheduledGames);
      
      // Debug log for NBA games
      if (gameLeague && gameLeague.includes('NBA')) {
        const matches = gameMatchesSchedule(g, scheduledGames);
        console.log({
          game: `${g['Home Team']} vs ${g['Away Team']}`,
          league: gameLeague,
          sport: gameSport,
          matchesSchedule: matches
        });
      }
    }
    // If no scheduled games for this league, matchesSchedule stays true (allow all games for this league)
  }
  
  return isAllowedLeague && hasValidTeams && hasStartTime && hasGameId && !isUTeamGame && matchesSchedule;
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
  
  const db = initializeFirebase();
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames${TEST_COLLECTION_SUFFIX}`);
  const snapshot = await gamesRef.get();
  
  if (snapshot.empty) {
    console.log('No games to refresh.');
    if (res) res.status(200).send('No games to refresh.');
    return;
  }
  
  const rapidApiHeaders = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
  };
  
  const allGames = [];
  
  for (const sport of sportsToFetch) {
    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&date=${DateTime.now().setZone('America/Denver').toISODate()}&locale=en_INT&sport_id=${sport.id}&timezone=-4&indent_days=0`;
    
    try {
      const data = await fetchRapidApiData(url, rapidApiHeaders);
      const tournaments = data.DATA || [];

      for (const tour of tournaments) {
        const events = tour.EVENTS || [];
        for (const event of events) {
          const game = {
            'Sport': sport.name,
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
            'Score': event.SCORE_CURRENT || ''
          };
          allGames.push(game);
        }
      }
      
      console.log(`Fetched ${sport.name} games: ${data.DATA?.length || 0} tournaments`);
      
      // Add delay between API calls
      if (sport.slug !== sportsToFetch[sportsToFetch.length - 1].slug) {
        await new Promise(resolve => setTimeout(resolve, API_REQUEST_DELAY_MS));
      }
    } catch (error) {
      console.error(`Error fetching ${sport.name} games:`, error);
    }
  }

  // Deduplicate Formula 1 races - keep only one entry per race
  const f1RaceMapRefresh = new Map();
  const nonF1GamesRefresh = [];
  
  allGames.forEach(game => {
    if (game.Sport === 'Motorsport' && game.League && game.League.includes('Formula 1')) {
      // For F1, use Grand Prix name as unique key (not session type)
      const leagueParts = game.League.split(':');
      const eventName = leagueParts[1] ? leagueParts[1].trim() : '';
      const sessionParts = eventName.split(' - ');
      const grandPrixName = (sessionParts[0] || '').replace('Grand Prix', 'GP');
      const raceKey = grandPrixName; // Use just the Grand Prix name as key
      if (!f1RaceMapRefresh.has(raceKey)) {
        // Extract event name and session type from league string
        // "Formula 1: Mexican Grand Prix - Race" -> grandPrixName: "Mexican Grand Prix", sessionType: "Race"
        const leagueParts = game.League.split(':');
        const eventName = leagueParts[1] ? leagueParts[1].trim() : '';
        const sessionParts = eventName.split(' - ');
        const grandPrixName = (sessionParts[0] || '').replace('Grand Prix', 'GP');
        const sessionType = sessionParts[1] || '';
        
        // Create a synthetic Game ID based on league + start time (to avoid driver-specific IDs)
        const syntheticGameId = `F1_${game.StartTime}_${grandPrixName.replace(/\s+/g, '_')}`;
        
        game['Game ID'] = syntheticGameId;
        game.Matchup = `${grandPrixName}\n${sessionType}`;
        game['Home Team'] = sessionType;
        game['Away Team'] = grandPrixName;
        // Put live lap data in start time column (where LIVE appears)
        if (game.Score && game.Score.includes('Lap')) {
          game['Start Time'] = game.Score; // Move lap data to start time column
          game.Score = ''; // Clear the scores column
        }
        f1RaceMapRefresh.set(raceKey, game);
      }
    } else {
      nonF1GamesRefresh.push(game);
    }
  });
  
  // Combine deduplicated F1 races with other games
  const deduplicatedGamesRefresh = [...Array.from(f1RaceMapRefresh.values()), ...nonF1GamesRefresh];
  console.log(`Deduplicated ${allGames.length} games to ${deduplicatedGamesRefresh.length} (removed ${allGames.length - deduplicatedGamesRefresh.length} duplicate F1 driver entries)`);
  
  // Replace allGames with deduplicated version
  allGames.length = 0;
  allGames.push(...deduplicatedGamesRefresh);

  const gamesForFirestore = allGames.filter(g => {
    const allowedLeaguesForSport = ALLOWED_LEAGUE_KEYWORDS[g.Sport] || [];
    
    // Special handling for Formula 1 - check if league name includes "Formula 1"
    const isF1 = g.Sport === 'Motorsport' && g.League && g.League.includes('Formula 1');
    const isAllowedLeague = isF1 || allowedLeaguesForSport.includes(g.League);
    
    // For F1, only Home Team is required (Away Team is empty). For others, both are required.
    const hasValidTeams = isF1 ? g['Home Team'] : (g['Home Team'] && g['Away Team']);
    const hasStartTime = g['Start Time'];
    const hasGameId = g['Game ID'];
   
   // Filter out games with "U" followed by numbers (e.g., U20, U23, U19) for World: Friendly International
   const isUTeamGame = g.League === 'World: Friendly International' &&
     (/\bU\d+\b/.test(g['Home Team']) || /\bU\d+\b/.test(g['Away Team']));
   
   // ---------- TIME FILTER (Fixed for Central Time) ----------
   const localZone = 'America/Chicago';
   let isWithinLocalWindow = true;
   
   if (g['Start Time'] && g['Start Time'].toDate) {
     try {
       const startTimeUTC = g['Start Time'].toDate().toISOString();
       
       // Convert game UTC start time to local
       const gameLocal = DateTime.fromISO(startTimeUTC, { zone: 'utc' }).setZone(localZone);
       const dateLocal = gameLocal.toISODate();
       const hourLocal = gameLocal.hour;
       
       // Get current local time and "today" date
       const nowLocal = DateTime.now().setZone(localZone);
       const todayLocal = nowLocal.toISODate();
       const tomorrowLocal = nowLocal.plus({ days: 1 }).toISODate();
       
       // ✅ Allow any game that:
       //   • starts today between 3 AM – 11 PM local time, OR
       //   • starts before 3 AM tomorrow (still considered part of tonight's games)
       isWithinLocalWindow =
         (dateLocal === todayLocal && hourLocal >= 3 && hourLocal <= 23) ||
         (dateLocal === tomorrowLocal && hourLocal < 3);
       
       // Debug log for MLS games
       if (g.League && g.League.includes('MLS')) {
         console.log({
           game: `${g['Home Team']} vs ${g['Away Team']}`,
           startTimeUTC,
           dateLocal,
           hourLocal,
           todayLocal,
           tomorrowLocal,
           isWithinLocalWindow
         });
       }
     } catch (error) {
       console.log('Error parsing start time for game:', g['Game ID'], error);
       isWithinLocalWindow = false;
     }
   }
   
   return isAllowedLeague && hasValidTeams && hasStartTime && hasGameId && !isUTeamGame && isWithinLocalWindow;
  });
  console.log(`Filtered ${gamesForFirestore.length} games for Firestore using exact matching.`);




  if (gamesForFirestore.length > 0) {
    await writeGamesToFirestore(gamesForFirestore);
    console.log(`✅ Successfully updated ${gamesForFirestore.length} games in Firestore.`);
  } else {
    console.log('⚠️ No valid games to update.');
  }




  if (res) res.status(200).send(`Refresh complete. Updated ${gamesForFirestore.length} games.`);
} catch (err) {
  console.error('--- refreshAllHandler FAILED ---', err);
  if (res) res.status(500).send('Refresh failed.');
}
};




const fetchUpcomingGamesHandler = async (req, res) => {
try {
  console.log('--- fetchUpcomingGamesHandler started for the next 7 days. ---');
  
  await authenticateGoogleSheets();
  
  const rapidApiHeaders = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
  };
  
  const FUTURE_GAMES_SHEET_NAME = 'Upcoming Games';
  const allGames = [];
  
  // Get the next 7 days
  const today = DateTime.now().setZone('America/Denver');
  const datesToFetch = [];
  
  for (let i = 0; i < 7; i++) {
    const futureDate = today.plus({ days: i });
    datesToFetch.push(futureDate.toISODate());
  }
  
  console.log(`Fetching games for dates: ${datesToFetch.join(', ')}`);
  
  for (const sport of sportsToFetch) {
    for (const dateStr of datesToFetch) {
      const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_slug=${sport.slug}&date=${dateStr}&locale=en_INT&sport_id=${sport.id}&timezone=-4&indent_days=0`;
      
      try {
        const data = await fetchRapidApiData(url, rapidApiHeaders);
        const tournaments = data.DATA || [];

        for (const tour of tournaments) {
          const events = tour.EVENTS || [];
          for (const event of events) {
            const game = {
              'Sport': sport.name,
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
              'Score': event.SCORE_CURRENT || ''
            };
            allGames.push(game);
          }
        }
        
        console.log(`Fetched ${sport.name} games for ${dateStr}: ${data.DATA?.length || 0} tournaments`);
        
        // Add delay between API calls
        await new Promise(resolve => setTimeout(resolve, API_REQUEST_DELAY_MS));
      } catch (error) {
        console.error(`Error fetching ${sport.name} games for ${dateStr}:`, error);
      }
    }
  }

  // Deduplicate Formula 1 races - keep only one entry per race
  const f1RaceMapUpcoming = new Map();
  const nonF1GamesUpcoming = [];
  
  allGames.forEach(game => {
    if (game.Sport === 'Motorsport' && game.League && game.League.includes('Formula 1')) {
      // For F1, use Grand Prix name as unique key (not session type)
      const leagueParts = game.League.split(':');
      const eventName = leagueParts[1] ? leagueParts[1].trim() : '';
      const sessionParts = eventName.split(' - ');
      const grandPrixName = (sessionParts[0] || '').replace('Grand Prix', 'GP');
      const raceKey = grandPrixName; // Use just the Grand Prix name as key
      if (!f1RaceMapUpcoming.has(raceKey)) {
        // Extract event name and session type from league string
        // "Formula 1: Mexican Grand Prix - Race" -> grandPrixName: "Mexican Grand Prix", sessionType: "Race"
        const leagueParts = game.League.split(':');
        const eventName = leagueParts[1] ? leagueParts[1].trim() : '';
        const sessionParts = eventName.split(' - ');
        const grandPrixName = (sessionParts[0] || '').replace('Grand Prix', 'GP');
        const sessionType = sessionParts[1] || '';
        
        // Create a synthetic Game ID based on league + start time (to avoid driver-specific IDs)
        const syntheticGameId = `F1_${game.StartTime}_${grandPrixName.replace(/\s+/g, '_')}`;
        
        game['Game ID'] = syntheticGameId;
        game.Matchup = `${grandPrixName}\n${sessionType}`;
        game['Home Team'] = sessionType;
        game['Away Team'] = grandPrixName;
        // Put live lap data in start time column (where LIVE appears)
        if (game.Score && game.Score.includes('Lap')) {
          game['Start Time'] = game.Score; // Move lap data to start time column
          game.Score = ''; // Clear the scores column
        }
        f1RaceMapUpcoming.set(raceKey, game);
      }
    } else {
      nonF1GamesUpcoming.push(game);
    }
  });
  
  // Combine deduplicated F1 races with other games
  const deduplicatedGamesUpcoming = [...Array.from(f1RaceMapUpcoming.values()), ...nonF1GamesUpcoming];
  console.log(`Deduplicated ${allGames.length} games to ${deduplicatedGamesUpcoming.length} (removed ${allGames.length - deduplicatedGamesUpcoming.length} duplicate F1 driver entries)`);
  
  // Replace allGames with deduplicated version
  allGames.length = 0;
  allGames.push(...deduplicatedGamesUpcoming);

  console.log(`Fetched a total of ${allGames.length} games for the upcoming week.`);

  const sheetRows = allGames.map(g => [
    g.Sport, g['Game ID'], g.League, g.Matchup,
    g['Start Time'] ? g['Start Time'].toDate().toISOString() : '',
    g['Home Team'], g['Away Team'],
    g['Home Score'], g['Away Score'], g.Status,
    g['Match Status'], g['Last Updated']
  ]);

  const sheetHeader = [
    'Sport', 'Game ID', 'League', 'Matchup',
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
  console.log(`Successfully wrote ${sheetRows.length} rows to Google Sheet for the upcoming week.`);

  if (res) {
    res.status(200).send(`Wrote ${sheetRows.length} rows to Google Sheet for the upcoming week.`);
  }
} catch (err) {
  console.error('--- fetchUpcomingGamesHandler FAILED ---', err);
  if (res) res.status(500).send('Failed to fetch upcoming games.');
}
};




const app = express();
app.use(express.json());

app.get('/initialScrapeAndStartPolling', initialScrapeAndStartPollingHandler);
app.post('/initialScrapeAndStartPolling', initialScrapeAndStartPollingHandler);

app.get('/pollLiveGames', pollLiveGamesHandler);
app.post('/pollLiveGames', pollLiveGamesHandler);

app.get('/refreshAll', refreshAllHandler);
app.post('/refreshAll', refreshAllHandler);

app.get('/fetchUpcomingGames', fetchUpcomingGamesHandler);
app.post('/fetchUpcomingGames', fetchUpcomingGamesHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { initialScrapeAndStartPollingHandler, pollLiveGamesHandler, refreshAllHandler, fetchUpcomingGamesHandler };
