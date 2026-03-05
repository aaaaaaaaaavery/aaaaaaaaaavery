const axios = require('axios');
const admin = require('firebase-admin');

const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const BOXING_MEN_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRthmvN_N-bKFQdsc5V_Otx92FF5qwjYkI9YXHoKgKyV5jvfmb6skABo0Ncbh1x0ehEU-4Je3w_KPmb/pub?gid=1100984840&single=true&output=csv';
const BOXING_WOMEN_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRthmvN_N-bKFQdsc5V_Otx92FF5qwjYkI9YXHoKgKyV5jvfmb6skABo0Ncbh1x0ehEU-4Je3w_KPmb/pub?gid=0&single=true&output=csv';

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

async function scrapeBoxingStandings() {
  try {
    console.log('Fetching Boxing men\'s standings from Google Sheets CSV...');
    const menResponse = await axios.get(BOXING_MEN_CSV_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const menData = parseCSV(menResponse.data);
    if (menData.length === 0) {
      console.log('No Boxing men\'s data found in CSV');
    } else {
      console.log(`Parsed ${menData.length} Boxing men's entries`);
      await saveToFirestore(menData, 'data');
      console.log('✅ Boxing men\'s standings successfully imported to Firestore');
    }

    console.log('Fetching Boxing women\'s standings from Google Sheets CSV...');
    const womenResponse = await axios.get(BOXING_WOMEN_CSV_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const womenData = parseCSV(womenResponse.data);
    if (womenData.length === 0) {
      console.log('No Boxing women\'s data found in CSV');
    } else {
      console.log(`Parsed ${womenData.length} Boxing women's entries`);
      await saveToFirestore(womenData, 'data-women');
      console.log('✅ Boxing women\'s standings successfully imported to Firestore');
    }
  } catch (error) {
    console.error('❌ Error scraping Boxing standings:', error.message);
    throw error;
  }
}

async function saveToFirestore(standings, docName) {
  try {
    const collectionRef = db.collection('BoxingStandings');
    
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
    
    await collectionRef.doc(docName).set(csvData);
    console.log(`✅ Successfully saved ${standings.length} Boxing entries to Firestore collection 'BoxingStandings' document '${docName}'`);
    console.log(`Headers: ${headers.join(', ')}`);
  } catch (error) {
    console.error(`❌ Error saving Boxing standings to Firestore (${docName}):`, error.message);
    throw error;
  }
}

async function main() {
  try {
    await scrapeBoxingStandings();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

