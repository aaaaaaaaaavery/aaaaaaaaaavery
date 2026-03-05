/**
 * Master Stats Scraper Orchestrator
 * 
 * This script runs all stats scrapers and uploads the data to Firestore.
 * 
 * To add a new stats scraper:
 * 1. Create a scraper file (e.g., scrape-league-stats.js)
 * 2. Create an upload file (e.g., upload-league-stats-to-firestore.js)
 * 3. Export the upload function from the upload file
 * 4. Import it at the top of this file
 * 5. Add a new try-catch block in runAllStatsScrapers() function
 * 6. Update the counter in the console.log (e.g., [3/3])
 * 
 * Example:
 *   import { uploadLeagueStatsToFirestore } from './upload-league-stats-to-firestore.js';
 *   
 *   // In runAllStatsScrapers():
 *   try {
 *     console.log('\n📊 [3/3] Running League Stats Scraper...');
 *     const result = await uploadLeagueStatsToFirestore();
 *     // ... handle result
 *   } catch (error) {
 *     // ... handle error
 *   }
 */

import { uploadNBAStatsToFirestore } from './upload-nba-stats-to-firestore.js';
import { uploadNBATeamStatsToFirestore } from './upload-nba-team-stats-to-firestore.js';

/**
 * Master function to run all stats scrapers and upload to Firestore
 * This function orchestrates all stats scraping operations
 */
async function runAllStatsScrapers() {
  const results = {
    success: [],
    failed: [],
    startTime: new Date(),
    endTime: null
  };

  console.log('🚀 Starting all stats scrapers...\n');
  console.log('='.repeat(70));

  // NBA Player Stats
  try {
    console.log('\n📊 [1/2] Running NBA Player Stats Scraper...');
    console.log('-'.repeat(70));
    const playerStatsResult = await uploadNBAStatsToFirestore();
    if (playerStatsResult && playerStatsResult.success) {
      results.success.push({
        scraper: 'NBA Player Stats',
        sections: playerStatsResult.sections || 'unknown'
      });
      console.log('✅ NBA Player Stats: SUCCESS');
    } else {
      throw new Error('Upload returned unsuccessful result');
    }
  } catch (error) {
    results.failed.push({
      scraper: 'NBA Player Stats',
      error: error.message
    });
    console.error('❌ NBA Player Stats: FAILED');
    console.error('   Error:', error.message);
  }

  // NBA Team Stats
  try {
    console.log('\n📊 [2/2] Running NBA Team Stats Scraper...');
    console.log('-'.repeat(70));
    const teamStatsResult = await uploadNBATeamStatsToFirestore();
    if (teamStatsResult && teamStatsResult.success) {
      results.success.push({
        scraper: 'NBA Team Stats',
        sections: teamStatsResult.sections || 'unknown'
      });
      console.log('✅ NBA Team Stats: SUCCESS');
    } else {
      throw new Error('Upload returned unsuccessful result');
    }
  } catch (error) {
    results.failed.push({
      scraper: 'NBA Team Stats',
      error: error.message
    });
    console.error('❌ NBA Team Stats: FAILED');
    console.error('   Error:', error.message);
  }

  // Summary
  results.endTime = new Date();
  const duration = (results.endTime - results.startTime) / 1000;

  console.log('\n' + '='.repeat(70));
  console.log('📋 SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successful: ${results.success.length}`);
  results.success.forEach(r => {
    console.log(`   - ${r.scraper} (${Array.isArray(r.sections) ? r.sections.length : r.sections} sections)`);
  });
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(r => {
      console.log(`   - ${r.scraper}: ${r.error}`);
    });
  }
  
  console.log(`\n⏱️  Total Duration: ${duration.toFixed(2)} seconds`);
  console.log('='.repeat(70));

  return results;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].includes('run-all-stats-scrapers')) {
  runAllStatsScrapers()
    .then((results) => {
      const exitCode = results.failed.length > 0 ? 1 : 0;
      if (exitCode === 0) {
        console.log('\n✨ All stats scrapers completed successfully!');
      } else {
        console.log('\n⚠️  Some stats scrapers failed. Check errors above.');
      }
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('💥 Fatal error running stats scrapers:', error);
      process.exit(1);
    });
}

export { runAllStatsScrapers };

