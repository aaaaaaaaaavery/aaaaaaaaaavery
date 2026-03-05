const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function scrapeUCLStandings() {
  try {
    console.log('🏆 Scraping UEFA Champions League standings...');
    
    const url = 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.champions/standings';
    const response = await axios.get(url);
    
    if (!response.data || !response.data.children || !response.data.children[0]) {
      throw new Error('No standings data found');
    }

    const standingsData = response.data.children[0].standings.entries;
    
    console.log(`Found ${standingsData.length} teams`);
    
    // Transform data to match our format
    const teams = standingsData.map(entry => {
      const team = entry.team;
      const stats = {};
      
      // Parse all stats
      entry.stats.forEach(stat => {
        stats[stat.name] = stat.displayValue || stat.value;
      });
      
      return {
        Rank: parseInt(stats.rank) || 0,
        Team: team.displayName,
        MP: parseInt(stats.gamesPlayed) || 0,
        Wins: parseInt(stats.wins) || 0,
        Draws: parseInt(stats.ties) || 0,
        Losses: parseInt(stats.losses) || 0,
        GoalsFor: parseInt(stats.pointsFor) || 0,
        GoalsAgainst: parseInt(stats.pointsAgainst) || 0,
        GoalDifference: parseInt(stats.pointDifferential) || 0,
        Points: parseInt(stats.points) || 0,
        lastUpdated: admin.firestore.Timestamp.now()
      };
    });

    console.log('Sample team:', teams[0]);
    
    // Save to Firestore
    console.log('💾 Saving UEFA Champions League standings to Firestore...');
    
    const standingsRef = db.collection('standings');
    
    // Clear existing UCL standings
    const existingDocs = await standingsRef.where('league', '==', 'UEFAChampionsLeague').get();
    const batch = db.batch();
    
    existingDocs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleared ${existingDocs.size} existing documents`);
    
    // Write new standings
    const writeBatch = db.batch();
    teams.forEach((team, index) => {
      const docRef = standingsRef.doc(`UEFAChampionsLeague_${index + 1}`);
      writeBatch.set(docRef, {
        league: 'UEFAChampionsLeague',
        ...team
      });
    });
    
    await writeBatch.commit();
    console.log(`✅ Saved ${teams.length} teams to Firestore`);
    
    console.log('UEFA Champions League standings scraping completed successfully!');
    
  } catch (error) {
    console.error('Error scraping UEFA Champions League standings:', error.message);
    throw error;
  }
}

// Run the scraper
scrapeUCLStandings()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

