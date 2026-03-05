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

// ESPN's hidden API endpoint for NFL standings
const ESPN_NFL_API = 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings';

async function scrapeNFLStandings() {
  try {
    console.log('Fetching NFL standings from ESPN API...');
    
    const response = await axios.get(ESPN_NFL_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const standings = [];
    const data = response.data;
    
    // ESPN API returns standings organized by conferences/divisions
    if (data && data.children) {
      for (const conference of data.children) {
        const conferenceName = conference.name; // AFC or NFC
        console.log(`\nProcessing: ${conferenceName}`);
        
        if (conference.standings && conference.standings.entries) {
          for (const entry of conference.standings.entries) {
            const team = entry.team;
            const stats = entry.stats;
            
            // Extract team name
            const teamName = team.displayName || team.name;
            
            // Extract stats - ESPN API provides stats as array
            const getStatValue = (statIndex) => {
              return stats[statIndex] ? stats[statIndex].displayValue : '0';
            };
            
            const teamData = {
              Team: teamName,
              Conference: conferenceName,
              Division: team.divisionName || '',
              Wins: getStatValue(10),        // index 10 is wins
              Losses: getStatValue(2),       // index 2 is losses
              Ties: getStatValue(8),         // index 8 is ties
              WinPercentage: getStatValue(9), // index 9 is win %
              PointsFor: getStatValue(6),    // index 6 is points for
              PointsAgainst: getStatValue(5), // index 5 is points against
              PointsDiff: getStatValue(4),   // index 4 is point differential
              Streak: getStatValue(7) || '-', // index 7 is streak
              HomeRecord: getStatValue(16) || '-',  // index 16 is home record
              RoadRecord: getStatValue(17) || '-',  // index 17 is road record
              DivisionRecord: getStatValue(12) || '-', // index 12 is division record
              ConferenceRecord: getStatValue(19) || '-', // index 19 is conference record
              lastUpdated: new Date().toISOString()
            };
            
            standings.push(teamData);
            console.log(`  ${teamData.Team}: ${teamData.Wins}-${teamData.Losses}-${teamData.Ties} (${teamData.Division})`);
          }
        }
      }
    }
    
    console.log(`\nScraped ${standings.length} teams`);
    
    // Save to Firestore
    if (standings.length > 0) {
      await saveToFirestore(standings);
    } else {
      console.error('No standings data found. API structure may have changed.');
    }
    
    return standings;
    
  } catch (error) {
    console.error('Error scraping NFL standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('\nSaving to Firestore...');
    
    const collectionRef = db.collection('NFLStandings');
    
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
    
    for (const team of standings) {
      const docRef = collectionRef.doc(team.Team.replace(/\s+/g, '_'));
      writeBatch.set(docRef, team);
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
    
    console.log(`Successfully saved ${count} teams to Firestore`);
    
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Run the scraper
async function main() {
  try {
    const standings = await scrapeNFLStandings();
    console.log('\n✅ NFL standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update NFL standings');
    process.exit(1);
  }
}

main();

