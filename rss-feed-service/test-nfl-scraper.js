import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function testNFLScraper() {
  try {
    const url = 'https://www.nfl.com/news';
    console.log(`Fetching ${url}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log('\n=== Looking for article containers ===\n');
    
    // Try various selectors
    const selectors = [
      'article',
      '.article',
      '[class*="article"]',
      '[class*="story"]',
      '[class*="card"]',
      '[class*="news"]',
      '[data-module="ArticleCard"]',
      '[data-module="NewsCard"]',
      'div[class*="Card"]',
      'a[href*="/news/"]'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
        if (elements.length <= 5) {
          elements.each((i, elem) => {
            const $elem = $(elem);
            const text = $elem.text().trim().substring(0, 100);
            const href = $elem.find('a').first().attr('href') || $elem.attr('href');
            console.log(`  [${i+1}] ${text}... | href: ${href}`);
          });
        }
      }
    }
    
    // Look for JSON data
    console.log('\n=== Looking for embedded JSON data ===\n');
    const scripts = $('script[type="application/json"]');
    if (scripts.length > 0) {
      console.log(`Found ${scripts.length} JSON script tags`);
      scripts.each((i, elem) => {
        try {
          const data = JSON.parse($(elem).html());
          console.log(`Script ${i+1}:`, Object.keys(data));
        } catch (e) {
          // Not JSON
        }
      });
    }
    
    // Look for window.__INITIAL_STATE__ or similar
    const allScripts = $('script');
    allScripts.each((i, elem) => {
      const scriptContent = $(elem).html() || '';
      if (scriptContent.includes('__INITIAL_STATE__') || 
          scriptContent.includes('__NEXT_DATA__') ||
          scriptContent.includes('window.__') ||
          scriptContent.includes('"articles"') ||
          scriptContent.includes('"news"')) {
        console.log(`\nFound potentially useful script at index ${i}`);
        console.log(scriptContent.substring(0, 500));
      }
    });
    
    // Save HTML for inspection
    import('fs').then(fs => {
      fs.writeFileSync('/tmp/nfl-news.html', html);
      console.log('\n✅ HTML saved to /tmp/nfl-news.html for inspection');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNFLScraper();

