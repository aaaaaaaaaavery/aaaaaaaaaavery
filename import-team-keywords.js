// import-team-keywords.js
// Imports team keywords from Google Sheets and stores in Firestore
// Sheet structure: Each league is a tab, each team is a column, keywords are in rows

import { google } from 'googleapis';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
// Support both service account key file (local) and application default credentials (Cloud Run)
let firebaseCredential;
let serviceAccountKeyPath = process.env.SERVICE_ACCOUNT_KEY_PATH;

// Check for service-account-key.json in current directory if not specified
if (!serviceAccountKeyPath) {
  const defaultPath = join(__dirname, 'service-account-key.json');
  if (existsSync(defaultPath)) {
    serviceAccountKeyPath = defaultPath;
  }
}

if (serviceAccountKeyPath && existsSync(serviceAccountKeyPath)) {
  // Use service account key file
  console.log(`📁 Using service account key: ${serviceAccountKeyPath}`);
  const serviceAccount = JSON.parse(readFileSync(serviceAccountKeyPath, 'utf8'));
  firebaseCredential = admin.credential.cert(serviceAccount);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Use service account key file from environment variable
  firebaseCredential = admin.credential.applicationDefault();
} else {
  // Try to use application default credentials (works on Cloud Run or if gcloud auth is set up)
  try {
    firebaseCredential = admin.credential.applicationDefault();
  } catch (error) {
    console.error('❌ No credentials found. Please either:');
    console.error('   1. Place service-account-key.json in the same directory as this script');
    console.error('   2. Set SERVICE_ACCOUNT_KEY_PATH environment variable to path of service account key JSON file');
    console.error('   3. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.error('   4. Run: gcloud auth application-default login');
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: firebaseCredential,
    projectId: process.env.FIREBASE_PROJECT_ID || 'flashlive-daily-scraper'
  });
}

const db = admin.firestore();

// Google Sheets configuration
const KEYWORDS_SPREADSHEET_ID = process.env.KEYWORDS_SPREADSHEET_ID || '1ZrQzGf6jmheBDsOmDDXvD7djDiVaryqJC0KQICp_UdI';
const LEAGUES_TO_IMPORT = ['NHL', 'NFL', 'NBA', 'MLB', 'WNBA', 'MLS', 'NCAA', 'NCAAF', 'NCAAM', 'NCAAW']; // Add all your leagues

let sheets;
async function authenticateGoogleSheets() {
  if (sheets) return sheets;
  
  let authClient;
  
  // Use the same service account key file that was used for Firebase
  if (serviceAccountKeyPath && existsSync(serviceAccountKeyPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountKeyPath, 'utf8'));
    authClient = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Use credentials from environment variable
    authClient = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else {
    // Try application default credentials (works on Cloud Run)
    try {
      authClient = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } catch (error) {
      console.error('❌ Google Sheets authentication failed. Please either:');
      console.error('   1. Place service-account-key.json in the same directory as this script');
      console.error('   2. Set SERVICE_ACCOUNT_KEY_PATH environment variable to path of service account key JSON file');
      console.error('   3. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
      console.error('   4. Run: gcloud auth application-default login');
      throw error;
    }
  }
  
  const client = await authClient.getClient();
  sheets = google.sheets({ version: 'v4', auth: client });
  console.log('✅ Google Sheets API authenticated.');
  return sheets;
}

/**
 * Import keywords for a single league
 */
async function importLeagueKeywords(leagueName) {
  try {
    console.log(`\n📋 Importing keywords for league: ${leagueName}`);
    
    // Get the sheet data for this league tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: KEYWORDS_SPREADSHEET_ID,
      range: `${leagueName}!A:ZZ`, // Get all columns (A to ZZ)
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.log(`  ⚠️  No data found in sheet "${leagueName}"`);
      return;
    }
    
    // First row contains team names (column headers)
    const teamNames = rows[0] || [];
    console.log(`  Found ${teamNames.length} team columns`);
    
    // Process each team column
    for (let colIndex = 0; colIndex < teamNames.length; colIndex++) {
      const teamName = teamNames[colIndex];
      if (!teamName || teamName.trim() === '') continue;
      
      // Extract keywords from this column (skip header row)
      const keywords = [];
      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const keyword = rows[rowIndex]?.[colIndex];
        if (keyword && keyword.trim() !== '') {
          keywords.push(keyword.trim());
        }
      }
      
      if (keywords.length === 0) {
        console.log(`  ⚠️  No keywords found for team: ${teamName}`);
        continue;
      }
      
      // Store in Firestore: teamKeywords/{league}/{teamName}
      const teamRef = db.collection('teamKeywords').doc(leagueName).collection('teams').doc(teamName);
      await teamRef.set({
        league: leagueName,
        teamName: teamName,
        keywords: keywords,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log(`  ✅ ${teamName}: ${keywords.length} keywords imported`);
    }
    
    console.log(`  ✅ Completed importing ${leagueName} keywords`);
    
  } catch (error) {
    if (error.code === 400 && error.message.includes('Unable to parse range')) {
      console.log(`  ⚠️  Sheet "${leagueName}" does not exist - skipping`);
    } else {
      console.error(`  ❌ Error importing ${leagueName}:`, error.message);
    }
  }
}

/**
 * Get all keywords for a team (for use in frontend)
 */
async function getTeamKeywords(league, teamName) {
  try {
    const teamRef = db.collection('teamKeywords').doc(league).collection('teams').doc(teamName);
    const doc = await teamRef.get();
    
    if (!doc.exists) {
      return [];
    }
    
    return doc.data().keywords || [];
  } catch (error) {
    console.error(`Error getting keywords for ${league}/${teamName}:`, error);
    return [];
  }
}

/**
 * Main import function
 */
async function importAllKeywords() {
  try {
    console.log('🚀 Starting team keywords import...');
    console.log(`📊 Spreadsheet ID: ${KEYWORDS_SPREADSHEET_ID}`);
    
    await authenticateGoogleSheets();
    
    // Import keywords for each league
    for (const league of LEAGUES_TO_IMPORT) {
      await importLeagueKeywords(league);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n✅ Keywords import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Keywords import failed:', error);
    process.exit(1);
  }
}

// Run if called directly (for Node.js script execution)
// This allows running: node import-team-keywords.js
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMainModule || process.argv[1]?.endsWith('import-team-keywords.js')) {
  importAllKeywords();
}

export { importAllKeywords, getTeamKeywords };

