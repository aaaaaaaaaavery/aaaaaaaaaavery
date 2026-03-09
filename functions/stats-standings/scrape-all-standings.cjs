const { execSync } = require('child_process');
const path = require('path');

// Try to load standings scraper config (if it exists)
let STANDINGS_CONFIG = {};
try {
  const configCjsPath = path.resolve(__dirname, '../../standings-scraper-config.cjs');
  STANDINGS_CONFIG = require(configCjsPath).STANDINGS_SCRAPER_CONFIG || {};
} catch (firstError) {
  try {
    const configJsPath = path.resolve(__dirname, '../../standings-scraper-config.js');
    STANDINGS_CONFIG = require(configJsPath).STANDINGS_SCRAPER_CONFIG || {};
  } catch (secondError) {
    // Config file doesn't exist or can't be loaded, use all enabled by default
    console.log('⚠️ Could not load standings-scraper-config.{cjs,js}, running all scrapers');
  }
}

// Add delay between scrapers for responsible scraping
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to check if scraper should run
function shouldRunScraper(scraperFile) {
  return STANDINGS_CONFIG[scraperFile] !== false; // Default to true if not in config
}

// Helper function to run a scraper with config check
async function runScraperIfEnabled(scraperFile, emoji, name) {
  const DELAY_BETWEEN_SCRAPERS = 2000; // 2 seconds between each scraper
  if (shouldRunScraper(scraperFile)) {
    console.log(`\n${emoji} Running ${name}...\n`);
    try {
      execSync(`node ${scraperFile}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`${name} scraper failed`);
    }
    await delay(DELAY_BETWEEN_SCRAPERS);
  } else {
    console.log(`⏸️  Skipping ${name} (not in season)\n`);
  }
}

async function runScrapers() {
  await runScraperIfEnabled('scrape-nfl-standings.cjs', '🏈', 'NFL Standings');
  await runScraperIfEnabled('scrape-nba-standings.cjs', '🏀', 'NBA Standings');
  await runScraperIfEnabled('scrape-mlb-standings.cjs', '⚾', 'MLB Standings');
  await runScraperIfEnabled('scrape-nhl-standings.cjs', '🏒', 'NHL Standings');
  await runScraperIfEnabled('scrape-ncaaf-standings.cjs', '🏈', 'NCAAF Standings');
  await runScraperIfEnabled('scrape-ncaam-standings.cjs', '🏀', 'NCAAM Standings');
  await runScraperIfEnabled('scrape-ncaaw-standings.cjs', '🏀', 'NCAAW Standings');
  await runScraperIfEnabled('scrape-epl-standings.cjs', '⚽', 'EPL Standings');
  await runScraperIfEnabled('scrape-laliga-standings.cjs', '⚽', 'LaLiga Standings');
  await runScraperIfEnabled('scrape-bundesliga-standings.cjs', '⚽', 'Bundesliga Standings');
  await runScraperIfEnabled('scrape-mls-standings.cjs', '⚽', 'MLS Standings');
  await runScraperIfEnabled('scrape-seriea-standings.cjs', '⚽', 'Serie A Standings');
  await runScraperIfEnabled('scrape-ucl-standings.cjs', '⚽', 'UEFA Champions League Standings');
  await runScraperIfEnabled('scrape-uel-standings.cjs', '⚽', 'UEFA Europa League Standings');
  await runScraperIfEnabled('scrape-uecl-standings.cjs', '⚽', 'UEFA Conference League Standings');
  await runScraperIfEnabled('scrape-ligamx-standings.cjs', '⚽', 'Liga MX Standings');
  await runScraperIfEnabled('scrape-nwsl-standings.cjs', '⚽', 'NWSL Standings');
  await runScraperIfEnabled('scrape-ligue1-standings.cjs', '⚽', 'Ligue 1 Standings');
  await runScraperIfEnabled('scrape-f1-driver-standings.cjs', '🏎️', 'F1 Driver Standings');
  await runScraperIfEnabled('scrape-f1-constructor-standings.cjs', '🏎️', 'F1 Constructor Standings');
  await runScraperIfEnabled('sync-top25-to-games.cjs', '🔄', 'Top 25 Rankings Sync');
  await runScraperIfEnabled('scrape-cfp-standings.cjs', '🏈', 'CFP Rankings');
  await runScraperIfEnabled('scrape-pgatour-standings.cjs', '⛳', 'PGA Tour Standings');
  await runScraperIfEnabled('scrape-lpgatour-standings.cjs', '⛳', 'LPGA Tour Standings');
  await runScraperIfEnabled('scrape-ufc-standings.cjs', '🥊', 'UFC Standings');
  await runScraperIfEnabled('scrape-boxing-standings.cjs', '🥊', 'Boxing Standings');
  await runScraperIfEnabled('scrape-nascar-standings.cjs', '🏎️', 'NASCAR Cup Series Standings');
  await runScraperIfEnabled('scrape-tennis-standings.cjs', '🎾', 'Tennis Standings');
  await runScraperIfEnabled('scrape-livgolf-standings.cjs', '⛳', 'LIV Golf Standings');
  await runScraperIfEnabled('scrape-indycar-standings.cjs', '🏎️', 'IndyCar Standings');
  await runScraperIfEnabled('scrape-motogp-standings.cjs', '🏍️', 'MotoGP Standings');
  await runScraperIfEnabled('scrape-trackandfield-standings.cjs', '🏃', 'Track and Field Standings');
  await runScraperIfEnabled('scrape-facup-standings.cjs', '⚽', 'FA Cup Standings');

  console.log('\n✅ All standings scrapers completed!');
}

// Export function for use in other modules (e.g., Cloud Run endpoints)
module.exports = { runScrapers };

// Run all scrapers if executed directly (for manual runs)
if (require.main === module) {
  runScrapers().catch(error => {
    console.error('Error running scrapers:', error);
    process.exit(1);
  });
}
