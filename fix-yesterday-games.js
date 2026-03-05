// fix-yesterday-games.js
// Immediate fix script to move completed games from sportsGames to yesterdayScores

import { DateTime } from 'luxon';
import admin from 'firebase-admin';

// Firebase Admin initialization
let db;
function initializeFirebase() {
  if (db) return db;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'flashlive-daily-scraper'
    });
  }
  db = admin.firestore();
  console.log('Firebase Firestore initialized.');
  return db;
}

async function fixYesterdayGames() {
  try {
    console.log('=== FIXING YESTERDAY GAMES ===\n');
    
    const db = initializeFirebase();
    
    // Get yesterday's date in Eastern Time (matches gameDate storage)
    const nowInEastern = DateTime.now().setZone('America/New_York');
    const yesterdayStr = nowInEastern.minus({ days: 1 }).toISODate();
    console.log(`Looking for games from: ${yesterdayStr}\n`);
    
    // Collections
    const sportsGamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const yesterdayScoresRef = db.collection('artifacts/flashlive-daily-scraper/public/data/yesterdayScores');
    
    // Step 1: Check what games are in sportsGames from yesterday
    console.log('Step 1: Checking sportsGames collection for yesterday\'s games...');
    const sportsGamesSnapshot = await sportsGamesRef
      .where('gameDate', '==', yesterdayStr)
      .get();
    
    console.log(`Found ${sportsGamesSnapshot.size} games in sportsGames from yesterday\n`);
    
    if (sportsGamesSnapshot.size === 0) {
      console.log('⚠️  No games found in sportsGames for yesterday.');
      console.log('Checking if games exist with different date format or Match Status...\n');
      
      // Try to find any games that might be from yesterday (check all games)
      const allGamesSnapshot = await sportsGamesRef.limit(100).get();
      console.log(`Checking first 100 games in sportsGames...`);
      
      const yesterdayGames = [];
      allGamesSnapshot.forEach(doc => {
        const data = doc.data();
        const gameDate = data.gameDate;
        const matchStatus = data['Match Status'] || data.MatchStatus || '';
        const startTime = data['Start Time'];
        
        // Check if game is from yesterday by checking Start Time
        let isYesterday = false;
        if (startTime && startTime.toDate) {
          const startDate = startTime.toDate();
          const startDateStr = DateTime.fromJSDate(startDate).setZone('America/New_York').toISODate();
          if (startDateStr === yesterdayStr) {
            isYesterday = true;
          }
        }
        
        if (isYesterday || gameDate === yesterdayStr) {
          yesterdayGames.push({
            id: doc.id,
            data: data,
            gameDate: gameDate,
            matchStatus: matchStatus,
            startTime: startTime
          });
        }
      });
      
      console.log(`Found ${yesterdayGames.length} potential yesterday games by checking Start Time\n`);
      
      if (yesterdayGames.length === 0) {
        console.log('❌ No games found for yesterday. The games may have already been moved or deleted.');
        return;
      }
      
      // Move these games
      let movedCount = 0;
      const gameIdSet = new Set();
      const canonicalKeySet = new Set();
      
      for (const game of yesterdayGames) {
        const data = game.data;
        const gameId = data['Game ID'] || game.id;
        const canonicalKey = data['canonicalGameKey'] || '';
        
        // Deduplicate
        if (gameIdSet.has(gameId)) {
          console.log(`⏭️  Skipping duplicate game ${gameId} (by Game ID)`);
          continue;
        }
        
        if (canonicalKey && canonicalKeySet.has(canonicalKey)) {
          console.log(`⏭️  Skipping duplicate game ${gameId} (by canonicalGameKey)`);
          continue;
        }
        
        try {
          // Ensure gameDate is set correctly
          const gameData = {
            ...data,
            gameDate: yesterdayStr
          };
          
          await yesterdayScoresRef.doc(String(gameId)).set(gameData, { merge: true });
          gameIdSet.add(gameId);
          if (canonicalKey) {
            canonicalKeySet.add(canonicalKey);
          }
          movedCount++;
          console.log(`✅ Moved game ${gameId} (${data['Home Team']} vs ${data['Away Team']})`);
        } catch (err) {
          console.error(`❌ Error moving game ${game.id}:`, err.message);
        }
      }
      
      console.log(`\n✅ Successfully moved ${movedCount} games to yesterdayScores.`);
      return;
    }
    
    // Step 2: Move games to yesterdayScores
    console.log('Step 2: Moving games to yesterdayScores collection...\n');
    
    let movedCount = 0;
    let skippedCount = 0;
    const gameIdSet = new Set();
    const canonicalKeySet = new Set();
    
    for (const doc of sportsGamesSnapshot.docs) {
      const data = doc.data();
      const gameId = data['Game ID'] || doc.id;
      const canonicalKey = data['canonicalGameKey'] || '';
      const matchStatus = data['Match Status'] || '';
      
      // Deduplicate
      if (gameIdSet.has(gameId)) {
        console.log(`⏭️  Skipping duplicate game ${gameId} (by Game ID)`);
        skippedCount++;
        continue;
      }
      
      if (canonicalKey && canonicalKeySet.has(canonicalKey)) {
        console.log(`⏭️  Skipping duplicate game ${gameId} (by canonicalGameKey)`);
        skippedCount++;
        continue;
      }
      
      try {
        // Ensure gameDate is set correctly
        const gameData = {
          ...data,
          gameDate: yesterdayStr
        };
        
        await yesterdayScoresRef.doc(String(gameId)).set(gameData, { merge: true });
        gameIdSet.add(gameId);
        if (canonicalKey) {
          canonicalKeySet.add(canonicalKey);
        }
        movedCount++;
        
        const teams = `${data['Home Team'] || 'N/A'} vs ${data['Away Team'] || 'N/A'}`;
        console.log(`✅ Moved game ${gameId}: ${teams} (Status: ${matchStatus || 'N/A'})`);
      } catch (err) {
        console.error(`❌ Error moving game ${doc.id}:`, err.message);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`✅ Moved: ${movedCount} games`);
    console.log(`⏭️  Skipped (duplicates): ${skippedCount} games`);
    console.log(`\n✅ Fix complete! Games should now appear in yesterday tab.`);
    
    // Step 3: Verify yesterdayScores collection
    console.log('\nStep 3: Verifying yesterdayScores collection...');
    const yesterdaySnapshot = await yesterdayScoresRef
      .where('gameDate', '==', yesterdayStr)
      .get();
    
    console.log(`✅ yesterdayScores collection now has ${yesterdaySnapshot.size} games for ${yesterdayStr}`);
    
  } catch (error) {
    console.error('❌ Error fixing yesterday games:', error);
    throw error;
  }
}

// Run the fix
fixYesterdayGames()
  .then(() => {
    console.log('\n✅ Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
