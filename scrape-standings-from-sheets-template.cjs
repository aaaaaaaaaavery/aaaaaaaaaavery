const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin (reuse existing credentials)
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const LEAGUE_NAME = 'LEAGUE_NAME_HERE'; // e.g., 'PGA Tour', 'UFC', 'Boxing'
const COLLECTION_NAME = 'COLLECTION_NAME_HERE'; // e.g., 'PGATourStandings', 'UFCStandings', 'BoxingStandings'
const GOOGLE_SHEETS_CSV_URL = 'YOUR_GOOGLE_SHEETS_CSV_URL_HERE';

// ============================================
// CSV PARSING
// ============================================
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    return [];
  }
  
  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length === 0 || values[0] === '') continue;
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
}

// ============================================
// DATA TRANSFORMATION (CUSTOMIZE AS NEEDED)
// ============================================
function transformStandingsData(csvData) {
  // This function transforms the CSV data into the format you want in Firestore
  // Customize based on your Google Sheets column structure
  
  return csvData.map((row, index) => {
    // Example transformation - adjust based on your actual CSV columns
    return {
      Rank: row.Rank || row.Rk || (index + 1).toString(),
      Team: row.Team || row.Name || row.Player || row.Athlete || '',
      Points: row.Points || row.Pts || row.Score || '',
      // Add other fields from your CSV as needed
      // Wins: row.Wins || '',
      // Losses: row.Losses || '',
      // ... etc
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
  });
}

// ============================================
// SCRAPER FUNCTION
// ============================================
async function scrapeStandings() {
  try {
    console.log(`Fetching ${LEAGUE_NAME} standings from Google Sheets CSV...`);
    
    const response = await axios.get(GOOGLE_SHEETS_CSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const csvData = parseCSV(response.data);
    
    if (csvData.length === 0) {
      console.log(`No ${LEAGUE_NAME} data found in CSV`);
      return;
    }
    
    console.log(`Parsed ${csvData.length} ${LEAGUE_NAME} entries`);
    
    // Transform data if needed
    const transformedData = transformStandingsData(csvData);
    
    // Save to Firestore
    await saveToFirestore(transformedData);
    
    console.log(`✅ ${LEAGUE_NAME} standings successfully imported to Firestore`);
    
  } catch (error) {
    console.error(`❌ Error scraping ${LEAGUE_NAME} standings:`, error.message);
    throw error;
  }
}

// ============================================
// FIRESTORE SAVE FUNCTION
// ============================================
async function saveToFirestore(standings) {
  try {
    const collectionRef = db.collection(COLLECTION_NAME);
    
    // Clear existing documents in the collection
    console.log(`Clearing existing ${LEAGUE_NAME} data...`);
    const existingDocs = await collectionRef.get();
    const batch = db.batch();
    existingDocs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cleared ${existingDocs.size} existing documents`);
    
    // Add new documents
    console.log(`Adding new ${LEAGUE_NAME} standings...`);
    let writeBatch = db.batch();
    let docCount = 0;
    
    for (const entry of standings) {
      // Use Rank as document ID, or generate one if not available
      const docId = entry.Rank || `entry_${docCount + 1}`;
      const docRef = collectionRef.doc(docId);
      writeBatch.set(docRef, entry);
      docCount++;
      
      // Firestore batch limit is 500
      if (docCount % 500 === 0) {
        await writeBatch.commit();
        console.log(`Imported ${docCount} ${LEAGUE_NAME} entries...`);
        writeBatch = db.batch(); // Create new batch after commit
      }
    }
    
    // Commit remaining documents
    if (docCount % 500 !== 0) {
      await writeBatch.commit();
    }
    
    console.log(`✅ Successfully saved ${docCount} ${LEAGUE_NAME} entries to Firestore collection '${COLLECTION_NAME}'`);
    
  } catch (error) {
    console.error(`❌ Error saving ${LEAGUE_NAME} standings to Firestore:`, error.message);
    throw error;
  }
}

// ============================================
// MAIN FUNCTION
// ============================================
async function main() {
  try {
    await scrapeStandings();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

