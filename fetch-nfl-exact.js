// fetch-nfl-exact.js
// Based on the exact RapidAPI data structure you showed me
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
    throw error;
  }
}

// Helper: create canonical key for matching (league|home|away|date)
function getGameKey(league, homeTeam, awayTeam, date) {
  return `${league}|${(homeTeam || '').toLowerCase().trim()}|${(awayTeam || '').toLowerCase().trim()}|${date}`;
}

async function clearFirestoreCollection() {
  const db = initializeFirebase();
  const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/yesterdayNFLScores`);
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

async function fetchNFLExact() {
  try {
    console.log('--- fetchNFLExact started. ---');
    
    // Clear the collection
    await clearFirestoreCollection();

    const rapidApiHeaders = {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    };

    // Use timezone=0 (UTC) to get NFL data
    const url = `https://${RAPIDAPI_HOST}/v1/events/list?sport_id=5&day=-1&locale=en_INT&timezone=0&indent_days=0`;
    console.log(`API URL: ${url}`);

    const data = await fetchRapidApiData(url, rapidApiHeaders);
    console.log('Raw API Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.DATA && data.DATA.length > 0) {
      console.log(`\nFound ${data.DATA.length} tournaments:`);
      
      const nflGames = [];
      
      data.DATA.forEach((tour, index) => {
        const leagueName = tour.NAME;
        console.log(`\n${index + 1}. "${leagueName}" (${tour.EVENTS ? tour.EVENTS.length : 0} events)`);
        
        // Look for "USA: NFL" exactly as you showed me
        if (leagueName === 'USA: NFL') {
          console.log(`🎯 FOUND "USA: NFL" LEAGUE!`);
          
          if (tour.EVENTS && tour.EVENTS.length > 0) {
            tour.EVENTS.forEach((event, eventIndex) => {
              const homeTeam = event.HOME_NAME;
              const awayTeam = event.AWAY_NAME;
              const status = event.STAGE;
              const homeScore = event.HOME_SCORE_CURRENT || 0;
              const awayScore = event.AWAY_SCORE_CURRENT || 0;
              const startTime = event.START_TIME;
              
              console.log(`\n  ${eventIndex + 1}. ${homeTeam} vs ${awayTeam}`);
              console.log(`     Status: ${status}`);
              console.log(`     Score: ${homeScore}:${awayScore}`);
              console.log(`     Start Time: ${startTime}`);
              
              if (status === 'FINISHED') {
                console.log(`     ✅ FINISHED GAME WITH FINAL SCORES`);
                
                // Create game data exactly as your original script
                const gameDateIso = DateTime.now().setZone('America/New_York').minus({ days: 1 }).toISODate();
                const gameData = {
                  'Sport': 'American Football',
                  'Game ID': event.EVENT_ID,
                  'League': 'USA: NFL',
                  'Matchup': `${homeTeam} vs ${awayTeam}`,
                  'Start Time': admin.firestore.Timestamp.fromMillis(startTime * 1000),
                  'Home Team': homeTeam,
                  'Away Team': awayTeam,
                  'Home Score': homeScore,
                  'Away Score': awayScore,
                  'Status': status,
                  'Match Status': event.STAGE_TYPE || '',
                  'Last Updated': new Date().toISOString(),
                  'gameDate': gameDateIso,
                  'Final': true,
                  'canonicalGameKey': getGameKey('USA: NFL', homeTeam, awayTeam, gameDateIso)
                };
                
                nflGames.push(gameData);
                console.log(`     📊 Added to NFL games list`);
              }
            });
          }
        }
      });
      
      if (nflGames.length > 0) {
        await writeGamesToFirestore(nflGames);
        console.log(`\n✅ Successfully wrote ${nflGames.length} NFL games to Firestore.`);
      } else {
        console.log(`\n⚠️ No finished NFL games found.`);
      }
      
    } else {
      console.log('No data found in API response.');
    }

  } catch (err) {
    console.error('Error fetching NFL games:', err.message);
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchNFLExact()
    .then(() => {
      console.log(`✅ Script completed successfully.`);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Script failed:', err);
      process.exit(1);
    });
}

export { fetchNFLExact };
