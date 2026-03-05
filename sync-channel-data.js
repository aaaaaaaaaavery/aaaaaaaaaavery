const { google } = require('googleapis');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Google Sheets configuration
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace with your Google Sheet ID
const SHEET_NAME = 'Channels'; // Name of the sheet tab with channel data
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Firestore collection path
const FIRESTORE_COLLECTION = 'artifacts/flashlive-daily-scraper/public/data/sportsGames';

/**
 * Authenticate with Google Sheets API
 */
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: SCOPES,
  });
  return await auth.getClient();
}

/**
 * Read channel data from Google Sheets
 * Expected columns: Date, Time, Home Team, Away Team, Channel
 */
async function readChannelData() {
  try {
    const authClient = await authenticate();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:E`, // Adjust range based on your columns
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in sheet.');
      return [];
    }

    // First row is headers
    const headers = rows[0];
    console.log('Headers:', headers);

    // Parse data rows
    const channelData = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 5) continue; // Skip incomplete rows

      channelData.push({
        date: row[0]?.trim(),
        time: row[1]?.trim(),
        homeTeam: row[2]?.trim(),
        awayTeam: row[3]?.trim(),
        channel: row[4]?.trim()
      });
    }

    console.log(`Read ${channelData.length} channel entries from Google Sheets`);
    return channelData;
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    throw error;
  }
}

/**
 * Normalize team names for matching
 */
function normalizeTeamName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

/**
 * Convert date format from "October 8" to "2025-10-08"
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    const year = new Date().getFullYear();
    const date = new Date(`${dateStr}, ${year}`);
    
    if (isNaN(date.getTime())) return null;
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
}

/**
 * Update Firestore documents with channel information
 */
async function updateFirestoreWithChannels(channelData) {
  try {
    const gamesRef = db.collection(FIRESTORE_COLLECTION);
    
    let updatedCount = 0;
    let notFoundCount = 0;

    for (const entry of channelData) {
      const parsedDate = parseDate(entry.date);
      if (!parsedDate) {
        console.log(`Skipping entry with invalid date: ${entry.date}`);
        continue;
      }

      // Query Firestore for matching game
      // You can adjust the query based on how your data is structured
      const snapshot = await gamesRef
        .where('gameDate', '==', parsedDate)
        .get();

      if (snapshot.empty) {
        console.log(`No game found for date ${parsedDate}`);
        notFoundCount++;
        continue;
      }

      // Find matching game by team names
      let matchFound = false;
      const normalizedHome = normalizeTeamName(entry.homeTeam);
      const normalizedAway = normalizeTeamName(entry.awayTeam);

      for (const doc of snapshot.docs) {
        const gameData = doc.data();
        const gameHome = normalizeTeamName(gameData.Home);
        const gameAway = normalizeTeamName(gameData.Away);

        // Check if teams match
        if (gameHome.includes(normalizedHome) || normalizedHome.includes(gameHome)) {
          if (gameAway.includes(normalizedAway) || normalizedAway.includes(gameAway)) {
            // Match found - update with channel
            await doc.ref.update({
              channel: entry.channel,
              channelUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Updated: ${entry.awayTeam} @ ${entry.homeTeam} - Channel: ${entry.channel}`);
            updatedCount++;
            matchFound = true;
            break;
          }
        }
      }

      if (!matchFound) {
        console.log(`❌ No match found: ${entry.awayTeam} @ ${entry.homeTeam} on ${entry.date}`);
        notFoundCount++;
      }
    }

    console.log('\n=== Sync Complete ===');
    console.log(`Updated: ${updatedCount} games`);
    console.log(`Not found: ${notFoundCount} games`);
    
  } catch (error) {
    console.error('Error updating Firestore:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting channel data sync...\n');
    
    // Read channel data from Google Sheets
    const channelData = await readChannelData();
    
    if (channelData.length === 0) {
      console.log('No channel data to sync.');
      return;
    }

    // Update Firestore with channel information
    await updateFirestoreWithChannels(channelData);
    
    console.log('\nSync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

// Run the script
main();
