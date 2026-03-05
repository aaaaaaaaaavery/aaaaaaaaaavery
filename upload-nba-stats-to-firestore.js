import admin from 'firebase-admin';
import { createRequire } from 'module';
import { scrapeNBAPlayerStats } from './scrape-nba-stats.js';

// Use createRequire for JSON imports in ES modules
const require = createRequire(import.meta.url);
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();


async function uploadNBAStatsToFirestore() {
  try {
    console.log('🏀 Fetching NBA player statistics...');
    
    // Get all stats from the scraper
    const allStats = await scrapeNBAPlayerStats();
    
    if (!allStats) {
      throw new Error('Failed to fetch NBA stats');
    }
    
    console.log('\n📤 Uploading to Firestore...');
    
    // Upload each section to Firestore
    const batch = db.batch();
    const collectionRef = db.collection('nbaStats');
    
    // Clear existing data
    const existingDocs = await collectionRef.get();
    existingDocs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Upload each category section
    const sections = [
      'seasonLeaders',
      'forwards',
      'guards',
      'rookies',
      'centers',
      'seasonTotals',
      'advanced',
      'miscellaneous',
      'trackingDrives',
      'trackingShooting',
      'trackingPassing',
      'trackingSpeed',
      'clutch',
      'scoring',
      'bioStats'
    ];
    
    for (const section of sections) {
      if (allStats[section] && Object.keys(allStats[section]).length > 0) {
        const sectionRef = collectionRef.doc(section);
        batch.set(sectionRef, {
          section: section,
          stats: allStats[section],
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          cacheExpiry: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 12 * 60 * 60 * 1000)) // 12 hours
        });
        console.log(`  ✅ Prepared ${section} section`);
      }
    }
    
    // Commit all changes
    await batch.commit();
    console.log('\n✅ Successfully uploaded all NBA stats to Firestore!');
    console.log(`   Collection: nbaStats`);
    console.log(`   Sections: ${sections.filter(s => allStats[s] && Object.keys(allStats[s]).length > 0).length}`);
    
    return { success: true, sections: sections.filter(s => allStats[s] && Object.keys(allStats[s]).length > 0) };
    
  } catch (error) {
    console.error('❌ Error uploading NBA stats to Firestore:', error.message);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].includes('upload-nba-stats-to-firestore')) {
  uploadNBAStatsToFirestore()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { uploadNBAStatsToFirestore };

