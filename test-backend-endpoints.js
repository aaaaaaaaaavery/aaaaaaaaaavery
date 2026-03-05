// test-backend-endpoints.js
// Test script to verify all backend endpoints are working
// Run this after deploying index.js to verify endpoints

const BACKEND_URL = 'https://flashlive-scraper-124291936014.us-central1.run.app';

const endpoints = [
  '/data/today.json',
  '/data/yesterday.json',
  '/data/featured.json',
  '/data/f1-driver-standings.json',
  '/data/f1-constructor-standings.json',
  '/data/f1-schedule.json',
  '/data/standings.json',
  '/data/mlb-stats.json',
  '/data/nba-stats.json',
  '/data/cfp-standings.json',
  '/data/today-slate.json'
];

async function testEndpoint(endpoint) {
  try {
    const url = `${BACKEND_URL}${endpoint}`;
    console.log(`\n🧪 Testing: ${endpoint}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    const size = JSON.stringify(data).length;
    
    console.log(`✅ Success: ${response.status}`);
    console.log(`   Size: ${(size / 1024).toFixed(2)} KB`);
    
    // Check for expected structure
    if (endpoint.includes('today.json') || endpoint.includes('yesterday.json')) {
      if (data.games && Array.isArray(data.games)) {
        console.log(`   Games: ${data.games.length}`);
      }
    } else if (endpoint.includes('f1-driver-standings') || endpoint.includes('f1-constructor-standings')) {
      if (data.standings && Array.isArray(data.standings)) {
        console.log(`   Items: ${data.standings.length}`);
      }
    } else if (endpoint.includes('standings.json')) {
      if (data.standings && typeof data.standings === 'object') {
        const keys = Object.keys(data.standings);
        console.log(`   Leagues: ${keys.length}`);
      }
    } else if (endpoint.includes('nba-stats.json')) {
      const playerKeys = data.playerStats ? Object.keys(data.playerStats).length : 0;
      const teamKeys = data.teamStats ? Object.keys(data.teamStats).length : 0;
      console.log(`   Player Stats Sections: ${playerKeys}, Team Stats Sections: ${teamKeys}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testAllEndpoints() {
  console.log('='.repeat(70));
  console.log('🚀 Testing Backend Endpoints');
  console.log('='.repeat(70));
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    results.push({ endpoint, success });
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Endpoints:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.endpoint}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
}

// Run tests
testAllEndpoints().catch(console.error);

