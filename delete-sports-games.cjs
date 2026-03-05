const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteCollection() {
  const collectionRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
  
  console.log('Deleting all games from sportsGames collection...');
  
  let deletedCount = 0;
  let batch = db.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;
  
  const snapshot = await collectionRef.get();
  const totalDocs = snapshot.size;
  console.log(`Found ${totalDocs} documents to delete...`);
  
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    batchCount++;
    deletedCount++;
    
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`Deleted ${deletedCount}/${totalDocs} documents...`);
      batch = db.batch();
      batchCount = 0;
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`✅ Deleted ${deletedCount} documents from sportsGames collection`);
  process.exit(0);
}

deleteCollection().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

