import { execSync } from 'child_process';

/**
 * Master Scraper Orchestrator
 * 
 * This script runs all scrapers in the correct order:
 * 1. Flashlive scraper (via API call)
 * 2. Run all stats scrapers (NBA player/team stats)
 * 3. Run all standings scrapers
 * 
 * Note: Featured games are now managed via perspectives-admin.html, not Google Sheets
 * 
 * Usage: node run-all-scrapers.js
 */

const FLASHLIVE_API_URL = 'https://flashlive-scraper-124291936014.us-central1.run.app/initialScrapeAndStartPolling';

// Add delay between operations for responsible scraping
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAllScrapers() {
  const results = {
    success: [],
    failed: [],
    startTime: new Date(),
    endTime: null
  };

  console.log('🚀 Starting all scrapers...\n');
  console.log('='.repeat(70));

  // 1. Flashlive Scraper (API call)
  try {
    console.log('\n📡 [1/4] Running Flashlive Scraper (API call)...');
    console.log('-'.repeat(70));
    execSync(`curl -X POST ${FLASHLIVE_API_URL}`, { stdio: 'inherit' });
    results.success.push({ operation: 'Flashlive Scraper' });
    console.log('✅ Flashlive Scraper: SUCCESS');
  } catch (error) {
    results.failed.push({
      operation: 'Flashlive Scraper',
      error: error.message
    });
    console.error('❌ Flashlive Scraper: FAILED');
    console.error('   Error:', error.message);
  }
  await delay(2000);

  // 2. Run All Stats Scrapers (Featured games now managed via perspectives-admin.html)
  try {
    console.log('\n📈 [2/3] Running All Stats Scrapers...');
    console.log('-'.repeat(70));
    execSync('node run-all-stats-scrapers.js', { stdio: 'inherit' });
    results.success.push({ operation: 'All Stats Scrapers' });
    console.log('✅ All Stats Scrapers: SUCCESS');
  } catch (error) {
    results.failed.push({
      operation: 'All Stats Scrapers',
      error: error.message
    });
    console.error('❌ All Stats Scrapers: FAILED');
    console.error('   Error:', error.message);
  }
  await delay(2000);

  // 3. Run All Standings Scrapers
  try {
    console.log('\n🏆 [3/3] Running All Standings Scrapers...');
    console.log('-'.repeat(70));
    execSync('node scrape-all-standings.cjs', { stdio: 'inherit' });
    results.success.push({ operation: 'All Standings Scrapers' });
    console.log('✅ All Standings Scrapers: SUCCESS');
  } catch (error) {
    results.failed.push({
      operation: 'All Standings Scrapers',
      error: error.message
    });
    console.error('❌ All Standings Scrapers: FAILED');
    console.error('   Error:', error.message);
  }

  // Summary
  results.endTime = new Date();
  const duration = (results.endTime - results.startTime) / 1000;

  console.log('\n' + '='.repeat(70));
  console.log('📋 FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successful: ${results.success.length}`);
  results.success.forEach(r => {
    console.log(`   - ${r.operation}`);
  });
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(r => {
      console.log(`   - ${r.operation}: ${r.error}`);
    });
  }
  
  console.log(`\n⏱️  Total Duration: ${(duration / 60).toFixed(2)} minutes (${duration.toFixed(2)} seconds)`);
  console.log('='.repeat(70));

  return results;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].includes('run-all-scrapers')) {
  runAllScrapers()
    .then((results) => {
      const exitCode = results.failed.length > 0 ? 1 : 0;
      if (exitCode === 0) {
        console.log('\n✨ All scrapers completed successfully!');
      } else {
        console.log('\n⚠️  Some scrapers failed. Check errors above.');
      }
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('💥 Fatal error running scrapers:', error);
      process.exit(1);
    });
}

export { runAllScrapers };

