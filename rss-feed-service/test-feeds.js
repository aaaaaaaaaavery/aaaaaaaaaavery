import fetch from 'node-fetch';

const SERVICE_URL = 'https://rss-feed-service-124291936014.us-central1.run.app';

// List of all feeds to test
const FEEDS_TO_TEST = [
  // Direct RSS feeds
  { id: 'mlb-rss', url: `${SERVICE_URL}/feeds/mlb-rss.xml`, type: 'Direct RSS' },
  { id: 'yahoo-nba-rss', url: `${SERVICE_URL}/feeds/yahoo-nba-rss.xml`, type: 'Direct RSS' },
  { id: 'espn-mlb-rss', url: `${SERVICE_URL}/feeds/espn-mlb-rss.xml`, type: 'Direct RSS' },
  { id: 'fangraphs-rss', url: `${SERVICE_URL}/feeds/fangraphs-rss.xml`, type: 'Direct RSS' },
  
  // Scraped websites
  { id: 'si-nba', url: `${SERVICE_URL}/feeds/si-nba.xml`, type: 'Scraped' },
  { id: 'autosport-f1', url: `${SERVICE_URL}/feeds/autosport-f1.xml`, type: 'Scraped' },
  { id: 'planetf1', url: `${SERVICE_URL}/feeds/planetf1.xml`, type: 'Scraped' },
  { id: 'bbc-premierleague', url: `${SERVICE_URL}/feeds/bbc-premierleague.xml`, type: 'Scraped' },
  { id: 'nhl-video-recaps', url: `${SERVICE_URL}/feeds/nhl-video-recaps.xml`, type: 'Scraped' },
  { id: 'bleacherreport-nba', url: `${SERVICE_URL}/feeds/bleacherreport-nba.xml`, type: 'Scraped' },
  
  // YouTube channels
  { id: 'nba-channel', url: `${SERVICE_URL}/youtube/channel/NBA.xml`, type: 'YouTube Channel' },
  { id: 'formula1-channel', url: `${SERVICE_URL}/youtube/channel/Formula1.xml`, type: 'YouTube Channel' },
];

async function testFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const status = response.status;
    const text = await response.text();
    
    if (status === 200) {
      // Check if it's valid RSS/XML
      const hasItems = text.includes('<item>') || text.includes('<entry>');
      const itemCount = (text.match(/<item>/g) || []).length + (text.match(/<entry>/g) || []).length;
      
      return {
        id: feed.id,
        type: feed.type,
        status: 'OK',
        items: itemCount,
        hasContent: hasItems
      };
    } else {
      return {
        id: feed.id,
        type: feed.type,
        status: 'ERROR',
        httpStatus: status,
        error: text.substring(0, 200)
      };
    }
  } catch (error) {
    return {
      id: feed.id,
      type: feed.type,
      status: 'ERROR',
      error: error.message
    };
  }
}

async function main() {
  console.log('Testing RSS feeds...\n');
  
  const results = [];
  for (const feed of FEEDS_TO_TEST) {
    const result = await testFeed(feed);
    results.push(result);
    
    if (result.status === 'OK') {
      console.log(`✅ ${result.id} (${result.type}): ${result.items} items`);
    } else {
      console.log(`❌ ${result.id} (${result.type}): ${result.error || result.httpStatus}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== Summary ===');
  const working = results.filter(r => r.status === 'OK');
  const failing = results.filter(r => r.status === 'ERROR');
  
  console.log(`Working: ${working.length}/${results.length}`);
  console.log(`Failing: ${failing.length}/${results.length}`);
  
  if (failing.length > 0) {
    console.log('\nFailing feeds:');
    failing.forEach(f => {
      console.log(`  - ${f.id} (${f.type}): ${f.error || f.httpStatus}`);
    });
  }
}

main().catch(console.error);

