import fetch from 'node-fetch';

const BASE_URL = process.env.RSS_SERVICE_URL || 'http://localhost:8080';
const TEST_FEEDS = [
  'newsnow-f1',
  'newsnow-nhl',
  'newsnow-nfl',
  'newsnow-nba'
];

async function testConcurrency() {
  console.log('Testing NewsNow concurrency control and delays...\n');
  console.log(`Testing ${TEST_FEEDS.length} NewsNow feeds sequentially\n`);
  console.log('Expected behavior:');
  console.log('- Only 1 feed should process at a time');
  console.log('- 5-second delay between each feed');
  console.log('- Total time should be ~(3 seconds per scrape + 5 seconds delay) × number of feeds\n');
  
  const startTime = Date.now();
  const results = [];
  
  // Make all requests at once to test concurrency control
  const promises = TEST_FEEDS.map(async (feedId, index) => {
    const requestStart = Date.now();
    console.log(`[${new Date().toISOString()}] Starting request ${index + 1}: ${feedId}`);
    
    try {
      const response = await fetch(`${BASE_URL}/feeds/${feedId}.xml`, {
        headers: {
          'User-Agent': 'Test-Script/1.0'
        }
      });
      
      const requestEnd = Date.now();
      const duration = (requestEnd - requestStart) / 1000;
      
      const status = response.status;
      const text = await response.text();
      const hasItems = text.includes('<item>') || text.includes('<entry>');
      
      console.log(`[${new Date().toISOString()}] Completed request ${index + 1}: ${feedId} - Status: ${status}, Duration: ${duration.toFixed(2)}s, Has items: ${hasItems}`);
      
      results.push({
        feedId,
        index: index + 1,
        status,
        duration,
        hasItems,
        requestStart,
        requestEnd
      });
      
      return { feedId, status, duration, hasItems };
    } catch (error) {
      const requestEnd = Date.now();
      const duration = (requestEnd - requestStart) / 1000;
      console.error(`[${new Date().toISOString()}] Error for ${feedId}: ${error.message} (${duration.toFixed(2)}s)`);
      results.push({
        feedId,
        index: index + 1,
        status: 'ERROR',
        duration,
        hasItems: false,
        requestStart,
        requestEnd,
        error: error.message
      });
      return { feedId, status: 'ERROR', duration, hasItems: false, error: error.message };
    }
  });
  
  await Promise.all(promises);
  
  const endTime = Date.now();
  const totalDuration = (endTime - startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total time: ${totalDuration.toFixed(2)} seconds`);
  console.log(`Number of feeds: ${TEST_FEEDS.length}`);
  console.log(`Average time per feed: ${(totalDuration / TEST_FEEDS.length).toFixed(2)} seconds\n`);
  
  // Calculate time between requests
  console.log('Request Timing Analysis:');
  results.sort((a, b) => a.requestStart - b.requestStart);
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const startTimeFormatted = new Date(result.requestStart).toISOString();
    const endTimeFormatted = new Date(result.requestEnd).toISOString();
    
    console.log(`\n${result.index}. ${result.feedId}:`);
    console.log(`   Start: ${startTimeFormatted}`);
    console.log(`   End: ${endTimeFormatted}`);
    console.log(`   Duration: ${result.duration.toFixed(2)}s`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Has items: ${result.hasItems}`);
    
    if (i > 0) {
      const prevResult = results[i - 1];
      const timeBetween = (result.requestStart - prevResult.requestEnd) / 1000;
      console.log(`   Time since previous completed: ${timeBetween.toFixed(2)}s`);
      
      if (timeBetween < 4.5) {
        console.log(`   ⚠️  WARNING: Delay is less than 5 seconds! Expected ~5s delay.`);
      } else if (timeBetween >= 4.5 && timeBetween <= 6) {
        console.log(`   ✅ Delay looks correct (~5 seconds)`);
      } else {
        console.log(`   ℹ️  Delay is longer than expected (may be due to processing time)`);
      }
    }
  }
  
  // Check for overlapping requests
  console.log('\n' + '='.repeat(60));
  console.log('Concurrency Analysis:');
  console.log('='.repeat(60));
  
  let maxConcurrent = 0;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    let concurrent = 1; // Count itself
    
    for (let j = 0; j < results.length; j++) {
      if (i !== j) {
        const other = results[j];
        // Check if other request overlaps with this one
        if (other.requestStart < result.requestEnd && other.requestEnd > result.requestStart) {
          concurrent++;
        }
      }
    }
    
    maxConcurrent = Math.max(maxConcurrent, concurrent);
    console.log(`${result.feedId}: ${concurrent} concurrent request(s) during its execution`);
  }
  
  console.log(`\nMaximum concurrent requests: ${maxConcurrent}`);
  
  if (maxConcurrent === 1) {
    console.log('✅ SUCCESS: Only 1 NewsNow request processed at a time!');
  } else {
    console.log(`⚠️  WARNING: ${maxConcurrent} requests were concurrent. Expected 1.`);
  }
  
  // Expected total time calculation
  const expectedTime = (3 + 5) * TEST_FEEDS.length; // 3s scrape + 5s delay per feed
  console.log(`\nExpected total time: ~${expectedTime} seconds (${TEST_FEEDS.length} feeds × 8 seconds)`);
  console.log(`Actual total time: ${totalDuration.toFixed(2)} seconds`);
  
  if (totalDuration >= expectedTime * 0.8 && totalDuration <= expectedTime * 1.5) {
    console.log('✅ Total time is within expected range');
  } else {
    console.log('⚠️  Total time is outside expected range');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log('='.repeat(60));
  const successful = results.filter(r => r.status === 200 && r.hasItems).length;
  console.log(`Successful: ${successful}/${TEST_FEEDS.length}`);
  console.log(`Failed: ${TEST_FEEDS.length - successful}/${TEST_FEEDS.length}`);
  console.log(`Max concurrent: ${maxConcurrent} (expected: 1)`);
  console.log(`Total duration: ${totalDuration.toFixed(2)}s`);
}

// Run the test
testConcurrency().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

