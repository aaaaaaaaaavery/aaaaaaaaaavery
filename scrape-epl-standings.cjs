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

// ESPN's API endpoint for English Premier League standings
const ESPN_EPL_API = 'https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings';

async function scrapeEPLStandings() {
  try {
    console.log('Fetching EPL standings from ESPN API...');
    
    const response = await axios.get(ESPN_EPL_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const standings = [];
    const data = response.data;
    
    // ESPN API returns standings organized by league
    if (data && data.children) {
      for (const league of data.children) {
        const leagueName = league.name;
        
        if (league.standings && league.standings.entries) {
          for (const entry of league.standings.entries) {
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
              Rank: getStatValue(10),        // index 10 is rank
              Team: shortName,              // e.g., "Arsenal" not "Arsenal FC"
              FullName: teamName,
              Points: getStatValue(3),       // index 3 is points
              MP: getStatValue(0),          // index 0 is matches played
              Wins: getStatValue(7),        // index 7 is wins
              Draws: getStatValue(6),       // index 6 is ties/draws
              Losses: getStatValue(1),      // index 1 is losses
              lastUpdated: new Date().toISOString()
            };
            
            standings.push(teamData);
            console.log(`  ${teamData.Rank}. ${teamData.Team}: ${teamData.Points} pts (${teamData.Wins}-${teamData.Draws}-${teamData.Losses})`);
          }
        }
      }
      
      // Sort standings by rank (they should already be sorted, but just in case)
      standings.sort((a, b) => {
        const rankA = parseInt(a.Rank) || 0;
        const rankB = parseInt(b.Rank) || 0;
        return rankA - rankB;
      });
      
      // Log standings
      console.log('\nPremier League Standings:');
      standings.forEach(team => {
        console.log(`${team.Rank}. ${team.Team}: ${team.Points} pts (${team.MP} MP, ${team.Wins}W-${team.Draws}D-${team.Losses}L)`);
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
    console.error('Error scraping EPL standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('\nSaving to Firestore...');
    
    const collectionRef = db.collection('EPLStandings');
    
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
    
    // Clear cache for this league (if running in browser context)
    if (typeof localStorage !== 'undefined') {
      const cacheKey = `standings_cache_PremierLeague`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Cleared Premier League standings cache');
    }
    
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Run the scraper
async function main() {
  try {
    const standings = await scrapeEPLStandings();
    console.log('\n✅ EPL standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update EPL standings');
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { scrapeEPLStandings };

// Run if called directly
if (require.main === module) {
  main();
}
