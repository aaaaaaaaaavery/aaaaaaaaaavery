// verify-optimization.js
// Quick verification script to check if optimization is working
// Run this after deploying the updated code

const BACKEND_URL = 'https://flashlive-scraper-124291936014.us-central1.run.app';

async function verifyOptimization() {
  console.log('🔍 Verifying ESPN Polling Optimization...\n');
  
  try {
    const response = await fetch(`${BACKEND_URL}/pollESPNLiveData`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    console.log('📊 Response Analysis:');
    console.log(`   Games Fetched: ${data.gamesFetched || 0}`);
    console.log(`   Games Written: ${data.gamesWritten || 0}`);
    console.log(`   Message: ${data.message || 'N/A'}\n`);
    
    // Check if optimization is active
    const message = (data.message || '').toLowerCase();
    const gamesFetched = data.gamesFetched || 0;
    
    if (message.includes('optimized polling') || message.includes('individual games')) {
      console.log('✅ OPTIMIZATION IS ACTIVE!');
      console.log(`   Using individual game polling (${gamesFetched} games)`);
      console.log(`   Estimated API calls: ~${gamesFetched} (vs. ~70 before)`);
      console.log(`   Savings: ~${70 - gamesFetched} API calls per poll`);
      return true;
    } else if (message.includes('skipped fetch') || message.includes('no live games')) {
      console.log('✅ OPTIMIZATION IS ACTIVE!');
      console.log('   Skipped API calls entirely (no games to poll)');
      console.log('   Maximum optimization achieved!');
      return true;
    } else if (gamesFetched > 50) {
      console.log('⚠️  OPTIMIZATION NOT YET ACTIVE');
      console.log('   Possible reasons:');
      console.log('   1. Morning run (first run of day) - uses fallback');
      console.log('   2. Code not deployed yet');
      console.log('   3. No games match polling criteria');
      console.log('\n   💡 Wait 2 minutes and run again, or check Cloud Run logs');
      return false;
    } else if (gamesFetched > 0 && gamesFetched < 20) {
      console.log('✅ OPTIMIZATION LIKELY ACTIVE');
      console.log(`   Fetching ${gamesFetched} games (likely individual polling)`);
      console.log('   Check Cloud Run logs to confirm');
      return true;
    } else {
      console.log('❓ UNCLEAR - Check Cloud Run logs for details');
      return false;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

verifyOptimization().catch(console.error);
