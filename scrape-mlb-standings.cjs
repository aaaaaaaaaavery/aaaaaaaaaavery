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

// ESPN's API endpoint for MLB standings
const ESPN_MLB_API = 'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings';

// MLB Division mappings
const TEAM_DIVISIONS = {
  // AL East
  'Toronto Blue Jays': 'AL East',
  'New York Yankees': 'AL East',
  'Baltimore Orioles': 'AL East',
  'Tampa Bay Rays': 'AL East',
  'Boston Red Sox': 'AL East',
  
  // AL Central
  'Cleveland Guardians': 'AL Central',
  'Detroit Tigers': 'AL Central',
  'Kansas City Royals': 'AL Central',
  'Minnesota Twins': 'AL Central',
  'Chicago White Sox': 'AL Central',
  
  // AL West
  'Houston Astros': 'AL West',
  'Seattle Mariners': 'AL West',
  'Texas Rangers': 'AL West',
  'Los Angeles Angels': 'AL West',
  'Oakland Athletics': 'AL West',
  'Athletics': 'AL West',
  
  // NL East
  'Atlanta Braves': 'NL East',
  'New York Mets': 'NL East',
  'Philadelphia Phillies': 'NL East',
  'Miami Marlins': 'NL East',
  'Washington Nationals': 'NL East',
  
  // NL Central
  'Milwaukee Brewers': 'NL Central',
  'Chicago Cubs': 'NL Central',
  'Cincinnati Reds': 'NL Central',
  'Pittsburgh Pirates': 'NL Central',
  'St. Louis Cardinals': 'NL Central',
  
  // NL West
  'Los Angeles Dodgers': 'NL West',
  'San Diego Padres': 'NL West',
  'Arizona Diamondbacks': 'NL West',
  'San Francisco Giants': 'NL West',
  'Colorado Rockies': 'NL West'
};

async function scrapeMLBStandings() {
  try {
    console.log('Fetching MLB standings from ESPN API...');
    
    const response = await axios.get(ESPN_MLB_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const standings = [];
    const data = response.data;
    
    // ESPN API returns standings organized by leagues
    if (data && data.children) {
      for (const league of data.children) {
        const leagueName = league.name;
        
        if (league.standings && league.standings.entries) {
          for (const entry of league.standings.entries) {
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
              Team: mascotName,  // e.g., "Blue Jays" instead of "Toronto Blue Jays"
              FullName: teamName,
              Division: divisionName,
              Wins: getStatValue(19),   // index 19 is wins
              Losses: getStatValue(10), // index 10 is losses
              lastUpdated: new Date().toISOString()
            };
            
            standings.push(teamData);
            console.log(`  ${teamData.Team}: ${teamData.Wins}-${teamData.Losses} (${teamData.Division})`);
          }
        }
      }
      
      // Sort standings by division, then by wins (descending), then by losses (ascending)
      standings.sort((a, b) => {
        // First sort by division
        if (a.Division !== b.Division) {
          return a.Division.localeCompare(b.Division);
        }
        // Then by wins (higher wins first)
        const winsA = parseInt(a.Wins) || 0;
        const winsB = parseInt(b.Wins) || 0;
        if (winsA !== winsB) {
          return winsB - winsA;
        }
        // Then by losses (fewer losses first)
        const lossesA = parseInt(a.Losses) || 0;
        const lossesB = parseInt(b.Losses) || 0;
        return lossesA - lossesB;
      });
      
      // Log divisions
      console.log('\nStandings by Division:');
      let currentDivision = '';
      standings.forEach(team => {
        if (team.Division !== currentDivision) {
          currentDivision = team.Division;
          console.log(`\n${currentDivision}:`);
        }
        console.log(`  ${team.Team}: ${team.Wins}-${team.Losses}`);
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
    console.error('Error scraping MLB standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('\nSaving to Firestore...');
    
    const collectionRef = db.collection('MLBStandings');
    
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
      const cacheKey = `standings_cache_MLB`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Cleared MLB standings cache');
    }
    
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Run the scraper
async function main() {
  try {
    const standings = await scrapeMLBStandings();
    console.log('\n✅ MLB standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update MLB standings');
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { scrapeMLBStandings };

// Run if called directly
if (require.main === module) {
  main();
}

