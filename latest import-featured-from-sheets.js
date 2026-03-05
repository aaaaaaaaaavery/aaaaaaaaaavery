How to run it:

In terminal folder Copy of THPORTHINDEX run

Manual trigger:

gcloud scheduler jobs run import-featured-games --location=us-central1 --project=flashlive-daily-scraper 







Latest import-featured-from-sheets.js

const { google } = require('googleapis');
const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Google Sheets configuration for Featured Games
const FEATURED_SHEET_ID = '1ZZWtajq2QQBzwKVBHbJ_0Sgr4UvjQZDFXHa2Jr6uHG4';
const FEATURED_SHEET_NAME = 'Featured Games';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: SCOPES
  });
  
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

const FEATURED_FIELD_NAMES = ['Featured', 'featured', 'Featured ID', 'featuredId'];

async function readFeaturedGamesFromSheet() {
  console.log('Reading Featured Games from Google Sheets...');
  
  const sheets = await authenticateGoogleSheets();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: FEATURED_SHEET_ID,
    range: `${FEATURED_SHEET_NAME}!A:C` // Date, Game ID, and Title columns
  });
  
  const rows = response.data.values || [];
  console.log(`Found ${rows.length} rows in Featured Games sheet`);
  
  if (rows.length < 2) {
    console.log('No featured games data found (less than 2 rows including header)');
    return [];
  }
  
  const featuredGames = [];
  const headerRow = rows[0];
  console.log('Header row:', headerRow);
  
  // Process data rows (skip header)
  let currentTitle = ''; // Track the current title to apply to subsequent rows
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 2 && row[0] && row[1]) { // Date and Game ID must be present
      const dateStr = row[0];
      const gameId = row[1];
      
      // If this row has a title, update currentTitle, otherwise keep using the last title
      if (row[2] && row[2].trim()) {
        currentTitle = row[2].trim();
      }
      
      console.log(`Processing featured game: Date=${dateStr}, GameID=${gameId}, Title=${currentTitle}`);
      
      // Convert MM/DD/YYYY to ISO format
      let isoDate;
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        isoDate = dateStr; // Already in ISO format
      }
      
      featuredGames.push({
        date: isoDate,
        gameId: gameId,
        title: currentTitle,
        originalDate: dateStr,
        order: i - 1 // Preserve the order from Google Sheets (0-based index)
      });
    }
  }
  
  console.log(`Processed ${featuredGames.length} featured games`);
  return featuredGames;
}

async function fetchGameDataFromFirestore(gameId, targetDate) {
  console.log(`Fetching game data for GameID: ${gameId}, Date: ${targetDate}`);

  const normalizedGameId = String(gameId).trim();
  
  async function findGameByIdentifiers(collectionRef, collectionName) {
    let snapshot = await collectionRef.where('Game ID', '==', normalizedGameId).limit(1).get();
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      console.log(`Found game in ${collectionName} via Game ID match: ${data['Home Team']} vs ${data['Away Team']}`);
      return data;
    }
    
    for (const fieldName of FEATURED_FIELD_NAMES) {
      snapshot = await collectionRef.where(fieldName, '==', normalizedGameId).limit(1).get();
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        console.log(`Found game in ${collectionName} via "${fieldName}" match for Featured ID ${normalizedGameId}`);
        return data;
      }
    }
    
    return null;
  }
  
  // Try to find the game in sportsGames collection first (for live games)
  const sportsGamesRef = db.collection('artifacts/flashlive-daily-scraper/public/data/sportsGames');
  const sportsGameData = await findGameByIdentifiers(sportsGamesRef, 'sportsGames');
  if (sportsGameData) {
    return { ...sportsGameData, isFeatured: true };
  }
  
  // If not found in sportsGames, try yesterdayScores collection (for completed games)
  const yesterdayScoresRef = db.collection('artifacts/flashlive-daily-scraper/public/data/yesterdayScores');
  const yesterdayGameData = await findGameByIdentifiers(yesterdayScoresRef, 'yesterdayScores');
  if (yesterdayGameData) {
    return { ...yesterdayGameData, isFeatured: true };
  }
  
  console.log(`Game not found in Firestore for GameID: ${gameId}`);
  return null;
}

async function writeFeaturedGamesToFirestore(featuredGamesData) {
  console.log(`Writing ${featuredGamesData.length} featured games to Firestore...`);
  
  const featuredRef = db.collection('artifacts/flashlive-daily-scraper/public/data/Featured');
  
  // Only clear featured games that are 2+ days old (keep today's and yesterday's)
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const existingSnapshot = await featuredRef.get();
  if (!existingSnapshot.empty) {
    const batch = db.batch();
    let deletedCount = 0;
    
    existingSnapshot.docs.forEach(doc => {
      const gameData = doc.data();
      const gameDate = gameData.gameDate || gameData.date;
      
      // Delete if game is 2+ days old
      if (gameDate && gameDate < twoDaysAgoStr) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`Cleared ${deletedCount} featured games that are 2+ days old (keeping today's and yesterday's)`);
    } else {
      console.log('No old featured games to clear');
    }
  }
  
  // Write new featured games
  const batch = db.batch();
  featuredGamesData.forEach((gameData, index) => {
    const docRef = featuredRef.doc(`${gameData.date}_${gameData['Game ID']}`);
    batch.set(docRef, gameData);
  });
  
  await batch.commit();
  console.log(`Successfully wrote ${featuredGamesData.length} featured games to Featured collection`);
}

async function importFeaturedGames() {
  try {
    console.log('=== Starting Featured Games Import ===');
    
    // Step 1: Read featured games from Google Sheet
    const featuredGames = await readFeaturedGamesFromSheet();
    
    if (featuredGames.length === 0) {
      console.log('No featured games to process');
      return;
    }
    
    // Step 2: Fetch game data from Firestore for each featured game
    const featuredGamesData = [];
    
    for (const featuredGame of featuredGames) {
      const gameData = await fetchGameDataFromFirestore(featuredGame.gameId, featuredGame.date);
      if (gameData) {
        // Add the title and order from the Featured Games sheet
        gameData.title = featuredGame.title || '';
        gameData.order = featuredGame.order;
        featuredGamesData.push(gameData);
      } else {
        console.log(`⚠️ Could not find game data for GameID: ${featuredGame.gameId}`);
      }
    }
    
    console.log(`Found game data for ${featuredGamesData.length} out of ${featuredGames.length} featured games`);
    
    // Step 3: Write to Featured collection in Firestore
    if (featuredGamesData.length > 0) {
      await writeFeaturedGamesToFirestore(featuredGamesData);
    }
    
    console.log('=== Featured Games Import Complete ===');
    
  } catch (error) {
    console.error('Error importing featured games:', error);
    throw error;
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importFeaturedGames()
    .then(() => {
      console.log('Featured games import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Featured games import failed:', error);
      process.exit(1);
    });
}

module.exports = { importFeaturedGames };
