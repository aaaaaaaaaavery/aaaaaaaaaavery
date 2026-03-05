#!/usr/bin/env node

/**
 * Test script to check all newly added RSS feeds
 */

import fetch from 'node-fetch';

const SERVICE_URL = 'https://rss-feed-service-124291936014.us-central1.run.app';

// Mapping of RSS.app feed IDs to new feed IDs
const FEED_MAPPINGS = {
  // Direct RSS feeds
  'YJjVVRof201ZO9zO': 'mlbtraderumors',
  'PlvW7vqF4AaGbwcp': 'cbs-nfl-rss',
  'rHWxXQ9YaXdlGVjA': 'yahoo-nfl-rss',
  'yQjCNVjNGrK8PYed': 'foxsports-nfl-api',
  'cexYuRoRAMSoUAp8': 'espn-nfl-rss',
  'RzsFiWRkJWt232Z1': 'nfl-com',
  'BKInO41JsrUscMDQ': 'yahoo-mlb-rss',
  '3aWvxow1noZCrVBq': 'yahoo-nba-rss',
  'Bv6N7qiA79eXbSl6': 'cbs-mlb-rss',
  'pbw0uEDOop5lPZ1h': 'espn-nba-rss',
  'gpNdeo4WRun54WuS': 'nba-com-news',
  'XNu5yCjXjSTjFNuz': 'cbs-nba-rss',
  'bGCDWYzMpS4kpEEJ': 'foxsports-nba-api',
  '6gjSXkILFAiwYPLU': 'yahoo-nhl-rss',
  'tjqR23Xwa5us4EGS': 'nhl-com-news',
  'aEOH2tj5bfjq4oJd': 'espn-nhl-rss',
  'xtqmDS6UnTyXSmXG': 'cbs-nhl-rss',
  'Zf7Ng96ruXO870Ee': 'hockeywriters',
  'V79dVmqWDC7pLACZ': 'hockeynews',
  'SBZfeZPSsLT2mwmU': 'onefootball-home',
  'tWKu85yTZrmms6lo': 'goal-com',
  'f5rbTpdVjq93AlTY': 'worldsoccertalk',
  '3SZSbvRR7GXi7Al1': 'espn-soccer-rss',
  'SlUe5H1aOykHQcvX': 'yahoo-soccer-rss',
  '10xrZLK2Mn4xhAqJ': 'cbs-soccer-rss',
  'W5qj2Lq2skC4hTyn': 'transfermarkt-rss',
  'ixvULiUvb7Hm3fDx': 'getfootballnewsgermany-bundesliga',
  'fg5UIrrq1YikBxyg': 'bundesliga-com',
  'HL9rA42ELIkqWXJg': 'reddit-nwsl',
  'UNtqy55sZPAGDxWp': 'reddit-ligue1',
  'o3KVLBimGj35TqzR': 'reddit-ligamx',
  'Eh9IrBhQ1Pk3MxVu': 'newsnow-ligamx',
  'cYgsxfZK9RmqKiOn': 'yahoo-collegefootball-rss',
  'ydzB00a4yYWWhOJE': 'nytimes-athletic-cfb',
  'Z2rHcU1BGE8RLayI': 'espn-ncf-rss',
  '1wcMh76GcHSPwTvk': 'cbs-collegefootball-rss',
  'Zzvx41Fx8M8WXUS1': 'foxsports-cfb-api',
  'SQahLIzekjAsW3lk': '247sports-cfb',
  'tBrt5dpIhevVbeQi': 'reddit-cfb',
  'd2PbmQcxqRMOPRvs': 'collegefootballnews',
  'ZX6NqXnTRPsqJl24': 'sportingnews-cfb',
  'TC8CR6Epre8sOBbW': 'si-cfb',
  'ftJXlnwUtPK98zMT': 'bleacherreport-cfb',
  'LsKtD2ijrBKLHTPy': 'saturdaydownsouth',
  'L3knSpnVPuEqu9F3': 'on3-cfb',
  'GNRqjlnU2hDoUspd': 'golfdigest',
  'PGlnIglwoK57BFgx': 'pgatour-com',
  'SBEwIpFRnxpFz5yO': 'golfwrx',
  'yoYhJTH3khDR6VnA': 'golfmonthly',
  'Kk2DP7BQ6R63genW': 'si-golf',
  '52JoNIj0uJyAO8Ro': 'si-ufc',
  'DZNQ6V2829Gsq89j': 'mmajunkie',
  '9HbNO7koG4FRO0EZ': 'mmamania',
  '2NV0LB8BpoemNq2N': 'sherdog',
  'X39lxMdIQOjTjP4s': 'mma-core',
  'C3NmUDHJr8cWHBCk': 'ufc-com',
  'sZGhLnyeUeeeDnBs': 'tapology',
  '6KutJNC4K8DelGwZ': 'mmafighting',
  'aScu4PsqcyQ1kfFt': 'ringmagazine-rss',
  'TBwd9L3O8cQywuxX': 'boxingnews24',
  'i1VCLI9hScfbZjgu': 'badlefthook',
  'FpEL1AAFV73VieeD': 'boxingscene',
  'xBIj1RcHaBcd7WfJ': 'boxing247',
  // NewsNow feeds
  'kjurR9A5jgpHvsLg': 'newsnow-nfl',
  'akV2j729WtUvltyb': 'newsnow-nba',
  '3V06VrWkV19SDcqR': 'newsnow-soccer',
  'j3EAnbrpQMEYzW57': 'newsnow-championsleague',
  'V6GJiuM6jBXVG34K': 'newsnow-premierleague',
  'iuBiYyHPmlifaUUK': 'newsnow-mls',
  't8z976udlBJCMLSW': 'newsnow-laliga',
  'HSwo9xgOL1OUFqS0': 'newsnow-seriea',
  'qeqYXeDvgq5bpYsL': 'newsnow-bundesliga',
  '6hu4o6gj1agGCz5i': 'newsnow-facup',
  'AdN94t2aMmFNKpiW': 'newsnow-ligue1',
  'PE7NGL6ftSREkzv9': 'newsnow-nwsl',
  'zRogbCPNliFNNTuM': 'newsnow-f1',
  'Y86rdhcYGEJTzVVE': 'newsnow-europaleague',
  '1miuV1gDF41iBCUm': 'newsnow-ncaabasketball',
  'O8juJbxSctWCFqdV': 'newsnow-ncaafootball',
  'R0LMNrxS5mPorbsV': 'newsnow-pgatour',
  'II7WkAEfi65q8OMI': 'newsnow-ufc',
  '8UNhLRsk0v8buOUz': 'newsnow-boxing',
  'Nh0zQXRLhhvfmuTh': 'newsnow-tennis',
  'vOF2I7lq3n3IsV8K': 'newsnow-nascar',
  'Eaaaqyki6E6nnMZR': 'newsnow-wnba',
  'InHgRAqAOeKlilq8': 'newsnow-livgolf',
  'VkQvfkJZA51pa8EB': 'newsnow-motogp',
  '0afVGov5MVxxBF7B': 'newsnow-lpga',
  'Zo7JsQDXIT8D0pCD': 'newsnow-indycar',
  'VqavgJOoX0LKkfkb': 'newsnow-trackandfield',
  '0zeKHWCVNtBCrCro': 'newsnow-europaconferenceleague',
  // Bundle
  '_QoQmejtlVFZhkOXP': 'nwsl-bundle'
};

async function testFeed(feedId, rssAppId) {
  const url = `${SERVICE_URL}/feeds/${feedId}.xml`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RSS-Feed-Test-Script/1.0'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      return { success: false, status: response.status, error: `HTTP ${response.status}` };
    }
    
    const xml = await response.text();
    
    // Check if it's valid RSS/Atom XML
    if (!xml.includes('<rss') && !xml.includes('<feed')) {
      return { success: false, status: response.status, error: 'Not valid RSS/Atom XML' };
    }
    
    // Count items
    const itemCount = (xml.match(/<item>/g) || []).length + (xml.match(/<entry>/g) || []).length;
    
    if (itemCount === 0) {
      return { success: false, status: response.status, error: 'No items found' };
    }
    
    return { success: true, status: response.status, itemCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testBundle(bundleId, rssAppId) {
  const url = `${SERVICE_URL}/bundle/${bundleId}.xml`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RSS-Feed-Test-Script/1.0'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      return { success: false, status: response.status, error: `HTTP ${response.status}` };
    }
    
    const xml = await response.text();
    
    if (!xml.includes('<rss') && !xml.includes('<feed')) {
      return { success: false, status: response.status, error: 'Not valid RSS/Atom XML' };
    }
    
    const itemCount = (xml.match(/<item>/g) || []).length + (xml.match(/<entry>/g) || []).length;
    
    if (itemCount === 0) {
      return { success: false, status: response.status, error: 'No items found' };
    }
    
    return { success: true, status: response.status, itemCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testAllFeeds() {
  console.log(`\n🧪 Testing ${Object.keys(FEED_MAPPINGS).length} feeds...\n`);
  
  const results = {
    working: [],
    failing: []
  };
  
  for (const [rssAppId, feedId] of Object.entries(FEED_MAPPINGS)) {
    process.stdout.write(`Testing ${feedId}... `);
    
    let result;
    if (feedId.includes('bundle')) {
      result = await testBundle(feedId, rssAppId);
    } else {
      result = await testFeed(feedId, rssAppId);
    }
    
    if (result.success) {
      console.log(`✅ (${result.itemCount} items)`);
      results.working.push({ rssAppId, feedId, itemCount: result.itemCount });
    } else {
      console.log(`❌ ${result.error || 'Failed'}`);
      results.failing.push({ rssAppId, feedId, error: result.error || 'Failed' });
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Working: ${results.working.length}`);
  console.log(`   ❌ Failing: ${results.failing.length}\n`);
  
  if (results.failing.length > 0) {
    console.log(`❌ Failing Feeds:\n`);
    results.failing.forEach(({ rssAppId, feedId, error }) => {
      console.log(`   ${rssAppId} → ${feedId}: ${error}`);
    });
    console.log('');
  }
  
  // Output working feeds for easy copy-paste
  console.log(`✅ Working Feeds (for index.html replacement):\n`);
  results.working.forEach(({ rssAppId, feedId }) => {
    const isBundle = feedId.includes('bundle');
    const newUrl = isBundle 
      ? `https://rss-feed-service-124291936014.us-central1.run.app/bundle/${feedId}.xml`
      : `https://rss-feed-service-124291936014.us-central1.run.app/feeds/${feedId}.xml`;
    console.log(`${rssAppId} → ${newUrl}`);
  });
  
  // Save results to file
  const fs = await import('fs');
  fs.writeFileSync(
    'rss-feed-service/FEED_TEST_RESULTS.json',
    JSON.stringify({ working: results.working, failing: results.failing }, null, 2)
  );
  
  console.log(`\n📄 Results saved to FEED_TEST_RESULTS.json\n`);
  
  return results;
}

testAllFeeds().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

