const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debugGames() {
  try {
    console.log('=== Debugging Games Status ===');
    
    // Get today's date in Eastern timezone
    const today = DateTime.now().setZone('America/New_York').toISODate();
    console.log(`Looking for games from: ${today}`);
    
    // Reference to FlashLiveAPI collection
    const gamesCollectionRef = db.collection("artifacts/flashlive-daily-scraper/public/data/sportsGames");
    
    // Get all games from today
    const snapshot = await gamesCollectionRef.where('gameDate', '==', today).get();
    
    if (snapshot.empty) {
      console.log('No games found for today');
      return;
    }
    
    console.log(`Found ${snapshot.size} games for today:`);
    console.log('=====================================');
    
    snapshot.forEach(doc => {
      const gameData = doc.data();
      
      console.log(`\nGame: ${gameData.away} vs ${gameData.home}`);
      console.log(`Status: ${gameData.status || 'No status'}`);
      console.log(`Home Score: ${gameData.homeScore || 'No score'}`);
      console.log(`Away Score: ${gameData.awayScore || 'No score'}`);
      console.log(`League: ${gameData.League || 'No league'}`);
      
      // Check completion logic
      const isCompleted = gameData.status === 'finished' || 
                         gameData.status === 'completed' || 
                         gameData.status === 'final' ||
                         (gameData.homeScore !== undefined && gameData.awayScore !== undefined) ||
                         (gameData.status && gameData.status.toLowerCase().includes('final'));
      
      console.log(`Is Completed: ${isCompleted}`);
      console.log('---');
    });
    
    // Check YesterdayScores collection
    console.log('\n=== YesterdayScores Collection ===');
    const yesterdayScoresRef = db.collection('YesterdayScores');
    const scoresSnapshot = await yesterdayScoresRef.get();
    
    if (scoresSnapshot.empty) {
      console.log('YesterdayScores collection is empty');
    } else {
      console.log(`YesterdayScores has ${scoresSnapshot.size} games:`);
      scoresSnapshot.forEach(doc => {
        const scoreData = doc.data();
        console.log(`- ${scoreData.away} vs ${scoreData.home} (${scoreData.originalGameDate})`);
      });
    }
    
  } catch (error) {
    console.error('Error debugging games:', error);
  }
}

debugGames().then(() => {
  console.log('\nDebug completed');
  process.exit(0);
}).catch(error => {
  console.error('Debug failed:', error);
  process.exit(1);
});
