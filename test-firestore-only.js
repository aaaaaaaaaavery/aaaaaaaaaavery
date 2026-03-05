const admin = require('firebase-admin');

// Initialize Firebase
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testFirestore() {
  console.log('=== TESTING FIRESTORE ONLY ===');
  
  try {
    // Test today's games
    console.log('1. Testing today\'s games...');
    const todayStr = new Date().toISOString().split('T')[0];
    console.log('Looking for games with date:', todayStr);
    
    const sportsGamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const snapshot = await sportsGamesRef.where('gameDate', '==', todayStr).limit(5).get();
    
    console.log(`✅ Found ${snapshot.size} games for today`);
    if (snapshot.size > 0) {
      console.log('Sample games:');
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. Game ID: ${data['Game ID']}, League: ${data.League}, Teams: ${data['Away Team']} vs ${data['Home Team']}`);
      });
    }
    
    // Test specific game ID
    console.log('\n2. Testing specific Game ID: 4Yn6SKdE...');
    const specificGameRef = sportsGamesRef.where('Game ID', '==', '4Yn6SKdE');
    const specificSnapshot = await specificGameRef.get();
    
    console.log(`Found ${specificSnapshot.size} games with ID 4Yn6SKdE`);
    if (specificSnapshot.size > 0) {
      specificSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  Game ID: ${data['Game ID']}`);
        console.log(`  Date: ${data.gameDate}`);
        console.log(`  League: ${data.League}`);
        console.log(`  Teams: ${data['Away Team']} vs ${data['Home Team']}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

testFirestore();
