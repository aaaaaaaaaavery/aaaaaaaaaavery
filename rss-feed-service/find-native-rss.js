import fetch from 'node-fetch';

// Common RSS feed paths to try
const RSS_PATHS = [
  '/feed',
  '/rss',
  '/feed.xml',
  '/rss.xml',
  '/feeds/all.rss',
  '/rss/all',
  '/feed/rss',
  '/atom.xml',
  '/index.xml'
];

// Sites to check
const SITES_TO_CHECK = [
  {
    name: 'Sports Illustrated NBA',
    baseUrl: 'https://www.si.com/nba',
    paths: ['/feed', '/rss', '/nba/feed', '/nba/rss']
  },
  {
    name: 'Bleacher Report NBA',
    baseUrl: 'https://bleacherreport.com/nba',
    paths: ['/feed', '/rss', '/nba/feed', '/nba/rss']
  },
  {
    name: 'Autosport F1',
    baseUrl: 'https://www.autosport.com/f1/news',
    paths: ['/feed', '/rss', '/f1/news/feed', '/f1/news/rss']
  },
  {
    name: 'Planet F1',
    baseUrl: 'https://www.planetf1.com/news',
    paths: ['/feed', '/rss', '/news/feed', '/news/rss']
  },
  {
    name: 'NHL Video Recaps',
    baseUrl: 'https://www.nhl.com/video/topic/game-recaps',
    paths: ['/feed', '/rss', '/video/topic/game-recaps/feed']
  },
  {
    name: 'BBC Premier League',
    baseUrl: 'https://www.bbc.com/sport/football/premier-league',
    paths: ['/feed', '/rss', '/sport/football/premier-league/rss']
  }
];

async function checkRSSFeed(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      method: 'HEAD' // Use HEAD to check if URL exists without downloading
    });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom')) {
        return { found: true, url, status: response.status, contentType };
      }
    }
    
    // If HEAD doesn't work, try GET
    const getResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (getResponse.ok) {
      const text = await getResponse.text();
      // Check if it looks like RSS/Atom
      if (text.includes('<rss') || text.includes('<feed') || text.includes('<channel>') || text.includes('<entry>')) {
        return { found: true, url, status: getResponse.status, contentType: getResponse.headers.get('content-type') };
      }
    }
    
    return { found: false, url, status: getResponse.status };
  } catch (error) {
    return { found: false, url, error: error.message };
  }
}

async function main() {
  console.log('Searching for native RSS feeds...\n');
  
  for (const site of SITES_TO_CHECK) {
    console.log(`\n🔍 Checking ${site.name}...`);
    console.log(`   Base URL: ${site.baseUrl}`);
    
    let found = false;
    for (const path of site.paths) {
      const testUrl = site.baseUrl.replace(/\/$/, '') + path;
      const result = await checkRSSFeed(testUrl);
      
      if (result.found) {
        console.log(`   ✅ FOUND: ${result.url}`);
        console.log(`      Status: ${result.status}`);
        console.log(`      Content-Type: ${result.contentType}`);
        found = true;
        break;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (!found) {
      console.log(`   ❌ No RSS feed found`);
    }
  }
}

main().catch(console.error);

