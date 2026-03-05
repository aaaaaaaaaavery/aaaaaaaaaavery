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

// Google Sheets CSV URL for PGA Tour standings
const PGA_TOUR_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRh72gyQFguMGj0RkHvy-WrAH3EBpOMdikyKIjrOfSs5aAYYlE7NjbRJsBa7gkkJ4gV_nUUYSbCje2L/pub?gid=786471151&single=true&output=csv';

// Parse CSV text into array of objects
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

async function scrapePGATourStandings() {
  try {
    console.log('Fetching PGA Tour standings from Google Sheets CSV...');
    
    const response = await axios.get(PGA_TOUR_CSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const csvData = parseCSV(response.data);
    
    if (csvData.length === 0) {
      console.log('No PGA Tour data found in CSV');
      return;
    }
    
    console.log(`Parsed ${csvData.length} PGA Tour entries`);
    
    // Save to Firestore
    await saveToFirestore(csvData);
    
    console.log('✅ PGA Tour standings successfully imported to Firestore');
    
  } catch (error) {
    console.error('❌ Error scraping PGA Tour standings:', error.message);
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    const collectionRef = db.collection('PGATourStandings');
    
    // Clear existing documents
    console.log('Clearing existing PGA Tour data...');
    const existingDocs = await collectionRef.get();
    const batch = db.batch();
    existingDocs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Cleared ${existingDocs.size} existing documents`);
    
    // Get headers from first entry
    const headers = Object.keys(standings[0] || {});
    if (headers.length === 0) {
      console.log('No data to save');
      return;
    }
    
    // Store as CSV-compatible format: header row + data rows
    // Convert row arrays to objects (Firestore doesn't allow nested arrays)
    const csvData = {
      headers: headers,
      rows: standings.map(entry => {
        const rowArray = headers.map(header => entry[header] || '');
        // Convert array to object with numeric string keys
        const rowObject = {};
        rowArray.forEach((value, index) => {
          rowObject[index.toString()] = value;
        });
        return rowObject;
      }),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save as single document
    await collectionRef.doc('data').set(csvData);
    
    console.log(`✅ Successfully saved ${standings.length} PGA Tour entries to Firestore collection 'PGATourStandings'`);
    console.log(`Headers: ${headers.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error saving PGA Tour standings to Firestore:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await scrapePGATourStandings();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

