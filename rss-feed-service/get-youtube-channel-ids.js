#!/usr/bin/env node

/**
 * Script to automatically fetch YouTube channel IDs from channel URLs/handles
 * Usage: node get-youtube-channel-ids.js
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SERVICE_URL = 'https://rss-feed-service-124291936014.us-central1.run.app';

// List of channels to look up (from the bundles and individual feeds)
const CHANNELS_TO_LOOKUP = [
  // Individual feeds in index.html
  { name: '@NBA', url: 'https://www.youtube.com/@NBA/videos', feedId: '6TVMNSk3afZmhsLi' },
  { name: '@Formula1', url: 'https://www.youtube.com/@Formula1/videos', feedId: 'zKsXNd2g50iFJFdA' },
  { name: '@MLB', url: 'https://www.youtube.com/@MLB/videos', feedId: '0r7sMjvCjaspA2dD' },
  { name: '@NHL', url: 'https://www.youtube.com/@NHL/videos', feedId: 'Rj2KNuQXoY7IdWW8' },
  { name: '@NFL', url: 'https://www.youtube.com/@NFL/videos', feedId: 'vsvgWNVcJ1m95kd9' },
  { name: '@LaLiga', url: 'https://www.youtube.com/@LaLiga/videos', feedId: 'dbiFC60cU9Yj94dT' },
  { name: '@bundesliga', url: 'https://www.youtube.com/@bundesliga/videos', feedId: 'mPIKuLJkRaEWJJ5b' },
  { name: '@seriea', url: 'https://www.youtube.com/@seriea/videos', feedId: 'inlvkId7SYqCfnec' },
  { name: '@Ligue1', url: 'https://www.youtube.com/@Ligue1/videos', feedId: 'Yq808yRh1vipxkCz' },
  { name: '@NWSLsoccer', url: 'https://www.youtube.com/@NWSLsoccer/videos', feedId: 'j3Vmv9t0tUZurgOq' },
  
  // Home Videos Bundle (already in bundles, but may be used individually)
  { name: '@espncfb', url: 'https://www.youtube.com/@espncfb/videos' },
  { name: '@CFBonFOX', url: 'https://www.youtube.com/@CFBonFOX/videos' },
  { name: '@CBSSportsCFB', url: 'https://www.youtube.com/@CBSSportsCFB/videos' },
  
  // Tennis Videos Bundle
  { name: '@WTA', url: 'https://www.youtube.com/@WTA/videos' },
  { name: '@TennisChannel', url: 'https://www.youtube.com/@TennisChannel/videos' },
  { name: '@tennistv', url: 'https://www.youtube.com/@tennistv/videos' },
  { name: '@ATPTour', url: 'https://www.youtube.com/@ATPTour/videos' },
  
  // Soccer Videos Bundle
  { name: '@thefacup', url: 'https://www.youtube.com/@thefacup/videos' },
  { name: '@ligabbvamx', url: 'https://www.youtube.com/@ligabbvamx/videos' },
  { name: '@GermanFootball', url: 'https://www.youtube.com/@GermanFootball/videos' },
  { name: '@cbssportsgolazo', url: 'https://www.youtube.com/@cbssportsgolazo/videos' },
  { name: '@CBSSportsGolazoEurope', url: 'https://www.youtube.com/@CBSSportsGolazoEurope/videos' },
  { name: '@golazoamerica', url: 'https://www.youtube.com/@golazoamerica/videos' },
  
  // Boxing Videos Bundle
  { name: '@PremierBoxingChampions', url: 'https://www.youtube.com/@PremierBoxingChampions/videos' },
  { name: '@toprank', url: 'https://www.youtube.com/@toprank/videos' },
  { name: '@MatchroomBoxing', url: 'https://www.youtube.com/@MatchroomBoxing/videos' },
  { name: '@DAZNBoxing', url: 'https://www.youtube.com/@DAZNBoxing/videos' }
];

async function getChannelId(channelUrl) {
  try {
    const response = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Method 1: Look for channelId in embedded JSON
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const scriptContent = $(script).html() || '';
      
      // Look for channelId in various JSON structures
      const channelIdMatch = scriptContent.match(/"channelId"\s*:\s*"([^"]+)"/);
      if (channelIdMatch) {
        return channelIdMatch[1];
      }
      
      // Look for externalId (another way YouTube stores channel ID)
      const externalIdMatch = scriptContent.match(/"externalId"\s*:\s*"([^"]+)"/);
      if (externalIdMatch && externalIdMatch[1].startsWith('UC')) {
        return externalIdMatch[1];
      }
      
      // Look for ytInitialData
      if (scriptContent.includes('ytInitialData')) {
        try {
          const dataMatch = scriptContent.match(/var ytInitialData = ({.+?});/);
          if (dataMatch) {
            const data = JSON.parse(dataMatch[1]);
            // Navigate through the data structure to find channelId
            const channelId = findChannelIdInObject(data);
            if (channelId) return channelId;
          }
        } catch (e) {
          // Continue to next method
        }
      }
    }
    
    // Method 2: Look for meta tags
    const metaChannelId = $('meta[property="og:url"]').attr('content');
    if (metaChannelId) {
      const match = metaChannelId.match(/\/channel\/([^\/]+)/);
      if (match) return match[1];
    }
    
    // Method 3: Look for canonical URL
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
      const match = canonical.match(/\/channel\/([^\/\?]+)/);
      if (match) return match[1];
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${channelUrl}:`, error.message);
    return null;
  }
}

function findChannelIdInObject(obj, depth = 0) {
  if (depth > 10) return null; // Prevent infinite recursion
  
  if (typeof obj !== 'object' || obj === null) return null;
  
  // Check if this object has a channelId
  if (obj.channelId && typeof obj.channelId === 'string' && obj.channelId.startsWith('UC')) {
    return obj.channelId;
  }
  
  if (obj.externalId && typeof obj.externalId === 'string' && obj.externalId.startsWith('UC')) {
    return obj.externalId;
  }
  
  // Recursively search in arrays and objects
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      for (const item of obj[key]) {
        const result = findChannelIdInObject(item, depth + 1);
        if (result) return result;
      }
    } else if (typeof obj[key] === 'object') {
      const result = findChannelIdInObject(obj[key], depth + 1);
      if (result) return result;
    }
  }
  
  return null;
}

async function getAllChannelIds() {
  console.log(`\n🔍 Looking up ${CHANNELS_TO_LOOKUP.length} YouTube channel IDs...\n`);
  
  const results = [];
  
  for (const channel of CHANNELS_TO_LOOKUP) {
    process.stdout.write(`Looking up ${channel.name}... `);
    const channelId = await getChannelId(channel.url);
    
    if (channelId) {
      console.log(`✅ ${channelId}`);
      results.push({
        name: channel.name,
        url: channel.url,
        channelId: channelId,
        rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      });
    } else {
      console.log(`❌ Not found`);
      results.push({
        name: channel.name,
        url: channel.url,
        channelId: null,
        rssUrl: null
      });
    }
    
    // Be respectful - add a small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Summary:\n`);
  const found = results.filter(r => r.channelId !== null);
  const notFound = results.filter(r => r.channelId === null);
  
  console.log(`✅ Found: ${found.length}`);
  console.log(`❌ Not found: ${notFound.length}\n`);
  
  console.log(`\n📋 Channel IDs Found:\n`);
  found.forEach(result => {
    console.log(`// ${result.name}`);
    console.log(`'https://www.youtube.com/feeds/videos.xml?channel_id=${result.channelId}',`);
    console.log(``);
  });
  
  if (notFound.length > 0) {
    console.log(`\n⚠️  Channels Not Found:\n`);
    notFound.forEach(result => {
      console.log(`- ${result.name}: ${result.url}`);
    });
  }
  
  // Also output as JSON for easy copying
  console.log(`\n📄 JSON Output (for easy copying):\n`);
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('get-youtube-channel-ids.js')) {
  getAllChannelIds().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { getChannelId, getAllChannelIds };

