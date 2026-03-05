const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ESPN API endpoint for Serie A standings
const ESPN_SERIEA_API = 'https://site.api.espn.com/apis/v2/sports/soccer/ita.1/standings';

async function scrapeSerieAStandings() {
  try {
    console.log('🏆 Scraping Serie A standings...');
    
    const response = await axios.get(ESPN_SERIEA_API);
    const data = response.data;
    
    if (!data.children || data.children.length === 0) {
      console.log('No Serie A standings data found');
      return;
    }
    
    const standings = [];
    
    // Process each team from the standings entries
    if (data.children && data.children.length > 0) {
      const group = data.children[0];
      if (group && group.standings && group.standings.entries) {
        group.standings.entries.forEach(entry => {
          const teamData = {
            Rank: entry.stats.find(s => s.name === 'rank')?.value || 0,
            Team: entry.team.displayName,
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
    }
    
    // Sort by rank
    standings.sort((a, b) => {
      const rankA = parseInt(a.Rank) || 0;
      const rankB = parseInt(b.Rank) || 0;
      return rankA - rankB;
    });
    
    console.log(`Found ${standings.length} Serie A teams`);
    console.log('Sample data:', standings.slice(0, 3));
    
    await saveToFirestore(standings);
    
  } catch (error) {
    console.error('Error scraping Serie A standings:', error.message);
    throw error;
  }
}

async function saveToFirestore(standings) {
  try {
    console.log('💾 Saving Serie A standings to Firestore...');
    
    // Clear existing data
    const collectionRef = db.collection('SerieAStandings');
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
    console.log(`✅ Saved ${standings.length} Serie A teams to Firestore`);
    
    // Clear cache for this league (if running in browser context)
    if (typeof localStorage !== 'undefined') {
      const cacheKey = `standings_cache_SerieA`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Cleared Serie A standings cache');
    }
    
  } catch (error) {
    console.error('Error saving to Firestore:', error.message);
    throw error;
  }
}

// Run the scraper
if (require.main === module) {
  scrapeSerieAStandings()
    .then(() => {
      console.log('Serie A standings scraping completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Serie A standings scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeSerieAStandings };
