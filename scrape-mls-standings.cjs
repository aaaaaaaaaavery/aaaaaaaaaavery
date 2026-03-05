const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ESPN API endpoint for MLS standings
const ESPN_MLS_API = 'https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings';

async function scrapeMLSStandings() {
  try {
    console.log('🏆 Scraping MLS standings...');
    
    const response = await axios.get(ESPN_MLS_API);
    const data = response.data;
    
    if (!data.children || data.children.length === 0) {
      console.log('No MLS standings data found');
      return;
    }
    
    const standings = [];
    
    // Process each conference (Eastern and Western)
    if (data.children && data.children.length > 0) {
      data.children.forEach(group => {
        const conferenceName = group.name; // e.g., "Eastern Conference", "Western Conference"
        if (group && group.standings && group.standings.entries) {
          group.standings.entries.forEach(entry => {
            const teamData = {
              Rank: entry.stats.find(s => s.name === 'rank')?.value || 0,
              Team: entry.team.displayName,
              Conference: conferenceName,
              Points: entry.stats.find(s => s.name === 'points')?.value || 0,
              MP: entry.stats.find(s => s.name === 'gamesPlayed')?.value || 0,
              Wins: entry.stats.find(s => s.name === 'wins')?.value || 0,
              Draws: entry.stats.find(s => s.name === 'ties')?.value || 0,
              Losses: entry.stats.find(s => s.name === 'losses')?.value || 0,
              GF: entry.stats.find(s => s.name === 'pointsFor')?.value || 0,
              GA: entry.stats.find(s => s.name === 'pointsAgainst')?.value || 0
            };
            
            standings.push(teamData);
          });
        }
      });
    }
    
    // Sort by rank
    standings.sort((a, b) => {
      const rankA = parseInt(a.Rank) || 0;
      const rankB = parseInt(b.Rank) || 0;
      return rankA - rankB;
    });
    
    console.log(`Found ${standings.length} MLS teams`);
    console.log('Sample data:', standings.slice(0, 3));
    
    await saveToFirestore(standings);
    
  } catch (error) {
    console.error('Error scraping MLS standings:', error.message);
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('💾 Saving MLS standings to Firestore...');
    
    // Clear existing data
    const collectionRef = db.collection('MLSStandings');
    const snapshot = await collectionRef.get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Save new data
    const batch2 = db.batch();
    standings.forEach((team, index) => {
      const docRef = collectionRef.doc();
      batch2.set(docRef, {
        ...team,
        order: index + 1,
        lastUpdated: new Date().toISOString()
      });
    });
    
    await batch2.commit();
    console.log(`✅ Saved ${standings.length} MLS teams to Firestore`);
    
    // Clear cache for this league (if running in browser context)
    if (typeof localStorage !== 'undefined') {
      const cacheKey = `standings_cache_MLS`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Cleared MLS standings cache');
    }
    
  } catch (error) {
    console.error('Error saving to Firestore:', error.message);
    throw error;
  }
}

// Run the scraper
if (require.main === module) {
  scrapeMLSStandings()
    .then(() => {
      console.log('MLS standings scraping completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('MLS standings scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeMLSStandings };
