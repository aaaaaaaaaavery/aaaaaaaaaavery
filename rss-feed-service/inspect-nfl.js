import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('/tmp/nfl-news.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== Inspecting NFL.com news page structure ===\n');

// Find all links to news articles
const newsLinks = $('a[href*="/news/"]').slice(0, 10);
console.log(`Found ${newsLinks.length} news links\n`);

newsLinks.each((i, elem) => {
  const $elem = $(elem);
  const href = $elem.attr('href');
  const text = $elem.text().trim();
  
  // Find parent container
  const $parent = $elem.closest('[class*="card"], [class*="article"], [class*="story"], [class*="item"], div');
  const parentClass = $parent.attr('class') || '';
  const parentTag = $parent.prop('tagName') || '';
  
  // Find title
  const $title = $elem.find('h1, h2, h3, h4, [class*="title"], [class*="headline"]').first();
  const title = $title.text().trim() || text.substring(0, 60);
  
  // Find date
  const $date = $parent.find('[class*="date"], [class*="time"], time, [datetime]').first();
  const date = $date.attr('datetime') || $date.text().trim() || '';
  
  console.log(`${i + 1}. ${title.substring(0, 60)}`);
  console.log(`   URL: ${href}`);
  console.log(`   Parent: <${parentTag}> class="${parentClass.substring(0, 80)}"`);
  console.log(`   Date: ${date}`);
  console.log('');
});

// Look for common patterns
console.log('\n=== Common class patterns ===\n');
const allClasses = new Set();
$('[class]').each((i, elem) => {
  const classes = $(elem).attr('class').split(/\s+/);
  classes.forEach(c => {
    if (c.includes('card') || c.includes('article') || c.includes('story') || 
        c.includes('news') || c.includes('item') || c.includes('post')) {
      allClasses.add(c);
    }
  });
});

console.log(Array.from(allClasses).slice(0, 20).join(', '));

