// Test script to find working selectors for failing feeds
import { chromium } from 'playwright';

const testFeeds = [
  { id: 'collegefootballnews', url: 'https://www.collegefootballnews.com/' },
  { id: 'pgatour-com', url: 'https://www.pgatour.com/news' },
  { id: 'golfwrx', url: 'https://www.golfwrx.com/' },
  { id: 'mmamania', url: 'https://www.mmamania.com/' },
  { id: 'ufc-com', url: 'https://www.ufc.com/trending/all' },
  { id: 'tapology', url: 'https://www.tapology.com/news' },
  { id: 'mmafighting', url: 'https://www.mmafighting.com/' },
  { id: 'ringmagazine-rss', url: 'https://ringmagazine.com/en/news' },
  { id: 'boxingscene', url: 'https://www.boxingscene.com/articles' },
  { id: 'transfermarkt-rss', url: 'https://www.transfermarkt.co.uk/news' }
];

const browser = await chromium.launch({ headless: true });

for (const feed of testFeeds) {
  console.log(`\n=== Testing ${feed.id} ===`);
  const page = await browser.newPage();
  
  try {
    await page.goto(feed.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000); // Wait for dynamic content
    
    // Try multiple selector strategies
    const selectors = [
      'article',
      '[class*="article"]',
      '[class*="story"]',
      '[class*="post"]',
      '[class*="item"]',
      '[class*="card"]',
      'a[href*="/story"]',
      'a[href*="/article"]',
      'a[href*="/news"]',
      '.headline',
      '[class*="headline"]',
      'h2 a',
      'h3 a'
    ];
    
    let found = false;
    for (const selector of selectors) {
      const count = await page.evaluate((sel) => {
        return document.querySelectorAll(sel).length;
      }, selector);
      
      if (count > 0) {
        console.log(`  ✅ ${selector}: ${count} elements`);
        
        // Get sample data
        const sample = await page.evaluate((sel) => {
          const elements = Array.from(document.querySelectorAll(sel)).slice(0, 3);
          return elements.map(el => {
            const link = el.querySelector('a') || (el.tagName === 'A' ? el : null);
            const title = el.querySelector('h1, h2, h3, h4') || (link ? link : null);
            return {
              tag: el.tagName,
              class: el.className.substring(0, 50),
              hasLink: !!link,
              linkHref: link?.href?.substring(0, 80),
              titleText: title?.textContent?.trim().substring(0, 60)
            };
          });
        }, selector);
        
        console.log(`     Sample:`, JSON.stringify(sample, null, 2));
        found = true;
      }
    }
    
    if (!found) {
      console.log(`  ❌ No articles found with common selectors`);
      
      // Get all links as fallback
      const allLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]')).slice(0, 10);
        return links.map(link => ({
          href: link.href.substring(0, 80),
          text: link.textContent?.trim().substring(0, 50)
        }));
      });
      console.log(`  📎 First 10 links:`, JSON.stringify(allLinks, null, 2));
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  } finally {
    await page.close();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between tests
  }
}

await browser.close();

