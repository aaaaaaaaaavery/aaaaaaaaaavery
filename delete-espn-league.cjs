const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'flashlive-daily-scraper'
  });
}

const db = admin.firestore();
const leagueName = process.argv[2];

if (!leagueName) {
  console.log('Usage: node delete-espn-league.cjs <LEAGUE_NAME>');
  console.log('Example: node delete-espn-league.cjs NCAAM');
  console.log('Example: node delete-espn-league.cjs NCAAW');
  process.exit(1);
}

const collectionPath = `artifacts/${process.env.FIREBASE_PROJECT_ID || 'flashlive-daily-scraper'}/public/data/espnLiveGames`;
const gamesRef = db.collection(collectionPath);

console.log(`⚠️  WARNING: This will delete ALL ${leagueName} games from espnLiveGames collection`);
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');

setTimeout(async () => {
  try {
    const snapshot = await gamesRef.where('League', '==', leagueName).get();
    
    if (snapshot.empty) {
      console.log(`No ${leagueName} games found`);
      process.exit(0);
    }
    
    console.log(`Found ${snapshot.size} ${leagueName} games to delete`);
    
    const batchSize = 500;
    let deletedCount = 0;
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = docs.slice(i, i + batchSize);
      
      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      deletedCount += batchDocs.length;
      console.log(`Deleted ${deletedCount} / ${docs.length} games...`);
    }
    
    console.log(`✅ Successfully deleted ${deletedCount} ${leagueName} games`);
    process.exit(0);
  } catch (error) {
    console.error(`Error:`, error.message);
    process.exit(1);
  }
}, 3000);

