// Script to delete ESPN games from Firestore
// Usage: node delete-espn-games.js [collection] [source]
// Examples:
//   node delete-espn-games.js sportsGames ESPN_LIVE  (delete ESPN_LIVE games from sportsGames)
//   node delete-espn-games.js espnLiveGames          (delete all games from espnLiveGames collection)

import { DateTime } from 'luxon';
import admin from 'firebase-admin';

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id'
  });
}

const db = admin.firestore();
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'your-project-id';

async function deleteESPNGames(collectionName = 'sportsGames', sourceFilter = 'ESPN_LIVE') {
  try {
    console.log(`🗑️  Starting deletion of ESPN games from ${collectionName}...`);
    
    const gamesRef = db.collection(`artifacts/${FIREBASE_PROJECT_ID}/public/data/${collectionName}`);
    
    let query = gamesRef;
    
    // If source filter is provided, filter by source
    if (sourceFilter && collectionName === 'sportsGames') {
      query = gamesRef.where('source', '==', sourceFilter);
      console.log(`   Filtering by source: ${sourceFilter}`);
    } else {
      console.log(`   Deleting ALL games from ${collectionName} collection`);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log(`✅ No games found to delete in ${collectionName}`);
      return;
    }
    
    console.log(`   Found ${snapshot.size} games to delete`);
    
    // Delete in batches (Firestore limit is 500 per batch)
    let deletedCount = 0;
    let currentBatch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      currentBatch.delete(doc.ref);
      deletedCount++;
      batchCount++;
      
      // Firestore batch limit is 500 operations
      if (batchCount >= 500) {
        await currentBatch.commit();
        console.log(`   Deleted batch of ${batchCount} games (total: ${deletedCount})`);
        currentBatch = db.batch();
        batchCount = 0;
      }
    }
    
    // Commit final batch if there are remaining deletions
    if (batchCount > 0) {
      await currentBatch.commit();
      console.log(`   Deleted final batch of ${batchCount} games`);
    }
    
    console.log(`✅ Successfully deleted ${deletedCount} games from ${collectionName}`);
    
  } catch (error) {
    console.error('❌ Error deleting ESPN games:', error);
    throw error;
  }
}

// Get command line arguments
const collectionName = process.argv[2] || 'sportsGames';
const sourceFilter = process.argv[3] || 'ESPN_LIVE';

console.log('='.repeat(60));
console.log('ESPN Games Deletion Script');
console.log('='.repeat(60));
console.log(`Collection: ${collectionName}`);
if (sourceFilter && collectionName === 'sportsGames') {
  console.log(`Source Filter: ${sourceFilter}`);
}
console.log('='.repeat(60));
console.log('');

// Run the deletion
deleteESPNGames(collectionName, sourceFilter)
  .then(() => {
    console.log('');
    console.log('✅ Deletion complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Deletion failed!');
    process.exit(1);
  });

