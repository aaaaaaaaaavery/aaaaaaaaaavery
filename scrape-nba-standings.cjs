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

// ESPN's API endpoint for NBA standings
const ESPN_NBA_API = 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings';

// NBA Conference mappings (no divisions displayed in screenshot)
const TEAM_CONFERENCES = {
  // Eastern Conference
  'Atlanta Hawks': 'Eastern Conference',
  'Boston Celtics': 'Eastern Conference',
  'Brooklyn Nets': 'Eastern Conference',
  'Charlotte Hornets': 'Eastern Conference',
  'Chicago Bulls': 'Eastern Conference',
  'Cleveland Cavaliers': 'Eastern Conference',
  'Detroit Pistons': 'Eastern Conference',
  'Indiana Pacers': 'Eastern Conference',
  'Miami Heat': 'Eastern Conference',
  'Milwaukee Bucks': 'Eastern Conference',
  'New York Knicks': 'Eastern Conference',
  'Orlando Magic': 'Eastern Conference',
  'Philadelphia 76ers': 'Eastern Conference',
  'Toronto Raptors': 'Eastern Conference',
  'Washington Wizards': 'Eastern Conference',
  
  // Western Conference
  'Dallas Mavericks': 'Western Conference',
  'Denver Nuggets': 'Western Conference',
  'Golden State Warriors': 'Western Conference',
  'Houston Rockets': 'Western Conference',
  'Los Angeles Clippers': 'Western Conference',
  'Los Angeles Lakers': 'Western Conference',
  'Memphis Grizzlies': 'Western Conference',
  'Minnesota Timberwolves': 'Western Conference',
  'New Orleans Pelicans': 'Western Conference',
  'Oklahoma City Thunder': 'Western Conference',
  'Phoenix Suns': 'Western Conference',
  'Portland Trail Blazers': 'Western Conference',
  'Sacramento Kings': 'Western Conference',
  'San Antonio Spurs': 'Western Conference',
  'Utah Jazz': 'Western Conference'
};

async function scrapeNBAStandings() {
  try {
    console.log('Fetching NBA standings from ESPN API...');
    
    const response = await axios.get(ESPN_NBA_API, {
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
            const mascotName = team.shortDisplayName || team.name; // e.g., "Lakers" instead of "Los Angeles Lakers"
            
            // Get conference from mapping
            const conferenceDisplay = TEAM_CONFERENCES[teamName] || conferenceName;
            
            // Extract stats - ESPN API provides stats as array
            const getStatValue = (statIndex) => {
              return stats[statIndex] ? stats[statIndex].displayValue : '0';
            };
            
            const teamData = {
              Team: mascotName,  // Store mascot name only
              FullName: teamName, // Store full name for reference
              Conference: conferenceDisplay,
              Wins: getStatValue(14),   // index 14 is wins
              Losses: getStatValue(6),  // index 6 is losses
              lastUpdated: new Date().toISOString()
            };
            
            standings.push(teamData);
            console.log(`  ${teamData.Team}: ${teamData.Wins}-${teamData.Losses} (${teamData.Conference})`);
          }
        }
      }
      
      // Sort standings by conference, then by wins (descending), then by losses (ascending)
      standings.sort((a, b) => {
        // First sort by conference
        if (a.Conference !== b.Conference) {
          return a.Conference.localeCompare(b.Conference);
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
      
      // Log conferences
      console.log('\nStandings by Conference:');
      let currentConference = '';
      standings.forEach(team => {
        if (team.Conference !== currentConference) {
          currentConference = team.Conference;
          console.log(`\n${currentConference}:`);
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
    console.error('Error scraping NBA standings:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('\nSaving to Firestore...');
    
    const collectionRef = db.collection('NBAStandings');
    
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
      const cacheKey = `standings_cache_NBA`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Cleared NBA standings cache');
    }
    
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Run the scraper
async function main() {
  try {
    const standings = await scrapeNBAStandings();
    console.log('\n✅ NBA standings updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to update NBA standings');
    process.exit(1);
  }
}

main();
