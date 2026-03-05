const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testChannelMatching() {
  try {
    console.log('🚀 Starting channel matching test...\n');
    console.log('Firebase initialized successfully\n');
    
    // Get today's date
    const nowInEastern = DateTime.now().setZone('America/New_York');
    const todayStr = nowInEastern.toISODate();
    console.log(`Today's date (Eastern): ${todayStr}\n`);
    
    // Check sportsGames collection for today
    console.log('=== Checking sportsGames collection ===');
    const sportsGamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const sportsGamesSnapshot = await sportsGamesRef
      .where('gameDate', '==', todayStr)
      .limit(5)
      .get();
    
    if (sportsGamesSnapshot.empty) {
      console.log('❌ No games found in sportsGames for today');
    } else {
      console.log(`✅ Found ${sportsGamesSnapshot.size} games in sportsGames\n`);
      sportsGamesSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Game ${index + 1}:`);
        console.log(`  League: ${data.League}`);
        console.log(`  Home: ${data['Home Team']}`);
        console.log(`  Away: ${data['Away Team']}`);
        console.log(`  Date: ${data.gameDate}`);
        console.log(`  Channel: ${data.channel || '❌ MISSING'}`);
        console.log('');
      });
    }
    
    // Check MLB collection
    console.log('\n=== Checking MLB collection ===');
    const mlbRef = db.collection('MLB');
    const mlbSnapshot = await mlbRef
      .where('date', '==', todayStr)
      .limit(3)
      .get();
    
    if (mlbSnapshot.empty) {
      console.log('❌ No games found in MLB collection for today');
    } else {
      console.log(`✅ Found ${mlbSnapshot.size} games in MLB collection\n`);
      mlbSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`MLB Game ${index + 1}:`);
        console.log(`  Home: ${data.home}`);
        console.log(`  Away: ${data.away}`);
        console.log(`  Date: ${data.date}`);
        console.log(`  Channel: ${data.channel || '❌ MISSING'}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testChannelMatching();
