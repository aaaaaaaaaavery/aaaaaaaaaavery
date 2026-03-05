// fetch-yesterday-nfl.js
import { DateTime } from 'luxon';
import admin from 'firebase-admin';
import fetch from 'node-fetch';

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

// NFL-specific configuration
const NFL_SPORT = { slug: 'football', id: 5, name: 'American Football' };
const NFL_LEAGUE_KEYWORDS = ['USA: NFL', 'NFL'];

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
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/yesterdayNFLScores`);

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
    console.log(`Successfully wrote ${gameCount} NFL games to Firestore.`);
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

// Helper: create canonical key for matching (league|home|away|date)
function getGameKey(league, homeTeam, awayTeam, date) {
  return `${league}|${(homeTeam || '').toLowerCase().trim()}|${(awayTeam || '').toLowerCase().trim()}|${date}`;
}

async function clearYesterdayNFLCollection() {
  const db = initializeFirebase();
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/yesterdayNFLScores`);
  const snapshot = await gamesRef.get();

  if (snapshot.empty) {
    console.log('No documents to clear in yesterdayNFLScores collection.');
    return;
  }
  
  const batch = db.batch();
  snapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`🧹 Cleared ${snapshot.size} docs from yesterdayNFLScores collection.`);
}

async function fetchYesterdayNFLGames() {
  try {
    console.log('--- fetchYesterdayNFLGames started. ---');
    
    // Clear the yesterdayNFLScores collection
    console.log('Clearing yesterdayNFLScores collection...');
    await clearYesterdayNFLCollection();
    console.log('yesterdayNFLScores collection cleared.');

    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Get yesterday's date in Eastern time
    const yesterdayInEastern = DateTime.now().setZone('America/New_York').minus({ days: 1 });
    const yesterdayStr = yesterdayInEastern.toISODate();
    console.log(`Fetching NFL games for yesterday: ${yesterdayStr}`);

    const allGames = [];
    // Use day=-1 parameter instead of date string, and sport_id=5
    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_id=5&day=-1&locale=en_INT&timezone=-4&indent_days=0`;

    try {
      const data = await fetchRapidApiData(url, rapidApiHeaders);
      const tournaments = data.DATA || [];

      for (const tour of tournaments) {
        const events = tour.EVENTS || [];
        for (const event of events) {
          // Only include NFL games - look for "USA: NFL" specifically
          const isNFLGame = tour.NAME === 'USA: NFL';

          if (isNFLGame) {
            const game = {
              'Sport': tour.SPORT_NAME || NFL_SPORT.name,
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
              'gameDate': yesterdayStr,
              'Final': true, // Mark as final since these are yesterday's games
              'canonicalGameKey': getGameKey(tour.NAME, event.HOME_NAME, event.AWAY_NAME, yesterdayStr)
            };
            allGames.push(game);
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching NFL games for ${yesterdayStr}: ${err.message}`);
    }

    console.log(`Fetched ${allGames.length} NFL games from yesterday.`);

    // Filter for valid games with final scores
    const validGames = allGames.filter(g => {
      const hasValidTeams = g['Home Team'] && g['Away Team'];
      const hasScores = g['Home Score'] !== '' && g['Away Score'] !== '';
      const hasGameId = g['Game ID'];
      const isFinished = g.Status === 'FINISHED' || g.Status === 'COMPLETED';
      return hasValidTeams && hasScores && hasGameId && isFinished;
    });

    console.log(`Filtered ${validGames.length} valid NFL games with final scores.`);

    if (validGames.length > 0) {
      await writeGamesToFirestore(validGames);
      console.log(`✅ Successfully wrote ${validGames.length} yesterday's NFL games to Firestore.`);
    } else {
      console.log('⚠️ No valid NFL games found for yesterday.');
    }

    return validGames;
  } catch (err) {
    console.error('--- fetchYesterdayNFLGames FAILED ---', err);
    throw err;
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchYesterdayNFLGames()
    .then(games => {
      console.log(`✅ Successfully fetched ${games.length} yesterday's NFL games.`);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Script failed:', err);
      process.exit(1);
    });
}

export { fetchYesterdayNFLGames };
