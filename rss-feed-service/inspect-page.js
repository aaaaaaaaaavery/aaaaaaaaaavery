// Quick script to inspect page structure for debugging selectors
import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('Usage: node inspect-page.js <url>');
  process.exit(1);
}

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

try {
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  
  await page.waitForTimeout(3000); // Wait for dynamic content
  
  console.log('\n=== PAGE STRUCTURE ANALYSIS ===\n');
  
  // Find all potential article containers
  const articleSelectors = [
    'article',
    '[class*="article"]',
    '[class*="story"]',
    '[class*="post"]',
    '[class*="item"]',
    '[class*="card"]',
    '[class*="entry"]',
    '[class*="content"]'
  ];
  
  for (const selector of articleSelectors) {
    const count = await page.evaluate((sel) => {
      return document.querySelectorAll(sel).length;
    }, selector);
    
    if (count > 0) {
      console.log(`✅ Found ${count} elements with selector: ${selector}`);
      
      // Get sample structure
      const sample = await page.evaluate((sel) => {
        const first = document.querySelector(sel);
        if (!first) return null;
        
        return {
          tagName: first.tagName,
          className: first.className,
          id: first.id,
          hasLink: !!first.querySelector('a'),
          hasTitle: !!first.querySelector('h1, h2, h3, h4'),
          linkText: first.querySelector('a')?.textContent?.trim().substring(0, 50),
          titleText: first.querySelector('h1, h2, h3, h4')?.textContent?.trim().substring(0, 50)
        };
      }, selector);
      
      if (sample) {
        console.log(`   Sample: ${JSON.stringify(sample, null, 2)}`);
      }
    }
  }
  
  // Find all links
  const linkCount = await page.evaluate(() => {
    return document.querySelectorAll('a[href]').length;
  });
  console.log(`\n📎 Total links on page: ${linkCount}`);
  
  // Find headings
  const headingCount = await page.evaluate(() => {
    return document.querySelectorAll('h1, h2, h3, h4').length;
  });
  console.log(`📰 Total headings on page: ${headingCount}`);
  
  // Get page title
  const pageTitle = await page.title();
  console.log(`\n📄 Page title: ${pageTitle}`);
  
  // Wait for user to inspect
  console.log('\n⏸️  Browser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await browser.close();
}

