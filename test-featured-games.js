const admin = require('firebase-admin');
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

// Initialize Firebase
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testFeaturedGames() {
  console.log('=== TESTING FEATURED GAMES ===');
  
  try {
    // Test Google Sheets API
    console.log('1. Testing Google Sheets API...');
    const auth = new GoogleAuth({
      keyFile: './service-account-key.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const featuredSheetId = '1ZZWtajq2QQBzwKVBHbJ_0Sgr4UvjQZDFXHa2Jr6uHG4';
    const sheetName = 'Featured Games';
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: featuredSheetId,
      range: `${sheetName}!A:C`
    });
    
    const rows = response.data.values || [];
    console.log('✅ Google Sheets API working');
    console.log('Total rows:', rows.length);
    
    if (rows.length > 0) {
      console.log('Header:', rows[0]);
      if (rows.length > 1) {
        console.log('First data row:', rows[1]);
      }
    }
    
    // Test date conversion
    console.log('\n2. Testing date conversion...');
    const testDate = '10/11/2025';
    const [month, day, year] = testDate.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log(`Converted ${testDate} to ${isoDate}`);
    
    // Test Firestore query
    console.log('\n3. Testing Firestore query...');
    const sportsGamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
    const snapshot = await sportsGamesRef.where('gameDate', '==', isoDate).limit(5).get();
    
    console.log(`Found ${snapshot.size} games for date ${isoDate}`);
    if (snapshot.size > 0) {
      console.log('Sample games:');
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. Game ID: ${data['Game ID']}, League: ${data.League}, Teams: ${data['Away Team']} vs ${data['Home Team']}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

testFeaturedGames();
