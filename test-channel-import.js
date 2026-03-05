const { google } = require('googleapis');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const SHEET_ID = '1gGY9dr485hf4WrdGkx01kC6Gw7oTuKeYYh_UQD5qkt4';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

async function testMLBImport() {
  try {
    console.log('Testing MLB channel import...\n');
    
    // Authenticate
    const auth = new google.auth.GoogleAuth({
      scopes: SCOPES,
      credentials: serviceAccount
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Read MLB sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'MLB!A:Z'
    });
    
    const data = response.data.values || [];
    
    if (data.length === 0) {
      console.log('❌ No data found in MLB sheet');
      return;
    }
    
    // Show headers
    const headers = data[0];
    console.log('📋 Headers found in MLB sheet:');
    headers.forEach((header, index) => {
      console.log(`  Column ${index}: "${header}"`);
    });
    
    // Check if Channel column exists
    const channelIndex = headers.findIndex(header => 
      header && header.toLowerCase().includes('channel')
    );
    
    if (channelIndex === -1) {
      console.log('\n❌ No "Channel" column found!');
      console.log('Please add a column with "Channel" in the header.');
    } else {
      console.log(`\n✅ Channel column found at index ${channelIndex}`);
      
      // Show first 3 rows with channel data
      console.log('\n📊 Sample data (first 3 rows):');
      for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
        const row = data[i];
        const date = row[0] || '';
        const time = row[1] || '';
        const away = row[2] || '';
        const home = row[3] || '';
        const channel = row[channelIndex] || '(empty)';
        
        console.log(`\nRow ${i}:`);
        console.log(`  Date: ${date}`);
        console.log(`  Time: ${time}`);
        console.log(`  Away: ${away}`);
        console.log(`  Home: ${home}`);
        console.log(`  Channel: ${channel}`);
      }
    }
    
    // Check Firestore
    console.log('\n\n🔍 Checking Firestore MLB collection...');
    const mlbSnapshot = await db.collection('MLB').limit(3).get();
    
    if (mlbSnapshot.empty) {
      console.log('❌ No documents in MLB collection');
    } else {
      console.log(`✅ Found ${mlbSnapshot.size} documents in MLB collection`);
      console.log('\n📄 Sample documents:');
      mlbSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\nDocument ${index + 1}:`);
        console.log(`  Date: ${data.date || '(missing)'}`);
        console.log(`  Time: ${data.time || '(missing)'}`);
        console.log(`  Away: ${data.away || '(missing)'}`);
        console.log(`  Home: ${data.home || '(missing)'}`);
        console.log(`  Channel: ${data.channel || '❌ MISSING'}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMLBImport();
