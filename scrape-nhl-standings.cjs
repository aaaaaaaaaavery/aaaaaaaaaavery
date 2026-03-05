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

// ESPN's API endpoint for NHL standings
const ESPN_NHL_API = 'https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings';

// NHL Division mappings
const TEAM_DIVISIONS = {
  // Atlantic Division
  'Tampa Bay Lightning': 'Atlantic Division',
  'Toronto Maple Leafs': 'Atlantic Division',
  'Boston Bruins': 'Atlantic Division',
  'Florida Panthers': 'Atlantic Division',
  'Buffalo Sabres': 'Atlantic Division',
  'Detroit Red Wings': 'Atlantic Division',
  'Ottawa Senators': 'Atlantic Division',
  'Montreal Canadiens': 'Atlantic Division',
  
  // Metropolitan Division
  'Carolina Hurricanes': 'Metropolitan Division',
  'New Jersey Devils': 'Metropolitan Division',
  'New York Rangers': 'Metropolitan Division',
  'New York Islanders': 'Metropolitan Division',
  'Washington Capitals': 'Metropolitan Division',
  'Pittsburgh Penguins': 'Metropolitan Division',
  'Philadelphia Flyers': 'Metropolitan Division',
  'Columbus Blue Jackets': 'Metropolitan Division',
  
  // Central Division
  'Colorado Avalanche': 'Central Division',
  'Dallas Stars': 'Central Division',
  'Minnesota Wild': 'Central Division',
  'Winnipeg Jets': 'Central Division',
  'St. Louis Blues': 'Central Division',
  'Nashville Predators': 'Central Division',
  'Arizona Coyotes': 'Central Division',
  'Chicago Blackhawks': 'Central Division',
  'Utah Hockey Club': 'Central Division',
  'Utah Mammoth': 'Central Division',
  
  // Pacific Division
  'Vegas Golden Knights': 'Pacific Division',
  'Edmonton Oilers': 'Pacific Division',
  'Los Angeles Kings': 'Pacific Division',
  'Vancouver Canucks': 'Pacific Division',
  'Seattle Kraken': 'Pacific Division',
  'Calgary Flames': 'Pacific Division',
  'Anaheim Ducks': 'Pacific Division',
  'San Jose Sharks': 'Pacific Division'
};

async function scrapeNHLStandings() {
  try {
    console.log('Fetching NHL standings from ESPN API...');
    
    const response = await axios.get(ESPN_NHL_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const standings = [];
    const data = response.data;
    
    // ESPN API returns standings organized by conferences
    if (data && data.children) {
      for (const conference of data.children) {
        const conferenceName = conference.name;
        
        if (conference.standings && conference.standings.entries) {
          for (const entry of conference.standings.entries) {
            const team = entry.team;
            const stats = entry.stats;
            
            // Extract team name
            const teamName = team.displayName || team.name;
            const mascotName = team.shortDisplayName || team.name;
            
            // Get division from mapping
            const divisionName = TEAM_DIVISIONS[teamName] || '';
            
            // Extract stats - ESPN API provides stats as array
            const getStatValue = (statIndex) => {
              return stats[statIndex] ? stats[statIndex].displayValue : '0';
            };
            
            const teamData = {
              Team: mascotName,  // e.g., "Lightning" instead of "Tampa Bay Lightning"
              FullName: teamName,
              Conference: conferenceName,
              Division: divisionName,
              Points: getStatValue(7),   // index 7 is points
              GP: getStatValue(3),       // index 3 is games played
              Wins: getStatValue(11),    // index 11 is wins
              Losses: getStatValue(4),   // index 4 is losses
              OTL: getStatValue(12),     // index 12 is overtime losses
              lastUpdated: new Date().toISOString()
            };
            
            standings.push(teamData);
            console.log(`  ${teamData.Team}: ${teamData.Points} pts (${teamData.Wins}-${teamData.Losses}-${teamData.OTL}) - ${teamData.Division}`);
          }
        }
      }
      
      // Sort standings by conference, then by division, then by points (descending)
      standings.sort((a, b) => {
        // First sort by conference
        if (a.Conference !== b.Conference) {
          return a.Conference.localeCompare(b.Conference);
        }
        // Then by division
        if (a.Division !== b.Division) {
          return a.Division.localeCompare(b.Division);
        }
        // Then by points (higher points first)
        const pointsA = parseInt(a.Points) || 0;
        const pointsB = parseInt(b.Points) || 0;
        return pointsB - pointsA;
      });
      
      // Log divisions
      console.log('\nStandings by Division:');
      let currentDivision = '';
      standings.forEach(team => {
        if (team.Division !== currentDivision) {
          currentDivision = team.Division;
          console.log(`\n${currentDivision}:`);
        }
        console.log(`  ${team.Team}: ${team.Points} pts (${team.Wins}-${team.Losses}-${team.OTL})`);
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
    console.error('Error scraping NHL standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('\nSaving to Firestore...');
    
    const collectionRef = db.collection('NHLStandings');
    
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
      const cacheKey = `standings_cache_NHL`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Cleared NHL standings cache');
    }
    
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Run the scraper
async function main() {
  try {
    const standings = await scrapeNHLStandings();
    console.log('\n✅ NHL standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update NHL standings');
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { scrapeNHLStandings };

// Run if called directly
if (require.main === module) {
  main();
}

