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

// F1 API endpoint for current driver championship
const F1_DRIVER_API = 'https://f1api.dev/api/current/drivers-championship';

async function scrapeF1DriverStandings() {
  try {
    console.log('Fetching F1 Driver standings from F1 API...');
    
    const response = await axios.get(F1_DRIVER_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const standings = [];
    const data = response.data;
    
    // F1 API returns { drivers_championship: [...] }
    if (data && data.drivers_championship && Array.isArray(data.drivers_championship)) {
      data.drivers_championship.forEach((entry) => {
        const driverName = entry.driver ? `${entry.driver.name} ${entry.driver.surname}`.trim() : '';
        // Simplify team names to match display format
        let teamName = entry.team ? entry.team.teamName : '';
        if (teamName) {
          // Remove common suffixes and prefixes
          teamName = teamName
            .replace(/^Scuderia /, '')           // Remove "Scuderia " prefix
            .replace(/ Formula 1 Team$/, '')    // Remove " Formula 1 Team" suffix
            .replace(/ Formula One Team$/, '')   // Remove " Formula One Team" suffix
            .replace(/ F1 Team$/, '')            // Remove " F1 Team" suffix
            .replace(/ Racing$/, '')             // Remove " Racing" suffix
            .trim();
        }
        const driverData = {
          Rank: entry.position || 0,
          Driver: driverName,
          Team: teamName,
          Points: entry.points || '0',
          Wins: entry.wins || '0',
          lastUpdated: new Date().toISOString()
        };
        
        standings.push(driverData);
        console.log(`  ${driverData.Rank}. ${driverData.Driver} (${driverData.Team}): ${driverData.Points} pts (${driverData.Wins} wins)`);
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
    standings.forEach((driver, index) => {
      driver.Rank = index + 1;
    });
    
    console.log(`\nScraped ${standings.length} drivers`);
    
    // Save to Firestore
    if (standings.length > 0) {
      await saveToFirestore(standings);
    } else {
      console.error('No standings data found. API structure may have changed.');
    }
    
    return standings;
    
  } catch (error) {
    console.error('Error scraping F1 Driver standings:', error.message);
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
    
    const collectionRef = db.collection('F1DriverStandings');
    
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
    
    for (const driver of standings) {
      const docRef = collectionRef.doc(driver.Driver.replace(/\s+/g, '_').replace(/[^\w_]/g, ''));
      writeBatch.set(docRef, {
        ...driver,
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
    
    console.log(`Successfully saved ${count} drivers to Firestore`);
    
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Run the scraper
async function main() {
  try {
    const standings = await scrapeF1DriverStandings();
    console.log('\n✅ F1 Driver standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update F1 Driver standings');
    process.exit(1);
  }
}

main();

