// Test script to explore FlashLive API endpoints for standings
import fetch from 'node-fetch';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'YOUR_RAPIDAPI_KEY';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'flashlive-sports.p.rapidapi.com';

const headers = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
};

console.log('Testing FlashLive API endpoints for standings...\n');

// Test different potential endpoints
const endpointsToTest = [
    // Potential standings endpoints
    '/v1/tournaments/standings?tournament_id=6sPcDMyq&locale=en_INT', // NBA example
    '/v1/tournaments/tables?tournament_id=6sPcDMyq&locale=en_INT',
    '/v1/standings?sport_id=2&locale=en_INT', // Basketball
    '/v1/tables?sport_id=2&locale=en_INT',
    
    // Try getting tournament info first
    '/v1/tournaments/info?tournament_id=6sPcDMyq&locale=en_INT',
    '/v1/tournaments/seasons?tournament_id=6sPcDMyq&locale=en_INT',
];

async function testEndpoint(endpoint) {
    console.log(`\n🔍 Testing: ${endpoint}`);
    console.log(`URL: https://${RAPIDAPI_HOST}${endpoint}`);
    
    try {
        const response = await fetch(`https://${RAPIDAPI_HOST}${endpoint}`, { headers });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS! Response preview:');
            console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...\n');
            return { endpoint, success: true, data };
        } else {
            const errorText = await response.text();
            console.log(`❌ Failed: ${errorText.substring(0, 200)}`);
            return { endpoint, success: false, error: errorText };
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { endpoint, success: false, error: error.message };
    }
}

// Test all endpoints
async function runTests() {
    console.log('='.repeat(60));
    console.log('FlashLive API Standings Endpoint Discovery');
    console.log('='.repeat(60));
    
    const results = [];
    
    for (const endpoint of endpointsToTest) {
        const result = await testEndpoint(endpoint);
        results.push(result);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n✅ Successful endpoints (${successful.length}):`);
    successful.forEach(r => console.log(`  - ${r.endpoint}`));
    
    console.log(`\n❌ Failed endpoints (${failed.length}):`);
    failed.forEach(r => console.log(`  - ${r.endpoint}`));
    
    if (successful.length > 0) {
        console.log('\n✨ Great! We found working endpoints. Check the response structure above.');
        console.log('We can now build the standings fetcher using these endpoints.\n');
    } else {
        console.log('\n💡 No endpoints worked. Let\'s check the RapidAPI dashboard for the correct endpoint format.\n');
    }
}

// Run the tests
runTests().catch(console.error);

