const axios = require('axios');
const admin = require('firebase-admin');

/**
 * Responsible Scraping Practices:
 * - Using F1 API Live public API
 * - Rate limited via scrape-all-standings.cjs (2 second delays between scrapers)
 * - Proper User-Agent header
 * - Single request per scraper execution
 * - Caching results in Firestore to minimize repeated requests
 */

// Initialize Firebase Admin (reuse existing credentials)
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// F1 API endpoint for current constructor championship
const F1_CONSTRUCTOR_API = 'https://f1api.dev/api/current/constructors-championship';

async function scrapeF1ConstructorStandings() {
  try {
    console.log('Fetching F1 Constructor standings from F1 API...');
    
    const response = await axios.get(F1_CONSTRUCTOR_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const standings = [];
    const data = response.data;
    
    // F1 API returns { constructors_championship: [...] }
    if (data && data.constructors_championship && Array.isArray(data.constructors_championship)) {
      data.constructors_championship.forEach((entry) => {
        // Simplify constructor names to match display format
        let constructorName = entry.team?.teamName || entry.constructor || '';
        if (constructorName) {
          // Remove common suffixes and prefixes
          constructorName = constructorName
            .replace(/^Scuderia /, '')           // Remove "Scuderia " prefix
            .replace(/ Formula 1 Team$/, '')    // Remove " Formula 1 Team" suffix
            .replace(/ Formula One Team$/, '')   // Remove " Formula One Team" suffix
            .replace(/ F1 Team$/, '')            // Remove " F1 Team" suffix
            .replace(/ Racing$/, '')             // Remove " Racing" suffix
            .trim();
        }
        const constructorData = {
          Rank: entry.position || 0,
          Constructor: constructorName,
          Points: entry.points || '0',
          Wins: entry.wins || '0',
          lastUpdated: new Date().toISOString()
        };
        
        standings.push(constructorData);
        console.log(`  ${constructorData.Rank}. ${constructorData.Constructor}: ${constructorData.Points} pts (${constructorData.Wins} wins)`);
      });
    } else {
      console.error('Unexpected API response structure:', JSON.stringify(data, null, 2).substring(0, 500));
    }
    
    // Sort by points descending (they should already be sorted, but just in case)
    standings.sort((a, b) => {
      const pointsA = parseInt(a.Points) || 0;
      const pointsB = parseInt(b.Points) || 0;
      return pointsB - pointsA;
    });
    
    // Re-assign ranks after sorting
    standings.forEach((constructor, index) => {
      constructor.Rank = index + 1;
    });
    
    console.log(`\nScraped ${standings.length} constructors`);
    
    // Save to Firestore
    if (standings.length > 0) {
      await saveToFirestore(standings);
    } else {
      console.error('No standings data found. API structure may have changed.');
    }
    
    return standings;
    
  } catch (error) {
    console.error('Error scraping F1 Constructor standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2).substring(0, 500));
    }
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('\nSaving to Firestore...');
    
    const collectionRef = db.collection('F1ConstructorStandings');
    
    // Clear existing data
    const snapshot = await collectionRef.get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('Cleared existing standings');
    
    // Add new data
    let writeBatch = db.batch();
    let count = 0;
    
    for (const constructor of standings) {
      const docRef = collectionRef.doc(constructor.Constructor.replace(/\s+/g, '_').replace(/[^\w_]/g, ''));
      writeBatch.set(docRef, {
        ...constructor,
        lastUpdated: new Date().toISOString()
      });
      count++;
      
      // Firestore batch limit is 500
      if (count % 500 === 0) {
        await writeBatch.commit();
        writeBatch = db.batch();
      }
    }
    
    // Commit remaining
    if (count % 500 !== 0) {
      await writeBatch.commit();
    }
    
    console.log(`Successfully saved ${count} constructors to Firestore`);
    
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Run the scraper
async function main() {
  try {
    const standings = await scrapeF1ConstructorStandings();
    console.log('\n✅ F1 Constructor standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update F1 Constructor standings');
    process.exit(1);
  }
}

main();

