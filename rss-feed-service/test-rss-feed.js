import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

const RSS_APP_URL = 'https://rss.app/feeds/yTWZ2e72VcuxPyrv.xml';

// Extract final URL from NewsNow redirect URL
// We only work with the URL string itself - no fetching from NewsNow
function extractFinalUrl(redirectUrl) {
  if (!redirectUrl) return redirectUrl;
  
  // If it's already a direct URL (not a NewsNow redirect), return as-is
  if (!redirectUrl.includes('newsnow.com') && !redirectUrl.includes('c.newsnow.com')) {
    return redirectUrl;
  }
  
  // Try to extract URL directly from the URL string (query params, hash, path, etc.)
  try {
    const urlObj = new URL(redirectUrl);
    
    // Check query parameter 'url'
    const urlParam = urlObj.searchParams.get('url');
    if (urlParam && !urlParam.includes('newsnow.com') && !urlParam.includes('c.newsnow.com')) {
      return decodeURIComponent(urlParam);
    }
    
    // Check for URL in hash fragment
    if (urlObj.hash) {
      const hashMatch = urlObj.hash.match(/url=([^&]+)/);
      if (hashMatch && hashMatch[1] && !hashMatch[1].includes('newsnow.com')) {
        return decodeURIComponent(hashMatch[1]);
      }
    }
    
    // Check path for encoded URL (e.g., /A/1234567890?url=...)
    const pathParts = urlObj.pathname.split('/');
    for (const part of pathParts) {
      if (part.includes('http://') || part.includes('https://')) {
        const decoded = decodeURIComponent(part);
        if (decoded && !decoded.includes('newsnow.com') && !decoded.includes('c.newsnow.com')) {
          return decoded;
        }
      }
    }
    
    // Check query string for other URL patterns
    for (const [key, value] of urlObj.searchParams.entries()) {
      if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
        if (!value.includes('newsnow.com') && !value.includes('c.newsnow.com')) {
          return decodeURIComponent(value);
        }
      }
    }
  } catch (e) {
    // URL parsing failed
  }
  
  // If we can't extract from URL string, we'd need to follow redirect
  // But since we can't access NewsNow from here, return the redirect URL
  // In production, the service will follow redirects to get ultimate URLs
  console.warn(`Could not extract final URL from string: ${redirectUrl}`);
  return redirectUrl;
}

async function testRSSFeed() {
  console.log(`Fetching RSS feed from: ${RSS_APP_URL}`);
  
  try {
    // Fetch RSS feed
    const response = await fetch(RSS_APP_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rssText = await response.text();
    console.log('RSS feed fetched successfully');
    
    // Parse RSS XML using cheerio
    const $ = cheerio.load(rssText, { xml: true });
    
    // Check for parse errors
    if ($('parsererror').length > 0) {
      throw new Error('Failed to parse RSS XML');
    }
    
    // Get channel info
    const channelTitle = $('channel > title').text() || 'RSS Feed';
    const channelDescription = $('channel > description').text() || '';
    const channelLink = $('channel > link').text() || '';
    
    console.log(`Channel: ${channelTitle}`);
    console.log(`Processing items...`);
    
    // Process items sequentially (await properly)
    const items = $('item');
    const processedItems = [];
    
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const $item = $(item);
      const title = $item.find('title').text() || 'No title';
      const originalLink = $item.find('link').text() || $item.find('guid').text() || '#';
      const description = $item.find('description').text() || '';
      const pubDate = $item.find('pubDate').text();
      const guid = $item.find('guid').text() || originalLink;
      
      console.log(`\n[${index + 1}/${items.length}] Processing: ${title.substring(0, 60)}...`);
      console.log(`  Original link: ${originalLink}`);
      
      // Extract ultimate URL (from URL string only - no fetching)
      const ultimateUrl = extractFinalUrl(originalLink);
      
      console.log(`  Ultimate URL: ${ultimateUrl}`);
      
      processedItems.push({
        title,
        link: ultimateUrl,
        description,
        pubDate,
        guid,
        originalLink
      });
      
      // Add small delay to avoid rate limiting
      if (index < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log(`\n✓ Processed ${processedItems.length} items`);
    
    // Generate RSS feed XML
    let rssOutput = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title><![CDATA[${channelTitle}]]></title>
<description><![CDATA[${channelDescription}]]></description>
<link>${channelLink}</link>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<atom:link href="${RSS_APP_URL}" rel="self" type="application/rss+xml"/>
<language>en</language>
`;
    
    processedItems.forEach(item => {
      rssOutput += `<item>
<title><![CDATA[${item.title}]]></title>
<link>${item.link}</link>
<description><![CDATA[${item.description}]]></description>
<pubDate>${item.pubDate || new Date().toUTCString()}</pubDate>
<guid isPermaLink="true">${item.link}</guid>
</item>
`;
    });
    
    rssOutput += `</channel>
</rss>`;
    
    // Write to file (correct path since we're already in rss-feed-service directory)
    const outputFile = 'test-output-feed.xml';
    writeFileSync(outputFile, rssOutput, 'utf8');
    console.log(`\n✓ RSS feed with ultimate URLs written to: ${outputFile}`);
    console.log(`  Total items: ${processedItems.length}`);
    
    // Also create an HTML preview
    let htmlOutput = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>RSS Feed Test Results - ${channelTitle}</title>
<style>
body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
.item { margin-bottom: 20px; padding: 15px; border-bottom: 1px solid #eee; }
.item-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
.item-link { color: #0066cc; text-decoration: none; }
.item-link:hover { text-decoration: underline; }
.item-description { color: #666; margin-top: 5px; font-size: 14px; }
.item-meta { margin-top: 10px; font-size: 12px; color: #999; }
.original-link { color: #999; font-size: 11px; }
.warning { color: #ff6600; font-weight: bold; }
</style>
</head>
<body>
<h1>${channelTitle}</h1>
<p>${channelDescription}</p>
<p><strong>Total items: ${processedItems.length}</strong></p>
<p class="warning">Note: Some URLs may still show NewsNow redirects if extraction failed due to access restrictions.</p>
<hr>
`;
    
    processedItems.forEach((item, index) => {
      const isNewsNow = item.link.includes('newsnow.com') || item.link.includes('c.newsnow.com');
      htmlOutput += `<div class="item">
<div class="item-title">${index + 1}. <a href="${item.link}" class="item-link" target="_blank">${item.title}</a></div>
${item.description ? `<div class="item-description">${item.description}</div>` : ''}
<div class="item-meta">
  <div>Published: ${item.pubDate || 'N/A'}</div>
  <div class="original-link">Original: ${item.originalLink}</div>
  ${isNewsNow ? '<div class="warning">⚠️ URL extraction failed - still contains NewsNow redirect</div>' : '<div style="color: green;">✓ Ultimate URL extracted</div>'}
</div>
</div>
`;
    });
    
    htmlOutput += `</body>
</html>`;
    
    const htmlFile = 'test-output-feed.html';
    writeFileSync(htmlFile, htmlOutput, 'utf8');
    console.log(`✓ HTML preview written to: ${htmlFile}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testRSSFeed();

