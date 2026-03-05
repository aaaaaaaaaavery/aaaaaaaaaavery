const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test MLB collection
    const mlbRef = db.collection('MLB');
    const mlbSnapshot = await mlbRef.where('date', '==', '2025-10-09').get();
    
    console.log(`Found ${mlbSnapshot.size} MLB games for 2025-10-09`);
    
    mlbSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`MLB Game ${index + 1}:`);
      console.log(`  Home: ${data.home}`);
      console.log(`  Away: ${data.away}`);
      console.log(`  Channel: ${data.channel}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFirebase();
