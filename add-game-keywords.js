// Script to add keywords to game documents in Firestore
// Usage: node add-game-keywords.js <gameId> "keyword1,keyword2,keyword3"

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'flashlive-daily-scraper'
  });
}

const db = admin.firestore();

async function addKeywordsToGame(gameId, keywordsArray) {
  try {
    const gameRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames').doc(gameId);
    
    // Check if game exists
    const gameDoc = await gameRef.get();
    if (!gameDoc.exists) {
      console.error(`❌ Game not found: ${gameId}`);
      return;
    }
    
    const gameData = gameDoc.data();
    console.log(`📋 Current game data:`, {
      'Home Team': gameData['Home Team'],
      'Away Team': gameData['Away Team'],
      'League': gameData['League']
    });
    
    // Update keywords field
    await gameRef.update({
      keywords: keywordsArray
    });
    
    console.log(`✅ Successfully added keywords to game ${gameId}:`);
    console.log(`   Keywords:`, keywordsArray);
    
  } catch (error) {
    console.error(`❌ Error adding keywords:`, error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(`
Usage: node add-game-keywords.js <gameId> "keyword1,keyword2,keyword3"

Example:
  node add-game-keywords.js espn-nhl-401802995 "Penguins,Red Wings,Sidney Crosby,Dylan Larkin,Pittsburgh,Detroit"

Or with quotes around each keyword:
  node add-game-keywords.js espn-nhl-401802995 "Penguins" "Red Wings" "Sidney Crosby"
  `);
  process.exit(1);
}

const gameId = args[0];
// Support both comma-separated string and multiple arguments
const keywordsString = args.slice(1).join(' ');
const keywordsArray = keywordsString.split(',').map(k => k.trim()).filter(k => k.length > 0);

console.log(`🎯 Adding keywords to game: ${gameId}`);
console.log(`   Keywords:`, keywordsArray);
console.log('');

addKeywordsToGame(gameId, keywordsArray)
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

