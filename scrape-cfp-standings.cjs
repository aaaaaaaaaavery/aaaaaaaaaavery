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

// Google Sheets CSV URL for CFP rankings
const CFP_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYKo1O2-4yDvnW6ZyX11vCDhvQE3fqx4bGGWkTgLthGXD4OOYJ_4BwxJ2YUQnP1M_vui8rAg2YrbCG/pub?gid=1770666144&single=true&output=csv';

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

async function scrapeCFPStandings() {
  try {
    console.log('Fetching CFP rankings from Google Sheets CSV...');
    
    const response = await axios.get(CFP_CSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const csvData = parseCSV(response.data);
    
    if (csvData.length === 0) {
      console.log('No CFP data found in CSV');
      return;
    }
    
    console.log(`Parsed ${csvData.length} CFP rankings`);
    
    // Save to Firestore
    await saveToFirestore(csvData);
    
    console.log('✅ CFP standings successfully imported to Firestore');
    
  } catch (error) {
    console.error('❌ Error scraping CFP standings:', error.message);
    throw error;
  }
}

async function saveToFirestore(rankings) {
  try {
    const collectionRef = db.collection('CFP');
    
    // Clear existing documents in the collection
    console.log('Clearing existing CFP data...');
    const existingDocs = await collectionRef.get();
    const batch = db.batch();
    existingDocs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cleared ${existingDocs.size} existing documents`);
    
    // Add new documents
    console.log('Adding new CFP rankings...');
    let writeBatch = db.batch();
    let docCount = 0;
    
    for (const ranking of rankings) {
      const docData = {
        Rk: ranking.Rk || ranking.Rank || '',
        Team: ranking.Team || '',
        Record: ranking.Record || '',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Use Rk as document ID for easy lookup
      const docId = ranking.Rk || ranking.Rank || `rank_${docCount + 1}`;
      const docRef = collectionRef.doc(docId);
      writeBatch.set(docRef, docData);
      docCount++;
      
      // Firestore batch limit is 500
      if (docCount % 500 === 0) {
        await writeBatch.commit();
        console.log(`Imported ${docCount} CFP rankings...`);
        writeBatch = db.batch(); // Create new batch after commit
      }
    }
    
    // Commit remaining documents
    if (docCount % 500 !== 0) {
      await writeBatch.commit();
    }
    
    console.log(`✅ Successfully saved ${docCount} CFP rankings to Firestore collection 'CFP'`);
    
  } catch (error) {
    console.error('❌ Error saving CFP standings to Firestore:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await scrapeCFPStandings();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

