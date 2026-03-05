// fetch-yesterday-all-leagues.js
// Fetch yesterday's games for all leagues from ALLOWED_LEAGUE_KEYWORDS
import { DateTime } from 'luxon';
import admin from 'firebase-admin';
import fetch from 'node-fetch';

// Firebase Admin initialization
let db;
function initializeFirebase() {
  if (db) return db;
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
    "Euro Women", "Leagues Cup", "Europa League", "North & Central America: Leagues Cup - Play Offs", 
    "World: Club Friendly", "Conference League", "Portugal: Super Cup", "UEFA Champions League", 
    "World: Friendly International", "England: Premier League", "Italy: Coppa Italia", 
    "Turkey: Super Lig", "Europe: Europa League - Qualification", "Europe: Champions League Women - Qualification - Second stage", 
    "Europe: Conference League - Qualification", "Germany: Bundesliga", "Italy: Serie A", 
    "France: Ligue 1", "South America: Copa Libertadores - Play Offs", "Brazil: Serie A Betano", 
    "South America: Copa Sudamericana - Play Offs", "Europe: Champions League - Qualification", 
    "Germany: DFB Pokal", "USA: NWSL Women", "Mexico: Liga MX"
  ],
  // Basketball-specific leagues
  'Basketball': [
    "NBA", "USA: WNBA", "World: AmeriCup"
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
  ]
};

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

async function fetchYesterdayAllLeagues() {
  try {
    console.log('--- fetchYesterdayAllLeagues started. ---');
    
    // Clear the collection
    await clearFirestoreCollection();

    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Get all sports with correct IDs
    const sportsToFetch = [
      { slug: 'football', id: 5, name: 'American Football' },
      { slug: 'basketball', id: 3, name: 'Basketball' },
      { slug: 'baseball', id: 6, name: 'Baseball' },  // Fixed: Baseball is sport_id=6
      { slug: 'hockey', id: 4, name: 'Ice Hockey' },
      { slug: 'soccer', id: 1, name: 'Soccer' }
    ];

    const allGames = [];

    for (const sport of sportsToFetch) {
      console.log(`\n--- Fetching ${sport.name} (ID: ${sport.id}) ---`);
      
      // Use timezone=6 (UTC+6) for Baseball to get all 9 MLB games, timezone=0 for others
      const timezone = sport.id === 6 ? 6 : 0; // Baseball needs timezone=6, others use timezone=0
      const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_id=${sport.id}&day=-1&locale=en_INT&timezone=${timezone}&indent_days=0`;
      console.log(`API URL: ${url}`);

      try {
        const data = await fetchRapidApiData(url, rapidApiHeaders);
        
        if (data.DATA && data.DATA.length > 0) {
          console.log(`Found ${data.DATA.length} tournaments for ${sport.name}`);
          
          data.DATA.forEach((tour, index) => {
            const leagueName = tour.NAME;
            console.log(`  ${index + 1}. "${leagueName}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
            
            // Check if this league is allowed for this specific sport
            const allowedLeaguesForSport = ALLOWED_LEAGUE_KEYWORDS[sport.name] || [];
            const isAllowedLeague = allowedLeaguesForSport.some(keyword => 
              leagueName.includes(keyword) || keyword.includes(leagueName)
            );
            
            if (isAllowedLeague) {
              console.log(`    🎯 ALLOWED LEAGUE: "${leagueName}"`);
              
              if (tour.EVENTS && tour.EVENTS.length > 0) {
                tour.EVENTS.forEach((event, eventIndex) => {
                  const homeTeam = event.HOME_NAME;
                  const awayTeam = event.AWAY_NAME;
                  const status = event.STAGE;
                  const homeScore = event.HOME_SCORE_CURRENT || 0;
                  const awayScore = event.AWAY_SCORE_CURRENT || 0;
                  const startTime = event.START_TIME;
                  
                  console.log(`      ${eventIndex + 1}. ${homeTeam} vs ${awayTeam}`);
                  console.log(`         Status: ${status}`);
                  console.log(`         Score: ${homeScore}:${awayScore}`);
                  
                  if (status === 'FINISHED') {
                    console.log(`         ✅ FINISHED GAME WITH FINAL SCORES`);
                    
                    // Filter out games with "U" followed by numbers (e.g., U20, U23, U19) for World: Friendly International
                    const isUTeamGame = leagueName === 'World: Friendly International' && 
                      (/\bU\d+\b/.test(homeTeam) || /\bU\d+\b/.test(awayTeam));
                    
                    if (isUTeamGame) {
                      console.log(`         🚫 FILTERED OUT: U-team game (${homeTeam} vs ${awayTeam})`);
                      return;
                    }
                    
                    // Create game data exactly as your original script
                    const gameData = {
                      'Sport': sport.name,
                      'Game ID': event.EVENT_ID,
                      'League': leagueName,
                      'Matchup': `${homeTeam} vs ${awayTeam}`,
                      'Start Time': admin.firestore.Timestamp.fromMillis(startTime * 1000),
                      'Home Team': homeTeam,
                      'Away Team': awayTeam,
                      'Home Score': homeScore,
                      'Away Score': awayScore,
                      'Status': status,
                      'Match Status': event.STAGE_TYPE || '',
                      'Last Updated': new Date().toISOString(),
                      'gameDate': DateTime.now().setZone('America/New_York').minus({ days: 1 }).toISODate(),
                      'Final': true
                    };
                    
                    allGames.push(gameData);
                    console.log(`         📊 Added to games list`);
                  }
                });
              }
            }
          });
        } else {
          console.log(`No data found for ${sport.name}`);
        }
      } catch (error) {
        console.error(`Error fetching ${sport.name}:`, error.message);
      }
    }
    
    if (allGames.length > 0) {
      await writeGamesToFirestore(allGames);
      console.log(`\n✅ Successfully wrote ${allGames.length} total games to Firestore.`);
    } else {
      console.log(`\n⚠️ No finished games found for any allowed leagues.`);
    }

  } catch (err) {
    console.error('Error fetching yesterday\'s games:', err.message);
  }
}

// Cloud Function entry point
exports.fetchYesterdayScores = async (req, res) => {
  try {
    console.log('Cloud Function: fetchYesterdayScores started');
    await fetchYesterdayAllLeagues();
    console.log('Cloud Function: fetchYesterdayScores completed successfully');
    res.status(200).send('Successfully fetched yesterday\'s scores');
  } catch (error) {
    console.error('Cloud Function: fetchYesterdayScores failed:', error);
    res.status(500).send('Error fetching yesterday\'s scores: ' + error.message);
  }
};
