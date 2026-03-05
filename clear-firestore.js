// Script to clear Firestore collections
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();
const FIREBASE_PROJECT_ID = serviceAccount.project_id;

async function clearCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`Collection ${collectionPath} is already empty.`);
    return 0;
  }
  
  const batch = db.batch();
  let count = 0;
  
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
  });
  
  await batch.commit();
  console.log(`Deleted ${count} documents from ${collectionPath}`);
  return count;
}

async function clearAllCollections() {
  console.log('Starting Firestore cleanup...\n');
  
  const collections = [
    `artifacts/${FIREBASE_PROJECT_ID}/public/data/sportsGames`,
    `artifacts/${FIREBASE_PROJECT_ID}/public/data/yesterdayScores`
  ];
  
  let totalDeleted = 0;
  
  for (const collectionPath of collections) {
    try {
      const deleted = await clearCollection(collectionPath);
      totalDeleted += deleted;
    } catch (error) {
      console.error(`Error clearing ${collectionPath}:`, error.message);
    }
  }
  
  console.log(`\n✅ Total documents deleted: ${totalDeleted}`);
  console.log('Firestore cleanup complete!');
}

clearAllCollections()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

