import fetch from 'node-fetch';
import { readFileSync } from 'fs';

const SERVICE_URL = 'https://rss-feed-service-124291936014.us-central1.run.app';

// Read index.html to extract all feed URLs
const indexHtml = readFileSync('../index (1).html', 'utf-8');

// Extract all RSS feed URLs
const feedUrlPattern = /https:\/\/rss-feed-service-124291936014\.us-central1\.run\.app\/[^"'\s]+/g;
const rssAppPattern = /https:\/\/rss\.app\/feeds\/[A-Za-z0-9]+\.xml/g;

const customFeeds = [...new Set(indexHtml.match(feedUrlPattern) || [])];
const rssAppFeeds = [...new Set(indexHtml.match(rssAppPattern) || [])];

// Extract VIDEOS_CONFIG
const videosConfigMatch = indexHtml.match(/const VIDEOS_CONFIG = \{[\s\S]*?\};/);
let videoFeeds = [];
if (videosConfigMatch) {
  const videosConfig = videosConfigMatch[0];
  // Extract singleTab feeds
  const singleTabMatch = videosConfig.match(/singleTab:\s*\{[\s\S]*?\}/);
  if (singleTabMatch) {
    const singleTabContent = singleTabMatch[0];
    const singleTabFeeds = singleTabContent.match(/'[^']+':\s*['"]([^'"]+)['"]/g) || [];
    singleTabFeeds.forEach(feed => {
      const urlMatch = feed.match(/['"]([^'"]+)['"]/);
      if (urlMatch && urlMatch[1].includes('rss-feed-service')) {
        videoFeeds.push({ type: 'Video (singleTab)', url: urlMatch[1] });
      }
    });
  }
  // Extract twoTabs feeds
  const twoTabsMatch = videosConfig.match(/twoTabs:\s*\{[\s\S]*?\}/);
  if (twoTabsMatch) {
    const twoTabsContent = twoTabsMatch[0];
    const twoTabsFeeds = twoTabsContent.match(/['"]([^'"]+)['"]/g) || [];
    twoTabsFeeds.forEach(feed => {
      const url = feed.replace(/['"]/g, '');
      if (url.includes('rss-feed-service')) {
        videoFeeds.push({ type: 'Video (twoTabs)', url });
      }
    });
  }
}

// Combine all custom feeds
const allCustomFeeds = [
  ...customFeeds.map(url => ({ type: 'Headline Feed', url })),
  ...videoFeeds
];

console.log(`Found ${allCustomFeeds.length} custom RSS feeds to test\n`);
console.log(`Found ${rssAppFeeds.length} RSS.app feeds (skipping for now)\n`);

async function testFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const status = response.status;
    const text = await response.text();
    
    if (status === 200) {
      // Check if it's valid RSS/XML
      const hasItems = text.includes('<item>') || text.includes('<entry>');
      const itemCount = (text.match(/<item>/g) || []).length + (text.match(/<entry>/g) || []).length;
      
      // Check for error messages
      const hasError = text.includes('No articles found') || 
                      text.includes('No items found') || 
                      text.includes('Error generating feed') ||
                      text.includes('Rate limit exceeded') ||
                      text.includes('Scraper error');
      
      return {
        url: feed.url,
        type: feed.type,
        status: hasError ? 'ERROR' : 'OK',
        items: itemCount,
        hasContent: hasItems && !hasError,
        error: hasError ? text.substring(0, 200) : null
      };
    } else {
      return {
        url: feed.url,
        type: feed.type,
        status: 'ERROR',
        httpStatus: status,
        error: text.substring(0, 200)
      };
    }
  } catch (error) {
    return {
      url: feed.url,
      type: feed.type,
      status: 'ERROR',
      error: error.message
    };
  }
}

async function main() {
  console.log('Testing all custom RSS feeds...\n');
  console.log('='.repeat(80));
  
  const results = [];
  let tested = 0;
  
  for (const feed of allCustomFeeds) {
    tested++;
    process.stdout.write(`\rTesting ${tested}/${allCustomFeeds.length}: ${feed.url.substring(0, 60)}...`);
    
    const result = await testFeed(feed);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n\n' + '='.repeat(80));
  console.log('\n=== RESULTS ===\n');
  
  const working = results.filter(r => r.status === 'OK' && r.hasContent);
  const failing = results.filter(r => r.status === 'ERROR' || !r.hasContent);
  const empty = results.filter(r => r.status === 'OK' && !r.hasContent);
  
  console.log(`✅ Working (with items): ${working.length}`);
  console.log(`❌ Failing/Errors: ${failing.length}`);
  console.log(`⚠️  Empty (no items): ${empty.length}\n`);
  
  if (failing.length > 0) {
    console.log('\n=== FAILING FEEDS ===\n');
    failing.forEach(f => {
      console.log(`❌ ${f.type}`);
      console.log(`   URL: ${f.url}`);
      console.log(`   Error: ${f.error || f.httpStatus || 'No items found'}`);
      console.log('');
    });
  }
  
  if (empty.length > 0) {
    console.log('\n=== EMPTY FEEDS (No Items) ===\n');
    empty.forEach(f => {
      console.log(`⚠️  ${f.type}`);
      console.log(`   URL: ${f.url}`);
      console.log(`   Items: ${f.items || 0}`);
      console.log('');
    });
  }
  
  // Group by type
  console.log('\n=== SUMMARY BY TYPE ===\n');
  const byType = {};
  results.forEach(r => {
    if (!byType[r.type]) {
      byType[r.type] = { total: 0, working: 0, failing: 0, empty: 0 };
    }
    byType[r.type].total++;
    if (r.status === 'OK' && r.hasContent) {
      byType[r.type].working++;
    } else if (r.status === 'ERROR') {
      byType[r.type].failing++;
    } else {
      byType[r.type].empty++;
    }
  });
  
  Object.entries(byType).forEach(([type, stats]) => {
    console.log(`${type}:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Working: ${stats.working}`);
    console.log(`  Failing: ${stats.failing}`);
    console.log(`  Empty: ${stats.empty}`);
    console.log('');
  });
}

main().catch(console.error);
