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

// ESPN's API endpoint for Liga MX standings
const ESPN_LIGAMX_API = 'https://site.api.espn.com/apis/v2/sports/soccer/mex.1/standings';

async function scrapeLigaMXStandings() {
  try {
    console.log('Fetching Liga MX standings from ESPN API...');
    
    const response = await axios.get(ESPN_LIGAMX_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const standings = [];
    const data = response.data;
    
    // ESPN API returns standings organized by groups/conferences
    if (data && data.children) {
      for (const group of data.children) {
        if (group.standings && group.standings.entries) {
          for (const entry of group.standings.entries) {
            const team = entry.team;
            const stats = entry.stats;
            
            // Extract team name
            const teamName = team.displayName || team.name;
            const shortName = team.shortDisplayName || team.name;
            
            // Extract stats - ESPN API provides stats as array
            const getStatValue = (statIndex) => {
              return stats[statIndex] ? stats[statIndex].displayValue : '0';
            };
            
            const teamData = {
              Team: shortName,
              Points: getStatValue(3) || '0',      // Points
              MP: getStatValue(0) || '0',          // Matches Played (GP)
              Wins: getStatValue(7) || '0',        // Wins
              Draws: getStatValue(6) || '0',       // Draws (Ties)
              Losses: getStatValue(1) || '0',      // Losses
              lastUpdated: new Date().toISOString()
            };
            
            standings.push(teamData);
            console.log(`  ${teamData.Team}: ${teamData.Points} pts | MP: ${teamData.MP} | W: ${teamData.Wins}, D: ${teamData.Draws}, L: ${teamData.Losses}`);
          }
        }
      }
      
      // Sort standings by points (descending), then by wins
      standings.sort((a, b) => {
        const pointsA = parseInt(a.Points) || 0;
        const pointsB = parseInt(b.Points) || 0;
        if (pointsA !== pointsB) {
          return pointsB - pointsA;
        }
        const winsA = parseInt(a.Wins) || 0;
        const winsB = parseInt(b.Wins) || 0;
        return winsB - winsA;
      });
      
      // Add rank to each team
      standings.forEach((team, index) => {
        team.Rank = index + 1;
      });
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
    console.error('Error scraping Liga MX standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('\nSaving to Firestore...');
    
    const collectionRef = db.collection('LigaMXStandings');
    
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
      writeBatch.set(docRef, {
        ...team,
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
    
    console.log(`Successfully saved ${count} teams to Firestore`);
    
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Run the scraper
async function main() {
  try {
    const standings = await scrapeLigaMXStandings();
    console.log('\n✅ Liga MX standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update Liga MX standings');
    process.exit(1);
  }
}

main();

