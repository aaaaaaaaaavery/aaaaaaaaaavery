const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debugSportsGames() {
  try {
    console.log('🔍 Debugging sportsGames collection...\n');
    
    // Get today's date
    const nowInEastern = DateTime.now().setZone('America/New_York');
    const todayStr = nowInEastern.toISODate();
    console.log(`Today's date (Eastern): ${todayStr}\n`);
    
    // Check sportsGames collection for today
    const sportsGamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const sportsGamesSnapshot = await sportsGamesRef
      .where('gameDate', '==', todayStr)
      .get();
    
    if (sportsGamesSnapshot.empty) {
      console.log('❌ No games found in sportsGames for today');
    } else {
      console.log(`✅ Found ${sportsGamesSnapshot.size} games in sportsGames\n`);
      
      // Look specifically for MLB games
      const mlbGames = [];
      sportsGamesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.League === 'USA: MLB') {
          mlbGames.push(data);
        }
      });
      
      if (mlbGames.length > 0) {
        console.log(`🎯 Found ${mlbGames.length} MLB games:\n`);
        mlbGames.forEach((game, index) => {
          console.log(`MLB Game ${index + 1}:`);
          console.log(`  Home: "${game['Home Team']}"`);
          console.log(`  Away: "${game['Away Team']}"`);
          console.log(`  League: ${game.League}`);
          console.log(`  Date: ${game.gameDate}`);
          console.log(`  Channel: ${game.channel || '❌ MISSING'}`);
          console.log('');
        });
      } else {
        console.log('❌ No MLB games found in sportsGames for today');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugSportsGames();
