import { scrapeNBATeamStats } from './scrape-nba-team-stats.js';
import admin from 'firebase-admin';
import { createRequire } from 'module';

// Use createRequire for JSON imports in ES modules
const require = createRequire(import.meta.url);
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function uploadNBATeamStatsToFirestore() {
  try {
    console.log('🏀 Fetching NBA team statistics...');
    
    // Get all stats from the scraper
    const allStats = await scrapeNBATeamStats();
    
    if (!allStats) {
      throw new Error('Failed to fetch NBA team stats');
    }
    
    console.log('\n📤 Uploading to Firestore...');
    
    // Upload each section to Firestore
    const batch = db.batch();
    const collectionRef = db.collection('nbaTeamStats');
    
    // Clear existing data
    const existingDocs = await collectionRef.get();
    existingDocs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Upload each category section
    const sections = [
      'seasonLeaders',
      'scoring',
      'bench',
      'statsInWins',
      'regularSeasonTotals',
      'advanced',
      'miscellaneous',
      'tracking',
      'trackingDrives',
      'trackingShooting',
      'trackingPassing',
      'trackingSpeed',
      'hustle',
      'clutch'
    ];
    
    for (const section of sections) {
      if (allStats[section] && Object.keys(allStats[section]).length > 0) {
        const sectionRef = collectionRef.doc(section);
        batch.set(sectionRef, {
          section: section,
          stats: allStats[section],
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`  ✅ Prepared ${section} section`);
      }
    }
    
    // Commit all changes
    await batch.commit();
    console.log('\n✅ Successfully uploaded all NBA team stats to Firestore!');
    console.log(`   Collection: nbaTeamStats`);
    console.log(`   Sections: ${sections.filter(s => allStats[s] && Object.keys(allStats[s]).length > 0).length}`);
    
    return { success: true, sections: sections.filter(s => allStats[s] && Object.keys(allStats[s]).length > 0) };
    
  } catch (error) {
    console.error('❌ Error uploading NBA team stats to Firestore:', error.message);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].includes('upload-nba-team-stats-to-firestore')) {
  uploadNBATeamStatsToFirestore()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { uploadNBATeamStatsToFirestore };

