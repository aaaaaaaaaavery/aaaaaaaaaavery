const axios = require('axios');
const admin = require('firebase-admin');

const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const LPGA_TOUR_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgv4aRqL4dKgbADnZNH1e_oR8rgnbGOY9roEzXNVas0C6nlkx3RggqK7RCq0Cl148yFD0DfxAxtK4q/pub?gid=0&single=true&output=csv';

function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
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

async function scrapeLPGATourStandings() {
  try {
    console.log('Fetching LPGA Tour standings from Google Sheets CSV...');
    const response = await axios.get(LPGA_TOUR_CSV_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const csvData = parseCSV(response.data);
    if (csvData.length === 0) {
      console.log('No LPGA Tour data found in CSV');
      return;
    }
    console.log(`Parsed ${csvData.length} LPGA Tour entries`);
    await saveToFirestore(csvData);
    console.log('✅ LPGA Tour standings successfully imported to Firestore');
  } catch (error) {
    console.error('❌ Error scraping LPGA Tour standings:', error.message);
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    const collectionRef = db.collection('LPGATourStandings');
    console.log('Clearing existing LPGA Tour data...');
    const existingDocs = await collectionRef.get();
    const batch = db.batch();
    existingDocs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Cleared ${existingDocs.size} existing documents`);
    
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
    
    await collectionRef.doc('data').set(csvData);
    console.log(`✅ Successfully saved ${standings.length} LPGA Tour entries to Firestore collection 'LPGATourStandings'`);
    console.log(`Headers: ${headers.join(', ')}`);
  } catch (error) {
    console.error('❌ Error saving LPGA Tour standings to Firestore:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await scrapeLPGATourStandings();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

